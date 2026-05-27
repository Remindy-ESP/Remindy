import { supportService } from '@/modules/support/infrastructure/supportApi';
import apiClient from '@/shared/infrastructure/apiClient';
import type { CreateTicketRequest, SupportTicketCategory } from '@/modules/support/infrastructure/supportApi';

jest.mock('@/shared/infrastructure/apiClient', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockAxiosInstance,
    apiClient: {},
  };
});

const mockClient = apiClient as jest.Mocked<typeof apiClient>;

describe('SupportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTicketSummary = {
    id: 'ticket-1',
    subject: 'Test issue',
    status: 'open' as const,
    category: 'technical' as SupportTicketCategory,
    createdAt: '2026-01-01T00:00:00.000Z',
    lastReplyAt: null,
  };

  const mockTicketDetail = {
    ...mockTicketSummary,
    priority: 'medium',
    messages: [
      {
        id: 'msg-1',
        authorType: 'user' as const,
        body: 'Hello, I have an issue',
        createdAt: '2026-01-01T00:00:00.000Z',
        author: { id: 'user-1', email: 'user@test.com', firstName: 'John', lastName: 'Doe' },
      },
    ],
  };

  describe('getCategories', () => {
    it('returns the list of categories', async () => {
      const categories: SupportTicketCategory[] = ['technical', 'billing', 'bug'];
      mockClient.get.mockResolvedValueOnce({ data: categories });

      const result = await supportService.getCategories();

      expect(mockClient.get).toHaveBeenCalledWith('/support/tickets/categories');
      expect(result).toEqual(categories);
    });

    it('throws on network error', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(supportService.getCategories()).rejects.toThrow('Network error');
    });
  });

  describe('create', () => {
    const createData: CreateTicketRequest = {
      subject: 'My issue',
      message: 'Detailed description of the issue',
      category: 'technical',
    };

    it('creates a ticket and returns ticket detail', async () => {
      mockClient.post.mockResolvedValueOnce({ data: mockTicketDetail });

      const result = await supportService.create(createData);

      expect(mockClient.post).toHaveBeenCalledWith('/support/tickets', createData);
      expect(result.id).toBe('ticket-1');
      expect(result.subject).toBe('Test issue');
    });

    it('creates a ticket without category', async () => {
      const dataWithoutCategory: CreateTicketRequest = {
        subject: 'My issue',
        message: 'Description',
      };
      mockClient.post.mockResolvedValueOnce({ data: mockTicketDetail });

      await supportService.create(dataWithoutCategory);

      expect(mockClient.post).toHaveBeenCalledWith('/support/tickets', dataWithoutCategory);
    });

    it('throws on server error', async () => {
      mockClient.post.mockRejectedValueOnce(new Error('Internal server error'));

      await expect(supportService.create(createData)).rejects.toThrow('Internal server error');
    });
  });

  describe('listMine', () => {
    const mockPage = {
      items: [mockTicketSummary],
      total: 1,
      page: 1,
      limit: 50,
    };

    it('returns paginated ticket list', async () => {
      mockClient.get.mockResolvedValueOnce({ data: mockPage });

      const result = await supportService.listMine();

      expect(mockClient.get).toHaveBeenCalledWith('/support/tickets/me', { params: undefined });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('passes query params when provided', async () => {
      mockClient.get.mockResolvedValueOnce({ data: mockPage });

      await supportService.listMine({ status: 'open', page: 2, limit: 10 });

      expect(mockClient.get).toHaveBeenCalledWith('/support/tickets/me', {
        params: { status: 'open', page: 2, limit: 10 },
      });
    });

    it('throws on network error', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('Network error'));

      await expect(supportService.listMine()).rejects.toThrow('Network error');
    });
  });

  describe('getById', () => {
    it('returns the full ticket detail', async () => {
      mockClient.get.mockResolvedValueOnce({ data: mockTicketDetail });

      const result = await supportService.getById('ticket-1');

      expect(mockClient.get).toHaveBeenCalledWith('/support/tickets/ticket-1');
      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].body).toBe('Hello, I have an issue');
    });

    it('throws when ticket is not found', async () => {
      mockClient.get.mockRejectedValueOnce(new Error('Not found'));

      await expect(supportService.getById('unknown-id')).rejects.toThrow('Not found');
    });
  });

  describe('reply', () => {
    it('sends a reply to a ticket', async () => {
      mockClient.post.mockResolvedValueOnce({ data: {} });

      await supportService.reply('ticket-1', 'Thank you for the update');

      expect(mockClient.post).toHaveBeenCalledWith('/support/tickets/ticket-1/reply', {
        message: 'Thank you for the update',
      });
    });

    it('throws when ticket is closed', async () => {
      mockClient.post.mockRejectedValueOnce(new Error('Ticket is closed'));

      await expect(supportService.reply('ticket-1', 'My reply')).rejects.toThrow('Ticket is closed');
    });

    it('throws on network error', async () => {
      mockClient.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(supportService.reply('ticket-1', 'My reply')).rejects.toThrow('Network error');
    });
  });
});
