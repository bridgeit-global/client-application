import { render, screen } from '@testing-library/react';
import Page from '../page';
import { getActiveConnectionsByPaytype } from '@/services/dashboard';
import { fetchPrepaidConnections } from '@/services/sites';

// Mock the service functions
jest.mock('@/services/dashboard', () => ({
    getActiveConnectionsByPaytype: jest.fn(),
}));

jest.mock('@/services/sites', () => ({
    fetchPrepaidConnections: jest.fn(),
}));

// Mock the ConnectionTable component
jest.mock('@/components/tables/connection/connection-table', () => ({
    ConnectionTable: jest.fn(() => <div data-testid="mock-connection-table">Connection Table</div>),
}));

describe('Prepaid Page', () => {
    const mockSearchParams = {
        page: '1',
        per_page: '10',
        sort: 'created_at',
        order: 'desc',
    };

    const mockActiveCount = { count: 5 };
    const mockConnectionsData = {
        pageCount: 2,
        data: [
            { id: 1, name: 'Connection 1' },
            { id: 2, name: 'Connection 2' },
        ],
        totalCount: 15,
    };

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Setup default mock implementations
        (getActiveConnectionsByPaytype as jest.Mock).mockResolvedValue(mockActiveCount);
        (fetchPrepaidConnections as jest.Mock).mockResolvedValue(mockConnectionsData);
    });

    it('renders the prepaid page with connection table', async () => {
        const page = await Page({ searchParams: mockSearchParams });
        render(page);

        // Check if the page container has the correct ID
        const pageContainer = screen.getByTestId('mock-connection-table').parentElement;
        expect(pageContainer).toHaveAttribute('id', 'prepaid');
    });

    it('fetches active connections count with correct paytype', async () => {
        await Page({ searchParams: mockSearchParams });

        expect(getActiveConnectionsByPaytype).toHaveBeenCalledWith({ paytype: 0 });
    });

    it('fetches all connections with correct parameters', async () => {
        await Page({ searchParams: mockSearchParams });

        expect(fetchPrepaidConnections).toHaveBeenCalledWith(
            mockSearchParams,
            { pay_type: 0 }
        );
    });

    it('handles empty search params', async () => {
        await Page({ searchParams: {} });

        expect(fetchPrepaidConnections).toHaveBeenCalledWith(
            {},
            { pay_type: 0 }
        );
    });

    it('passes correct props to ConnectionTable', async () => {
        const page = await Page({ searchParams: mockSearchParams });
        render(page);

        const connectionTable = screen.getByTestId('mock-connection-table');
        expect(connectionTable).toBeInTheDocument();

        // Verify that ConnectionTable was called with correct props
        expect(require('@/components/tables/connection/connection-table').ConnectionTable)
            .toHaveBeenCalledWith({
                payType: 'prepaid',
                data: mockConnectionsData.data,
                pageCount: mockConnectionsData.pageCount,
                totalCount: mockConnectionsData.totalCount,
                active_count: mockActiveCount.count,
            },
                expect.any(Object)
            );
    });

    it('handles API errors gracefully', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        (getActiveConnectionsByPaytype as jest.Mock).mockRejectedValue(new Error('API Error'));
        (fetchPrepaidConnections as jest.Mock).mockRejectedValue(new Error('API Error'));

        await expect(Page({ searchParams: mockSearchParams })).rejects.toThrow('API Error');

        consoleErrorSpy.mockRestore();
    });
}); 