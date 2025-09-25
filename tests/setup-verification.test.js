/**
 * テスト環境セットアップ検証
 */

describe('テスト環境セットアップ検証', () => {
  it('Jest が正しく動作する', () => {
    expect(1 + 1).toBe(2);
  });

  it('環境変数が設定されている', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('モックが動作する', () => {
    const mockFn = jest.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('非同期テストが動作する', async () => {
    const promise = Promise.resolve('success');
    const result = await promise;
    expect(result).toBe('success');
  });
});