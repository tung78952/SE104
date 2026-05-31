import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { API_BASE_URL } from '@/lib/api/client';
import { QuestionForm } from './QuestionForm';

function Wrap({ children }: { children: React.ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('QuestionForm', () => {
  it('renders subjects + difficulties and validates noiDung min length', async () => {
    server.use(
      http.get(`${API_BASE_URL}/subjects`, () =>
        HttpResponse.json({
          data: [{ maMon: 'CSDL', tenMon: 'Cơ sở dữ liệu', soTinChi: 4 }],
          total: 1,
          page: 1,
          limit: 500,
        }),
      ),
      http.get(`${API_BASE_URL}/difficulties`, () =>
        HttpResponse.json([{ maDoKho: 1, tenDoKho: 'Dễ' }]),
      ),
    );

    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <Wrap>
        <QuestionForm onSubmit={onSubmit} />
      </Wrap>,
    );

    // Submit empty form — should NOT call onSubmit (validation errors)
    await userEvent.click(screen.getByRole('button', { name: /lưu câu hỏi/i }));
    await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('prefills initial values', () => {
    render(
      <Wrap>
        <QuestionForm
          initial={{ maMon: 'CSDL', maDoKho: 1, noiDung: 'Câu hỏi mẫu có 10+ ký tự' }}
          onSubmit={async () => undefined}
        />
      </Wrap>,
    );
    expect((screen.getByLabelText(/nội dung/i) as HTMLTextAreaElement).value).toMatch(
      /Câu hỏi mẫu/,
    );
  });

  it('Huỷ button calls onCancel', async () => {
    const onCancel = vi.fn();
    render(
      <Wrap>
        <QuestionForm onSubmit={async () => undefined} onCancel={onCancel} />
      </Wrap>,
    );
    fireEvent.click(screen.getByRole('button', { name: /huỷ/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
