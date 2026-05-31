import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { QuestionPicker } from './QuestionPicker';
import { useAuthStore } from '@/lib/auth/store';
import { setMockUser } from '@/mocks/handlers';
import type { TaiKhoan } from '@/types/models';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  Toaster: () => null,
}));

const ADMIN: TaiKhoan = {
  maTK: 1,
  tenDangNhap: 'admin',
  vaiTro: 'admin',
  trangThai: 1,
  maGV: null,
  giangVien: null,
};

function Harness({
  maMon = 'CSDL',
  maxQuestions = 5,
  initial = [],
}: {
  maMon?: string;
  maxQuestions?: number;
  initial?: number[];
}): React.ReactElement {
  const [chosen, setChosen] = useState<number[]>(initial);
  return (
    <>
      <div data-testid="chosen-export">{chosen.join(',')}</div>
      <QuestionPicker
        maMon={maMon}
        maxQuestions={maxQuestions}
        chosenIds={chosen}
        onChange={setChosen}
      />
    </>
  );
}

function renderHarness(props?: Parameters<typeof Harness>[0]): void {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <Harness {...props} />
    </QueryClientProvider>,
  );
}

describe('QuestionPicker', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setAuth('mock-admin-token', ADMIN);
    setMockUser('admin');
  });

  it('shows guidance when no subject is chosen', () => {
    renderHarness({ maMon: '' });
    expect(screen.getByTestId('question-picker-no-subject')).toBeInTheDocument();
  });

  it('loads bank for chosen subject and toggles questions', async () => {
    renderHarness({ maMon: 'CSDL' });
    await waitFor(() => expect(screen.getByText(/3NF/)).toBeInTheDocument());
    expect(screen.getByText(/khoá chính/i)).toBeInTheDocument();

    const user = userEvent.setup();
    const boxes = within(screen.getByTestId('question-bank-list')).getAllByRole('checkbox');
    await user.click(boxes[0]);
    await user.click(boxes[1]);

    expect(screen.getByTestId('chosen-count').textContent).toContain('2 / 5');
    const chosenExport = screen.getByTestId('chosen-export').textContent ?? '';
    expect(chosenExport.split(',').length).toBe(2);
  });

  it('blocks adding past the max limit and warns', async () => {
    renderHarness({ maMon: 'CSDL', maxQuestions: 2 });
    await waitFor(() => expect(screen.getByText(/3NF/)).toBeInTheDocument());
    const user = userEvent.setup();
    const boxes = within(screen.getByTestId('question-bank-list')).getAllByRole('checkbox');
    await user.click(boxes[0]);
    await user.click(boxes[1]);
    expect(screen.getByTestId('picker-limit-warning')).toBeInTheDocument();
    // 3rd checkbox should be disabled
    expect((boxes[2] as HTMLInputElement).disabled).toBe(true);
  });

  it('reorders chosen questions via arrow buttons', async () => {
    renderHarness({ maMon: 'CSDL' });
    await waitFor(() => expect(screen.getByText(/3NF/)).toBeInTheDocument());
    const user = userEvent.setup();
    const boxes = within(screen.getByTestId('question-bank-list')).getAllByRole('checkbox');
    await user.click(boxes[0]); // CH1
    await user.click(boxes[1]); // CH2

    let exported = screen.getByTestId('chosen-export').textContent ?? '';
    const [first, second] = exported.split(',').map(Number);

    // Move the 2nd chosen up
    const upButtons = screen.getAllByRole('button', { name: 'Lên' });
    await act(async () => {
      await user.click(upButtons[upButtons.length - 1]);
    });

    exported = screen.getByTestId('chosen-export').textContent ?? '';
    expect(exported.split(',').map(Number)).toEqual([second, first]);
  });

  it('removes a chosen question via the X button', async () => {
    renderHarness({ maMon: 'CSDL' });
    await waitFor(() => expect(screen.getByText(/3NF/)).toBeInTheDocument());
    const user = userEvent.setup();
    const boxes = within(screen.getByTestId('question-bank-list')).getAllByRole('checkbox');
    await user.click(boxes[0]);
    await user.click(boxes[1]);

    const removeButtons = screen.getAllByRole('button', { name: /xoá khỏi đề/i });
    await user.click(removeButtons[0]);

    expect(
      (screen.getByTestId('chosen-export').textContent ?? '').split(',').filter(Boolean),
    ).toHaveLength(1);
  });
});
