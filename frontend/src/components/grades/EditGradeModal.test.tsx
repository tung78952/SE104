import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EditGradeModal } from './EditGradeModal';
import type { BangDiem } from '@/types/models';

function Wrap({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

const grade: BangDiem = {
  maBangDiem: 1,
  maSV: 'SV001',
  maLop: 'CS01',
  maDeThi: 7,
  hocKy: 1,
  namHoc: '2025-2026',
  diemSo: 7.5,
  ghiChu: '',
  sinhVien: { maSV: 'SV001', hoTen: 'Nguyễn A', maLop: 'CS01' },
};

describe('EditGradeModal', () => {
  it('prefills from the grade prop and submits patched fields', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <Wrap>
        <EditGradeModal open grade={grade} onOpenChange={() => undefined} onSubmit={onSubmit} />
      </Wrap>,
    );

    const diemInput = await screen.findByLabelText(/điểm số/i);
    expect((diemInput as HTMLInputElement).value).toBe('7.5');

    fireEvent.change(diemInput, { target: { value: '9' } });
    await userEvent.click(screen.getByRole('button', { name: /^lưu$/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ diemSo: 9, hocKy: 1 });
  });

  it('shows fallback title when grade is null', () => {
    render(
      <Wrap>
        <EditGradeModal
          open
          grade={null}
          onOpenChange={() => undefined}
          onSubmit={async () => undefined}
        />
      </Wrap>,
    );
    expect(screen.getByRole('heading', { name: /^sửa điểm$/i })).toBeInTheDocument();
  });
});
