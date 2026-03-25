import Page from '../page';

const mockRedirect = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url)
}));

describe('Sites redirect page', () => {
  beforeEach(() => {
    mockRedirect.mockClear();
  });

  it('redirects to /portal/site preserving query string', async () => {
    await Page({
      searchParams: Promise.resolve({ page: '2', type: 'COCO' })
    });
    expect(mockRedirect).toHaveBeenCalledWith('/portal/site?page=2&type=COCO');
  });

  it('redirects to /portal/site when no params', async () => {
    await Page({ searchParams: Promise.resolve({}) });
    expect(mockRedirect).toHaveBeenCalledWith('/portal/site');
  });
});
