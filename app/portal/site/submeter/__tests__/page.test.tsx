import { render, screen } from '@testing-library/react';
import Page from '../page';
import { getActiveConnectionsByPaytype } from '@/services/dashboard';
import { fetchAllConnections } from '@/services/sites';

// Mock the service functions
jest.mock('@/services/dashboard', () => ({
    getActiveConnectionsByPaytype: jest.fn(),
}));

jest.mock('@/services/sites', () => ({
    fetchAllConnections: jest.fn(),
}));

// Mock the ConnectionTable component
jest.mock('@/components/tables/connection/connection-table', () => ({
    ConnectionTable: jest.fn(() => <div data-testid="mock-connection-table">Connection Table</div>),
}));

describe('Submeter Page', () => {
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
        (fetchAllConnections as jest.Mock).mockResolvedValue(mockConnectionsData);
    });

    it('renders the submeter page with connection table', async () => {
        const page = await Page({ searchParams: mockSearchParams });
        render(page);

        // Check if the page container has the correct ID
        const pageContainer = screen.getByTestId('mock-connection-table').parentElement;
        expect(pageContainer).toHaveAttribute('id', 'submeter');
    });

    it('fetches active connections count with correct paytype', async () => {
        await Page({ searchParams: mockSearchParams });

        expect(getActiveConnectionsByPaytype).toHaveBeenCalledWith({ paytype: -1 });
    });

    it('fetches all connections with correct parameters', async () => {
        await Page({ searchParams: mockSearchParams });

        expect(fetchAllConnections).toHaveBeenCalledWith(
            mockSearchParams,
            { pay_type: -1 }
        );
    });

    it('handles empty search params', async () => {
        await Page({ searchParams: {} });

        expect(fetchAllConnections).toHaveBeenCalledWith(
            {},
            { pay_type: -1 }
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
                payType: 'submeter',
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
        (fetchAllConnections as jest.Mock).mockRejectedValue(new Error('API Error'));

        await expect(Page({ searchParams: mockSearchParams })).rejects.toThrow('API Error');

        consoleErrorSpy.mockRestore();
    });
}); 