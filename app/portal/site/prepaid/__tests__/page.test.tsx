import Page from '../page';

const mockRedirect = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url)
}));

describe('Prepaid redirect page', () => {
  beforeEach(() => {
    mockRedirect.mockClear();
  });

  it('redirects to infrastructure with paytype=0', async () => {
    await Page({ searchParams: Promise.resolve({}) });
    expect(mockRedirect).toHaveBeenCalledWith('/portal/site?paytype=0');
  });
});
