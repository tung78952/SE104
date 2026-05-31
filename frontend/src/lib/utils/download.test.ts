import { describe, expect, it, vi, beforeEach } from 'vitest';
import { downloadBlob } from './download';

describe('downloadBlob', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
  });

  it('creates an anchor and clicks it', () => {
    const blob = new Blob(['hi'], { type: 'text/plain' });
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    downloadBlob(blob, 'file.txt');
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(appendSpy).toHaveBeenCalled();
    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.tagName).toBe('A');
    expect(anchor.download).toBe('file.txt');
  });
});
