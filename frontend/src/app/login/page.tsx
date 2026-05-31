'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn, School } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signin } from '@/lib/api/auth';
import { getMe } from '@/lib/api/users';
import { getApiMessage, getApiStatus } from '@/lib/api/errors';
import { useAuthStore } from '@/lib/auth/store';
import { signinSchema, type SigninInput } from '@/lib/schemas/auth';

export default function LoginPage(): React.ReactElement {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<SigninInput>({
    resolver: zodResolver(signinSchema),
    defaultValues: { tenDangNhap: '', matKhau: '' },
  });

  useEffect(() => {
    if (accessToken) {
      router.replace('/dashboard');
    }
  }, [accessToken, router]);

  async function onSubmit(values: SigninInput): Promise<void> {
    try {
      const { accessToken: token } = await signin(values);
      setAccessToken(token);
      const me = await getMe();
      setAuth(token, me);
      toast.success('Đăng nhập thành công');
      router.replace('/dashboard');
    } catch (err) {
      clearAuth();
      const status = getApiStatus(err);
      if (status === 401) {
        const message = getApiMessage(err, 'Tên đăng nhập hoặc mật khẩu không đúng');
        toast.error(message);
        setError('matKhau', { type: 'server', message });
        return;
      }
      toast.error(getApiMessage(err, 'Đăng nhập thất bại, vui lòng thử lại'));
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="w-full max-w-sm rounded-lg border bg-card p-8 shadow-sm"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-md border">
            <School className="h-5 w-5" aria-hidden />
          </div>
          <h1 className="text-base font-medium">Hệ thống Quản lý Thi</h1>
          <p className="mt-1 text-xs text-muted-foreground">SE104 – Đại học Công nghệ Thông tin</p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tenDangNhap">Tên đăng nhập</Label>
            <Input
              id="tenDangNhap"
              type="text"
              autoComplete="username"
              placeholder="Nhập tên đăng nhập..."
              aria-invalid={errors.tenDangNhap ? 'true' : 'false'}
              {...register('tenDangNhap')}
            />
            {errors.tenDangNhap && (
              <p role="alert" className="text-xs text-destructive">
                {errors.tenDangNhap.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="matKhau">Mật khẩu</Label>
            <Input
              id="matKhau"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={errors.matKhau ? 'true' : 'false'}
              {...register('matKhau')}
            />
            {errors.matKhau && (
              <p role="alert" className="text-xs text-destructive">
                {errors.matKhau.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            <LogIn className="h-4 w-4" aria-hidden />
            {isSubmitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </Button>
        </div>
      </form>
    </div>
  );
}
