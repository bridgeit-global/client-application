import Page from '../page';

const mockRedirect = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url)
}));

describe('Postpaid redirect page', () => {
  beforeEach(() => {
    mockRedirect.mockClear();
  });

  it('redirects to infrastructure with paytype=1', async () => {
    await Page({ searchParams: Promise.resolve({ status: '1' }) });
    expect(mockRedirect).toHaveBeenCalledWith('/portal/site?status=1&paytype=1');
  });
});
