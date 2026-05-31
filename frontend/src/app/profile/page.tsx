'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Save } from 'lucide-react';
import { toast } from 'sonner';

import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChangePasswordModal } from '@/components/profile/ChangePasswordModal';
import { getMe, updateMe } from '@/lib/api/users';
import { getApiMessage } from '@/lib/api/errors';
import { useAuthStore } from '@/lib/auth/store';
import { ROLE_LABEL } from '@/lib/constants/roles';
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/schemas/auth';

const ME_QUERY_KEY = ['users', 'me'] as const;

export default function ProfilePage(): React.ReactElement {
  const [changePwOpen, setChangePwOpen] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: getMe,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { hoTen: '', email: '', khoaBoMon: '' },
  });

  const me = meQuery.data;

  useEffect(() => {
    if (!me) return;
    reset({
      hoTen: me.giangVien?.hoTen ?? '',
      email: me.giangVien?.email ?? '',
      khoaBoMon: me.giangVien?.khoaBoMon ?? '',
    });
  }, [me, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateProfileInput) =>
      updateMe({
        hoTen: data.hoTen,
        email: data.email,
        khoaBoMon: data.khoaBoMon?.trim() ? data.khoaBoMon : undefined,
      }),
    onSuccess: (updated) => {
      toast.success('Cập nhật thông tin thành công');
      setUser(updated);
      queryClient.setQueryData(ME_QUERY_KEY, updated);
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
    onError: (err) => {
      toast.error(getApiMessage(err, 'Cập nhật thất bại'));
    },
  });

  function onSubmit(values: UpdateProfileInput): void {
    updateMutation.mutate(values);
  }

  return (
    <AppShell title="Hồ sơ cá nhân">
      {meQuery.isLoading || !me ? (
        <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Đang tải hồ sơ…
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <ProfileHeader
            displayName={me.giangVien?.hoTen ?? me.tenDangNhap}
            vaiTroLabel={ROLE_LABEL[me.vaiTro]}
            onOpenChangePassword={() => setChangePwOpen(true)}
          />

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="rounded-lg border bg-card p-5 shadow-sm"
          >
            <SectionTitle>Thông tin chỉ đọc</SectionTitle>
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <ReadOnlyField label="Mã tài khoản" value={String(me.maTK)} testid="maTK" />
              <ReadOnlyField label="Tên đăng nhập" value={me.tenDangNhap} testid="tenDangNhap" />
              <ReadOnlyField label="Vai trò" value={ROLE_LABEL[me.vaiTro]} testid="vaiTro" />
              {me.maGV && <ReadOnlyField label="Mã giảng viên" value={me.maGV} testid="maGV" />}
            </div>

            <SectionTitle>Thông tin có thể chỉnh sửa</SectionTitle>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="hoTen">Họ và tên *</Label>
                <Input
                  id="hoTen"
                  type="text"
                  aria-invalid={errors.hoTen ? 'true' : 'false'}
                  {...register('hoTen')}
                />
                {errors.hoTen && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.hoTen.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  aria-invalid={errors.email ? 'true' : 'false'}
                  {...register('email')}
                />
                {errors.email && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <Label htmlFor="khoaBoMon">Khoa / Bộ môn</Label>
                <Input
                  id="khoaBoMon"
                  type="text"
                  aria-invalid={errors.khoaBoMon ? 'true' : 'false'}
                  {...register('khoaBoMon')}
                />
                {errors.khoaBoMon && (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.khoaBoMon.message}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => meQuery.refetch()}
                disabled={isSubmitting}
              >
                Huỷ
              </Button>
              <Button type="submit" disabled={!isDirty || isSubmitting}>
                <Save className="h-4 w-4" aria-hidden />
                {isSubmitting ? 'Đang lưu…' : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <ChangePasswordModal open={changePwOpen} onOpenChange={setChangePwOpen} />
    </AppShell>
  );
}

interface ProfileHeaderProps {
  displayName: string;
  vaiTroLabel: string;
  onOpenChangePassword: () => void;
}

function ProfileHeader({
  displayName,
  vaiTroLabel,
  onOpenChangePassword,
}: ProfileHeaderProps): React.ReactElement {
  const initials = displayName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(-2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-4 shadow-sm">
      <div
        aria-hidden
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-accent text-sm font-medium"
      >
        {initials || '?'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-medium">{displayName}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center rounded-full border bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider">
            {vaiTroLabel}
          </span>
        </div>
      </div>
      <Button type="button" variant="secondary" onClick={onOpenChangePassword}>
        <Lock className="h-4 w-4" aria-hidden />
        Đổi mật khẩu
      </Button>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="mb-3 border-b pb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </div>
  );
}

interface ReadOnlyFieldProps {
  label: string;
  value: string;
  testid?: string;
}

function ReadOnlyField({ label, value, testid }: ReadOnlyFieldProps): React.ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div
        data-testid={testid ? `profile-${testid}` : undefined}
        className="rounded-md border bg-muted/40 px-2.5 py-1.5 text-sm"
      >
        {value}
      </div>
    </div>
  );
}
