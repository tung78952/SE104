import { describe, expect, it } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { getApiMessage, getApiStatus, isAxiosError } from './errors';

function makeAxiosError(status: number, data: unknown): AxiosError {
  const err = new AxiosError('boom', String(status));
  err.response = {
    status,
    data,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return err;
}

describe('error helpers', () => {
  it('isAxiosError detects axios errors', () => {
    expect(isAxiosError(makeAxiosError(401, {}))).toBe(true);
    expect(isAxiosError(new Error('plain'))).toBe(false);
    expect(isAxiosError(null)).toBe(false);
  });

  it('getApiStatus returns the response status', () => {
    expect(getApiStatus(makeAxiosError(403, {}))).toBe(403);
    expect(getApiStatus(new Error('x'))).toBeUndefined();
  });

  it('getApiMessage extracts a string message', () => {
    const err = makeAxiosError(400, { message: 'Bad input' });
    expect(getApiMessage(err)).toBe('Bad input');
  });

  it('getApiMessage joins an array of messages', () => {
    const err = makeAxiosError(400, { message: ['a', 'b'] });
    expect(getApiMessage(err)).toBe('a, b');
  });

  it('getApiMessage falls back when no message present', () => {
    const err = makeAxiosError(500, {});
    expect(getApiMessage(err, 'fallback')).toBe('fallback');
  });

  it('getApiMessage falls back for non-axios errors', () => {
    expect(getApiMessage(new Error('x'), 'oops')).toBe('oops');
  });
});
