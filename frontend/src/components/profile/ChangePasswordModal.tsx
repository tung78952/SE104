'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Check } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { changePassword } from '@/lib/api/auth';
import { getApiMessage, getApiStatus } from '@/lib/api/errors';
import { changePasswordSchema, type ChangePasswordInput } from '@/lib/schemas/auth';

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordModal({
  open,
  onOpenChange,
}: ChangePasswordModalProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { matKhauCu: '', matKhauMoi: '', xacNhanMatKhauMoi: '' },
  });

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  async function onSubmit(values: ChangePasswordInput): Promise<void> {
    try {
      await changePassword({
        matKhauCu: values.matKhauCu,
        matKhauMoi: values.matKhauMoi,
      });
      toast.success('Đổi mật khẩu thành công');
      onOpenChange(false);
    } catch (err) {
      const status = getApiStatus(err);
      const message = getApiMessage(err, 'Đổi mật khẩu thất bại');
      if (status === 400 || status === 401) {
        setError('matKhauCu', { type: 'server', message: 'Mật khẩu cũ không chính xác' });
        return;
      }
      toast.error(message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4" aria-hidden /> Đổi mật khẩu
          </DialogTitle>
        </DialogHeader>

        <form
          id="change-password-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="matKhauCu">Mật khẩu hiện tại *</Label>
            <Input
              id="matKhauCu"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={errors.matKhauCu ? 'true' : 'false'}
              {...register('matKhauCu')}
            />
            {errors.matKhauCu && (
              <p role="alert" className="text-xs text-destructive">
                {errors.matKhauCu.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="matKhauMoi">Mật khẩu mới *</Label>
            <Input
              id="matKhauMoi"
              type="password"
              autoComplete="new-password"
              placeholder="Tối thiểu 8 ký tự"
              aria-invalid={errors.matKhauMoi ? 'true' : 'false'}
              {...register('matKhauMoi')}
            />
            {errors.matKhauMoi && (
              <p role="alert" className="text-xs text-destructive">
                {errors.matKhauMoi.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="xacNhanMatKhauMoi">Xác nhận mật khẩu mới *</Label>
            <Input
              id="xacNhanMatKhauMoi"
              type="password"
              autoComplete="new-password"
              placeholder="Nhập lại mật khẩu mới"
              aria-invalid={errors.xacNhanMatKhauMoi ? 'true' : 'false'}
              {...register('xacNhanMatKhauMoi')}
            />
            {errors.xacNhanMatKhauMoi && (
              <p role="alert" className="text-xs text-destructive">
                {errors.xacNhanMatKhauMoi.message}
              </p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Huỷ
          </Button>
          <Button type="submit" form="change-password-form" disabled={isSubmitting}>
            <Check className="h-4 w-4" aria-hidden />
            {isSubmitting ? 'Đang cập nhật…' : 'Cập nhật'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
