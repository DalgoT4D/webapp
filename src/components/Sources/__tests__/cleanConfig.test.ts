import { cleanConfig } from '../SourceForm';

describe('cleanConfig', () => {
  it('removes empty-string reader_options', () => {
    const result = cleanConfig({ reader_options: '' });
    expect(result).not.toHaveProperty('reader_options');
  });

  it('preserves non-empty reader_options', () => {
    const result = cleanConfig({ reader_options: '{"sep": ","}' });
    expect(result.reader_options).toBe('{"sep": ","}');
  });

  it('removes empty-string start_date', () => {
    const result = cleanConfig({ start_date: '' });
    expect(result).not.toHaveProperty('start_date');
  });

  it('removes null start_date', () => {
    const result = cleanConfig({ start_date: null });
    expect(result).not.toHaveProperty('start_date');
  });

  it('removes undefined start_date', () => {
    const result = cleanConfig({ start_date: undefined });
    expect(result).not.toHaveProperty('start_date');
  });

  it('preserves valid start_date', () => {
    const result = cleanConfig({ start_date: '2026-01-01' });
    expect(result.start_date).toBe('2026-01-01');
  });

  it('does not mutate the input', () => {
    const input = { reader_options: '', start_date: '', url: 'https://example.com' };
    cleanConfig(input);
    expect(input.reader_options).toBe('');
    expect(input.start_date).toBe('');
  });

  it('passes through unrelated fields untouched', () => {
    const result = cleanConfig({ host: 'localhost', port: 5432, reader_options: '' });
    expect(result).toEqual({ host: 'localhost', port: 5432 });
  });
});
