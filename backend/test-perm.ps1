$ErrorActionPreference = 'Continue'
$BASE = 'http://localhost:5001'

$results = New-Object System.Collections.ArrayList

function Add-Result {
  param($id, $desc, $expected, $actual, $msg = '')
  $pass = ($actual -eq $expected) -or ($expected -is [int[]] -and $actual -in $expected)
  $expStr = if ($expected -is [int[]]) { $expected -join '|' } else { "$expected" }
  $sym = if ($pass) { 'PASS' } else { 'FAIL' }
  $null = $results.Add([PSCustomObject]@{
    ID=$id; Desc=$desc; Expected=$expStr; Actual="$actual"; Status=$sym; Msg=$msg
  })
  Write-Host ("{0,-5} {1,-50} exp={2,-7} got={3,-7} {4}" -f $id, $desc, $expStr, $actual, $sym)
}

function Invoke-Test {
  param([string]$Method, [string]$Path, [string]$Token = $null, $Body = $null)
  $headers = @{}
  if ($Token) { $headers['Authorization'] = "Bearer $Token" }
  $params = @{
    Uri = "$BASE$Path"; Method = $Method; Headers = $headers
    UseBasicParsing = $true; ErrorAction = 'Stop'
  }
  if ($Body -ne $null) {
    $params['ContentType'] = 'application/json'
    $params['Body'] = ($Body | ConvertTo-Json -Compress -Depth 6)
  }
  try {
    $resp = Invoke-WebRequest @params
    return @{ Code = $resp.StatusCode; Body = $resp.Content }
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    $bodyTxt = ''
    try {
      $stream = $_.Exception.Response.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($stream)
      $bodyTxt = $reader.ReadToEnd()
    } catch {}
    return @{ Code = $code; Body = $bodyTxt; Error = $_.Exception.Message }
  }
}

Write-Host "=========================================="
Write-Host " SETUP: tokens + test users"
Write-Host "=========================================="

$r = Invoke-Test -Method Post -Path '/auth/signin' -Body @{tenDangNhap='admin';matKhau='admin123'}
if ($r.Code -ne 200) { Write-Host "FATAL: admin signin: $($r.Code) $($r.Body)"; exit 1 }
$ADMIN = ($r.Body | ConvertFrom-Json).accessToken
Write-Host "admin token OK"

$r = Invoke-Test -Method Post -Path '/auth/signin' -Body @{tenDangNhap='gv_thien';matKhau='123456'}
if ($r.Code -ne 200) { Write-Host "FATAL: gv_thien signin: $($r.Code) $($r.Body)"; exit 1 }
$GV_THIEN = ($r.Body | ConvertFrom-Json).accessToken
Write-Host "gv_thien token OK"

$signupBody = @{tenDangNhap='gv_minh';matKhau='123456';vaiTro='giaovien';hoTen='Tran Minh';email='minh@uit.edu.vn';khoaBoMon='CNPM'}
$r = Invoke-Test -Method Post -Path '/auth/signup' -Token $ADMIN -Body $signupBody
Write-Host "gv_minh signup: $($r.Code)"

$r = Invoke-Test -Method Post -Path '/auth/signin' -Body @{tenDangNhap='gv_minh';matKhau='123456'}
if ($r.Code -ne 200) { Write-Host "FATAL: gv_minh signin: $($r.Code) $($r.Body)"; exit 1 }
$GV_MINH = ($r.Body | ConvertFrom-Json).accessToken
Write-Host "gv_minh token OK"

Write-Host ""
Write-Host "=========================================="
Write-Host " GROUP A - QUESTIONS"
Write-Host "=========================================="

$r = Invoke-Test -Method Post -Path '/questions' -Token $ADMIN -Body @{noiDung='X';maMon='SE104';maDoKho=1}
Add-Result 'A1' 'admin POST /questions' 403 $r.Code

$r = Invoke-Test -Method Post -Path '/questions' -Token $GV_THIEN -Body @{noiDung='Cau test 1';maMon='SE104';maDoKho=1}
Add-Result 'A2' 'gv_thien POST /questions' 201 $r.Code
$Q_ID = if ($r.Code -eq 201) { ($r.Body | ConvertFrom-Json).maCauHoi } else { $null }
Write-Host "  maCauHoi=$Q_ID"

if ($Q_ID) {
  $r = Invoke-Test -Method Patch -Path "/questions/$Q_ID" -Token $ADMIN -Body @{noiDung='Admin sua'}
  Add-Result 'A3' 'admin PATCH /questions/:id' 403 $r.Code
}

if ($Q_ID) {
  $r = Invoke-Test -Method Delete -Path "/questions/$Q_ID" -Token $ADMIN
  Add-Result 'A4' 'admin DELETE /questions/:id' 403 $r.Code
}

if ($Q_ID) {
  $r = Invoke-Test -Method Patch -Path "/questions/$Q_ID" -Token $GV_MINH -Body @{noiDung='GV2 sua'}
  $msg = if ($r.Body) { ($r.Body | ConvertFrom-Json -ErrorAction SilentlyContinue).message } else { '' }
  Add-Result 'A5' 'gv_minh PATCH /questions (not owner)' 403 $r.Code $msg
}

if ($Q_ID) {
  $r = Invoke-Test -Method Patch -Path "/questions/$Q_ID" -Token $GV_THIEN -Body @{noiDung='gv_thien sua OK'}
  Add-Result 'A6' 'gv_thien PATCH /questions (owner)' 200 $r.Code
}

Write-Host ""
Write-Host "=========================================="
Write-Host " GROUP B - EXAMS"
Write-Host "=========================================="

$extra = New-Object System.Collections.ArrayList
foreach ($i in 1..5) {
  $r = Invoke-Test -Method Post -Path '/questions' -Token $GV_THIEN -Body @{noiDung="Cau phu $i";maMon='SE104';maDoKho=1}
  if ($r.Code -eq 201) { $null = $extra.Add(($r.Body | ConvertFrom-Json).maCauHoi) }
}
Write-Host "  Created $($extra.Count) extra questions: $($extra -join ',')"

$qList = @($extra[0..2])
$r = Invoke-Test -Method Post -Path '/exams' -Token $ADMIN -Body @{hocKy=1;namHoc='2025-2026';thoiLuong=60;maMon='SE104';danhSachMaCauHoi=$qList}
Add-Result 'B2' 'admin POST /exams' 403 $r.Code

$qList6 = @(1,2,3) + $extra[0..2]
$r = Invoke-Test -Method Post -Path '/exams' -Token $GV_THIEN -Body @{hocKy=1;namHoc='2025-2026';thoiLuong=60;maMon='SE104';danhSachMaCauHoi=$qList6}
$msg = if ($r.Body) { ($r.Body | ConvertFrom-Json -ErrorAction SilentlyContinue).message } else { '' }
Add-Result 'B3' 'gv_thien POST /exams 6 cau' 400 $r.Code $msg

$r = Invoke-Test -Method Post -Path '/exams' -Token $GV_THIEN -Body @{hocKy=1;namHoc='2025-2026';thoiLuong=20;maMon='SE104';danhSachMaCauHoi=@(1,2,3)}
$msg = if ($r.Body) { ($r.Body | ConvertFrom-Json -ErrorAction SilentlyContinue).message } else { '' }
Add-Result 'B4' 'gv_thien POST /exams thoiLuong=20' 400 $r.Code $msg

$r = Invoke-Test -Method Post -Path '/exams' -Token $GV_THIEN -Body @{hocKy=1;namHoc='2025-2026';thoiLuong=200;maMon='SE104';danhSachMaCauHoi=@(1,2,3)}
$msg = if ($r.Body) { ($r.Body | ConvertFrom-Json -ErrorAction SilentlyContinue).message } else { '' }
Add-Result 'B5' 'gv_thien POST /exams thoiLuong=200' 400 $r.Code $msg

$r = Invoke-Test -Method Post -Path '/exams' -Token $GV_THIEN -Body @{hocKy=1;namHoc='2025-2026';thoiLuong=60;maMon='SE104';danhSachMaCauHoi=@(1,2,3)}
Add-Result 'B6' 'gv_thien POST /exams (valid)' 201 $r.Code
$EXAM_ID = if ($r.Code -eq 201) { ($r.Body | ConvertFrom-Json).maDeThi } else { $null }
Write-Host "  maDeThi=$EXAM_ID"

if ($EXAM_ID) {
  $r = Invoke-Test -Method Delete -Path "/exams/$EXAM_ID" -Token $ADMIN
  Add-Result 'B7' 'admin DELETE /exams/:id' 403 $r.Code
}

if ($EXAM_ID) {
  $r = Invoke-Test -Method Delete -Path "/exams/$EXAM_ID" -Token $GV_MINH
  $msg = if ($r.Body) { ($r.Body | ConvertFrom-Json -ErrorAction SilentlyContinue).message } else { '' }
  Add-Result 'B8' 'gv_minh DELETE /exams (not owner)' 403 $r.Code $msg
}

Write-Host ""
Write-Host "=========================================="
Write-Host " GROUP C - GRADES"
Write-Host "=========================================="

$r = Invoke-Test -Method Post -Path '/grades' -Token $ADMIN -Body @{maSV='21520001';maLop='SE104.O21';maDeThi=$EXAM_ID;hocKy=1;namHoc='2025-2026';diemSo=5}
Add-Result 'C1' 'admin POST /grades' 403 $r.Code

$r = Invoke-Test -Method Post -Path '/grades' -Token $GV_THIEN -Body @{maSV='21520001';maLop='SE104.O21';maDeThi=$EXAM_ID;hocKy=1;namHoc='2025-2026';diemSo=11}
$msg = if ($r.Body) { ($r.Body | ConvertFrom-Json -ErrorAction SilentlyContinue).message } else { '' }
Add-Result 'C2' 'gv_thien POST /grades diemSo=11' 400 $r.Code $msg

$r = Invoke-Test -Method Post -Path '/grades' -Token $GV_THIEN -Body @{maSV='21520001';maLop='SE104.O21';maDeThi=$EXAM_ID;hocKy=1;namHoc='2025-2026';diemSo=-1}
$msg = if ($r.Body) { ($r.Body | ConvertFrom-Json -ErrorAction SilentlyContinue).message } else { '' }
Add-Result 'C3' 'gv_thien POST /grades diemSo=-1' 400 $r.Code $msg

$r = Invoke-Test -Method Post -Path '/grades' -Token $GV_THIEN -Body @{maSV='21520001';maLop='SE104.O21';maDeThi=$EXAM_ID;hocKy=1;namHoc='2025-2026';diemSo=8.5}
Add-Result 'C4' 'gv_thien POST /grades diemSo=8.5' 201 $r.Code
$G_ID = if ($r.Code -eq 201) { ($r.Body | ConvertFrom-Json).maBangDiem } else { 1 }

$r = Invoke-Test -Method Delete -Path "/grades/$G_ID" -Token $ADMIN
Add-Result 'C5' 'admin DELETE /grades/:id (route gone)' 404 $r.Code

$r = Invoke-Test -Method Delete -Path "/grades/$G_ID" -Token $GV_THIEN
Add-Result 'C6' 'gv_thien DELETE /grades/:id (route gone)' 404 $r.Code

Write-Host ""
Write-Host "=========================================="
Write-Host " GROUP D - REGULATIONS"
Write-Host "=========================================="

$r = Invoke-Test -Method Get -Path '/regulations' -Token $ADMIN
$count = if ($r.Code -eq 200) { (($r.Body | ConvertFrom-Json) | Measure-Object).Count } else { 0 }
Add-Result 'D1' "admin GET /regulations (count=$count)" 200 $r.Code

$r = Invoke-Test -Method Get -Path '/regulations' -Token $GV_THIEN
Add-Result 'D2' 'gv_thien GET /regulations' 200 $r.Code

$r = Invoke-Test -Method Post -Path '/regulations' -Token $ADMIN -Body @{tenThamSo='DiemDat';giaTri='5';moTa='test'}
Add-Result 'D3' 'admin POST /regulations' 201 $r.Code

$r = Invoke-Test -Method Post -Path '/regulations' -Token $GV_THIEN -Body @{tenThamSo='X';giaTri='1'}
Add-Result 'D4' 'gv_thien POST /regulations' 403 $r.Code

$r = Invoke-Test -Method Patch -Path '/regulations/DiemDat' -Token $ADMIN -Body @{giaTri='6'}
Add-Result 'D5' 'admin PATCH /regulations/DiemDat' 200 $r.Code

$r = Invoke-Test -Method Patch -Path '/regulations/DiemDat' -Token $GV_THIEN -Body @{giaTri='7'}
Add-Result 'D6' 'gv_thien PATCH /regulations/DiemDat' 403 $r.Code

$r = Invoke-Test -Method Delete -Path '/regulations/DiemDat' -Token $ADMIN
Add-Result 'D7' 'admin DELETE /regulations (route gone)' 404 $r.Code

Write-Host ""
Write-Host "=========================================="
Write-Host " GROUP E - RULE ENGINE REACTIVITY"
Write-Host "=========================================="

$r = Invoke-Test -Method Patch -Path '/regulations/SoCauToiDa' -Token $ADMIN -Body @{giaTri='3'}
Add-Result 'E1' 'admin PATCH SoCauToiDa=3' 200 $r.Code

$qList5 = @(1,2,3) + $extra[0..1]
$r = Invoke-Test -Method Post -Path '/exams' -Token $GV_THIEN -Body @{hocKy=2;namHoc='2025-2026';thoiLuong=60;maMon='SE104';danhSachMaCauHoi=$qList5}
$msg = if ($r.Body) { ($r.Body | ConvertFrom-Json -ErrorAction SilentlyContinue).message } else { '' }
Add-Result 'E2' 'gv_thien POST /exams 5 cau (new limit=3)' 400 $r.Code $msg

$r = Invoke-Test -Method Patch -Path '/regulations/SoCauToiDa' -Token $ADMIN -Body @{giaTri='5'}
Add-Result 'E3' 'admin PATCH SoCauToiDa=5 (restore)' 200 $r.Code

Write-Host ""
Write-Host "=========================================="
Write-Host " GROUP F - SYSTEM MODULES"
Write-Host "=========================================="

$r = Invoke-Test -Method Get -Path '/subjects' -Token $GV_THIEN
Add-Result 'F1' 'gv_thien GET /subjects' 200 $r.Code

$r = Invoke-Test -Method Post -Path '/subjects' -Token $GV_THIEN -Body @{maMon='ZZ999';tenMon='Test';soTinChi=3}
Add-Result 'F2' 'gv_thien POST /subjects' 403 $r.Code

$r = Invoke-Test -Method Get -Path '/reports/exams-by-subject?namHoc=2025-2026' -Token $GV_THIEN
Add-Result 'F3' 'gv_thien GET /reports/exams-by-subject' 200 $r.Code

Write-Host ""
Write-Host "=========================================="
Write-Host " SUMMARY"
Write-Host "=========================================="
$total = $results.Count
$pass = ($results | Where-Object { $_.Status -eq 'PASS' }).Count
$fail = $total - $pass
Write-Host ("Total: {0}    PASS: {1}    FAIL: {2}" -f $total, $pass, $fail)

if ($fail -gt 0) {
  Write-Host ""
  Write-Host "=== FAILED TESTS ==="
  $results | Where-Object { $_.Status -eq 'FAIL' } | ForEach-Object {
    Write-Host ("{0} {1}" -f $_.ID, $_.Desc)
    Write-Host ("    expected={0}  actual={1}" -f $_.Expected, $_.Actual)
    if ($_.Msg) { Write-Host ("    msg={0}" -f $_.Msg) }
  }
}

Write-Host ""
Write-Host "=== FULL TABLE ==="
$results | Format-Table -AutoSize -Wrap | Out-String -Width 200
