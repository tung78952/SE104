'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormModal } from '@/components/common';
import {
  userCreateSchema,
  userUpdateSchema,
  type UserCreateInput,
  type UserUpdateInput,
} from '@/lib/schemas/catalog';
import type { TaiKhoan, VaiTro } from '@/types/models';

const FORM_ID = 'user-form';

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  initial?: TaiKhoan | null;
  onSubmit: (data: UserCreateInput | UserUpdateInput) => Promise<void>;
  submitting?: boolean;
}

export function UserForm(props: UserFormProps): React.ReactElement {
  return props.mode === 'create' ? <CreateForm {...props} /> : <EditForm {...props} />;
}

function CreateForm({
  open,
  onOpenChange,
  onSubmit,
  submitting,
}: UserFormProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<UserCreateInput>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      tenDangNhap: '',
      matKhau: '',
      vaiTro: 'giaovien',
      hoTen: '',
      email: '',
      khoaBoMon: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        tenDangNhap: '',
        matKhau: '',
        vaiTro: 'giaovien',
        hoTen: '',
        email: '',
        khoaBoMon: '',
      });
    }
  }, [open, reset]);

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Thêm tài khoản"
      formId={FORM_ID}
      submitting={submitting}
    >
      <form
        id={FORM_ID}
        noValidate
        onSubmit={handleSubmit((d) => onSubmit(d))}
        className="flex flex-col gap-3"
      >
        <FormField id="tenDangNhap" label="Tên đăng nhập *" error={errors.tenDangNhap?.message}>
          <Input id="tenDangNhap" type="text" {...register('tenDangNhap')} />
        </FormField>
        <FormField id="matKhau" label="Mật khẩu *" error={errors.matKhau?.message}>
          <Input
            id="matKhau"
            type="password"
            autoComplete="new-password"
            {...register('matKhau')}
          />
        </FormField>
        <FormField id="vaiTro" label="Vai trò *" error={errors.vaiTro?.message}>
          <Controller
            control={control}
            name="vaiTro"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v: unknown) => field.onChange(v as VaiTro)}
              >
                <SelectTrigger id="vaiTro" className="w-full">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                  <SelectItem value="giaovien">Giảng viên</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField id="hoTen" label="Họ tên *" error={errors.hoTen?.message}>
          <Input id="hoTen" type="text" {...register('hoTen')} />
        </FormField>
        <FormField id="email" label="Email *" error={errors.email?.message}>
          <Input id="email" type="email" {...register('email')} />
        </FormField>
        <FormField id="khoaBoMon" label="Khoa / Bộ môn" error={errors.khoaBoMon?.message}>
          <Input id="khoaBoMon" type="text" {...register('khoaBoMon')} />
        </FormField>
      </form>
    </FormModal>
  );
}

function EditForm({
  open,
  onOpenChange,
  initial,
  onSubmit,
  submitting,
}: UserFormProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<UserUpdateInput>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      vaiTro: 'giaovien',
      trangThai: 1,
      hoTen: '',
      email: '',
    },
  });

  useEffect(() => {
    if (open && initial) {
      reset({
        vaiTro: initial.vaiTro,
        trangThai: initial.trangThai,
        hoTen: initial.giangVien?.hoTen ?? '',
        email: initial.giangVien?.email ?? '',
      });
    }
  }, [open, initial, reset]);

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title="Sửa tài khoản"
      formId={FORM_ID}
      submitting={submitting}
    >
      <form
        id={FORM_ID}
        noValidate
        onSubmit={handleSubmit((d) => onSubmit(d))}
        className="flex flex-col gap-3"
      >
        <FormField id="vaiTro" label="Vai trò *" error={errors.vaiTro?.message}>
          <Controller
            control={control}
            name="vaiTro"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v: unknown) => field.onChange(v as VaiTro)}
              >
                <SelectTrigger id="vaiTro" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                  <SelectItem value="giaovien">Giảng viên</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField id="trangThai" label="Trạng thái *" error={errors.trangThai?.message}>
          <Controller
            control={control}
            name="trangThai"
            render={({ field }) => (
              <Select
                value={String(field.value)}
                onValueChange={(v: unknown) =>
                  field.onChange(typeof v === 'string' ? Number(v) : 0)
                }
              >
                <SelectTrigger id="trangThai" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Hoạt động</SelectItem>
                  <SelectItem value="0">Đã khoá</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </FormField>
        <FormField id="hoTen" label="Họ tên *" error={errors.hoTen?.message}>
          <Input id="hoTen" type="text" {...register('hoTen')} />
        </FormField>
        <FormField id="email" label="Email *" error={errors.email?.message}>
          <Input id="email" type="email" {...register('email')} />
        </FormField>
      </form>
    </FormModal>
  );
}

function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
