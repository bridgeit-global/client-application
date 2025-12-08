import { render, screen } from '@testing-library/react';
import Page from '../page';
import { getActiveSites } from '@/services/dashboard';
import { fetchAllSites } from '@/services/sites';

// Mock the service functions
jest.mock('@/services/dashboard', () => ({
    getActiveSites: jest.fn(),
}));

jest.mock('@/services/sites', () => ({
    fetchAllSites: jest.fn(),
}));

// Mock the SiteTable component
jest.mock('@/components/tables/site/site-table', () => ({
    SiteTable: jest.fn(({ data, pageCount, totalCount, active_count }) => (
        <div data-testid="mock-site-table">
            <div data-testid="site-table-data-count">{data?.length || 0}</div>
            <div data-testid="site-table-page-count">{pageCount}</div>
            <div data-testid="site-table-total-count">{totalCount}</div>
            <div data-testid="site-table-active-count">{active_count}</div>
        </div>
    )),
}));

describe('Sites Page', () => {
    const mockSearchParams = {
        page: '1',
        limit: '10',
        sort: 'created_at',
        order: 'desc',
    };

    const mockActiveCount = { count: 5, error: null };
    const mockSitesData = {
        pageCount: 2,
        data: [
            {
                id: 1,
                name: 'Site 1',
                type: 'COCO',
                zone_id: 'zone1',
                created_at: '2024-01-01T00:00:00Z',
                connections: []
            },
            {
                id: 2,
                name: 'Site 2',
                type: 'POCO',
                zone_id: 'zone2',
                created_at: '2024-01-02T00:00:00Z',
                connections: []
            },
        ],
        totalCount: 15,
    };

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Setup default mock implementations
        (getActiveSites as jest.Mock).mockResolvedValue(mockActiveCount);
        (fetchAllSites as jest.Mock).mockResolvedValue(mockSitesData);
    });

    it('renders the sites page with site table', async () => {
        const page = await Page({ searchParams: Promise.resolve(mockSearchParams) });
        render(page);

        // Check if the SiteTable component is rendered
        const siteTable = screen.getByTestId('mock-site-table');
        expect(siteTable).toBeInTheDocument();
    });

    it('fetches active sites count', async () => {
        await Page({ searchParams: Promise.resolve(mockSearchParams) });

        expect(getActiveSites).toHaveBeenCalledTimes(1);
    });

    it('fetches all sites with correct parameters', async () => {
        await Page({ searchParams: Promise.resolve(mockSearchParams) });

        expect(fetchAllSites).toHaveBeenCalledTimes(1);
        expect(fetchAllSites).toHaveBeenCalledWith({
            ...mockSearchParams,
            status: '1'
        });
    });

    it('handles empty search params', async () => {
        await Page({ searchParams: Promise.resolve({}) });

        expect(fetchAllSites).toHaveBeenCalledWith({
            status: '1'
        });
    });

    it('passes correct props to SiteTable', async () => {
        const page = await Page({ searchParams: Promise.resolve(mockSearchParams) });
        render(page);

        // Verify that SiteTable was called with correct props
        const SiteTableMock = require('@/components/tables/site/site-table').SiteTable;
        expect(SiteTableMock).toHaveBeenCalledWith({
            data: mockSitesData.data,
            pageCount: mockSitesData.pageCount,
            totalCount: mockSitesData.totalCount,
            active_count: mockActiveCount.count,
        }, undefined);

        // Verify the rendered content shows correct values
        expect(screen.getByTestId('site-table-data-count')).toHaveTextContent('2');
        expect(screen.getByTestId('site-table-page-count')).toHaveTextContent('2');
        expect(screen.getByTestId('site-table-total-count')).toHaveTextContent('15');
        expect(screen.getByTestId('site-table-active-count')).toHaveTextContent('5');
    });

    it('handles API errors gracefully for getActiveSites', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        (getActiveSites as jest.Mock).mockRejectedValue(new Error('Active sites API Error'));

        await expect(Page({ searchParams: Promise.resolve(mockSearchParams) })).rejects.toThrow('Active sites API Error');

        consoleErrorSpy.mockRestore();
    });

    it('handles API errors gracefully for fetchAllSites', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        (fetchAllSites as jest.Mock).mockRejectedValue(new Error('Fetch sites API Error'));

        await expect(Page({ searchParams: Promise.resolve(mockSearchParams) })).rejects.toThrow('Fetch sites API Error');

        consoleErrorSpy.mockRestore();
    });

    it('handles empty data from services', async () => {
        const emptyActiveCount = { count: 0, error: null };
        const emptySitesData = {
            pageCount: 0,
            data: [],
            totalCount: 0,
        };

        (getActiveSites as jest.Mock).mockResolvedValue(emptyActiveCount);
        (fetchAllSites as jest.Mock).mockResolvedValue(emptySitesData);

        const page = await Page({ searchParams: Promise.resolve(mockSearchParams) });
        render(page);

        // Verify that SiteTable was called with empty data
        const SiteTableMock = require('@/components/tables/site/site-table').SiteTable;
        expect(SiteTableMock).toHaveBeenCalledWith({
            data: [],
            pageCount: 0,
            totalCount: 0,
            active_count: 0,
        }, undefined);

        // Verify the rendered content shows zero values
        expect(screen.getByTestId('site-table-data-count')).toHaveTextContent('0');
        expect(screen.getByTestId('site-table-page-count')).toHaveTextContent('0');
        expect(screen.getByTestId('site-table-total-count')).toHaveTextContent('0');
        expect(screen.getByTestId('site-table-active-count')).toHaveTextContent('0');
    });

    it('handles different search parameter combinations', async () => {
        const complexSearchParams = {
            page: '2',
            limit: '20',
            name: 'Test Site',
            type: 'COCO',
            zone_id: 'zone1',
            status: '1',
            created_at_start: '2024-01-01',
            created_at_end: '2024-12-31',
        };

        await Page({ searchParams: Promise.resolve(complexSearchParams) });

        expect(fetchAllSites).toHaveBeenCalledWith(complexSearchParams);
    });
}); 