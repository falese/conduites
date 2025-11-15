import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { accountService } from './accountService.js';

// Mock the config
vi.mock('../config/environment.js', () => ({
  config: {
    downstream: {
      accountService: 'http://account-service:8080',
    },
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AccountService', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAccountById', () => {
    it('should fetch account by ID successfully', async () => {
      const mockAccount = {
        id: '123',
        accountNumber: 'ACC-123',
        balance: 1000.00,
        customerId: 'CUST-456',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccount,
      });

      const result = await accountService.getAccountById('123');

      expect(mockFetch).toHaveBeenCalledWith('http://account-service:8080/accounts/123');
      expect(result).toEqual(mockAccount);
    });

    it('should throw error when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(accountService.getAccountById('999'))
        .rejects
        .toThrow('Failed to fetch account 999: 404 Not Found');

      expect(mockFetch).toHaveBeenCalledWith('http://account-service:8080/accounts/999');
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(accountService.getAccountById('123'))
        .rejects
        .toThrow('Network error');
    });

    it('should handle various account IDs', async () => {
      const testCases = ['1', 'abc123', 'user-account-456'];

      for (const accountId of testCases) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: accountId }),
        });

        await accountService.getAccountById(accountId);

        expect(mockFetch).toHaveBeenCalledWith(`http://account-service:8080/accounts/${accountId}`);
      }
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(accountService.getAccountById('123'))
        .rejects
        .toThrow('Invalid JSON');
    });
  });

  describe('getAccountsByCustomerId', () => {
    it('should fetch accounts by customer ID successfully', async () => {
      const mockAccounts = [
        {
          id: '1',
          accountNumber: 'ACC-1',
          balance: 1000.00,
          customerId: 'CUST-123',
        },
        {
          id: '2',
          accountNumber: 'ACC-2',
          balance: 2500.00,
          customerId: 'CUST-123',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccounts,
      });

      const result = await accountService.getAccountsByCustomerId('CUST-123');

      expect(mockFetch).toHaveBeenCalledWith('http://account-service:8080/accounts?customerId=CUST-123');
      expect(result).toEqual(mockAccounts);
    });

    it('should return empty array when customer has no accounts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await accountService.getAccountsByCustomerId('CUST-999');

      expect(result).toEqual([]);
    });

    it('should throw error when response is not ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(accountService.getAccountsByCustomerId('CUST-123'))
        .rejects
        .toThrow('Failed to fetch accounts for customer CUST-123: 500 Internal Server Error');
    });

    it('should handle various customer IDs', async () => {
      const testCases = ['CUST-1', 'customer-456', 'user123'];

      for (const customerId of testCases) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

        await accountService.getAccountsByCustomerId(customerId);

        expect(mockFetch).toHaveBeenCalledWith(`http://account-service:8080/accounts?customerId=${customerId}`);
      }
    });

    it('should handle fetch network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection timeout'));

      await expect(accountService.getAccountsByCustomerId('CUST-123'))
        .rejects
        .toThrow('Connection timeout');
    });
  });

  describe('HTTP Status Codes', () => {
    it('should handle different HTTP error codes', async () => {
      const testCases = [
        { status: 400, statusText: 'Bad Request' },
        { status: 401, statusText: 'Unauthorized' },
        { status: 403, statusText: 'Forbidden' },
        { status: 404, statusText: 'Not Found' },
        { status: 500, statusText: 'Internal Server Error' },
        { status: 502, statusText: 'Bad Gateway' },
        { status: 503, statusText: 'Service Unavailable' },
      ];

      for (const testCase of testCases) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: testCase.status,
          statusText: testCase.statusText,
        });

        await expect(accountService.getAccountById('123'))
          .rejects
          .toThrow(`Failed to fetch account 123: ${testCase.status} ${testCase.statusText}`);
      }
    });
  });

  describe('Service URL Configuration', () => {
    it('should use configured base URL', () => {
      // This test verifies the service uses the mocked config
      expect(mockFetch).not.toHaveBeenCalled();
      
      // When we call the service, it should use the mocked URL
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123' }),
      });

      accountService.getAccountById('123');

      expect(mockFetch).toHaveBeenCalledWith('http://account-service:8080/accounts/123');
    });
  });

  describe('Type Safety', () => {
    it('should return properly typed Account object', async () => {
      const mockAccount = {
        id: '123',
        accountNumber: 'ACC-123',
        balance: 1000.00,
        customerId: 'CUST-456',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccount,
      });

      const result = await accountService.getAccountById('123');

      // Verify all required Account properties are present
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('accountNumber');
      expect(result).toHaveProperty('balance');
      expect(result).toHaveProperty('customerId');
      
      // Verify types
      expect(typeof result.id).toBe('string');
      expect(typeof result.accountNumber).toBe('string');
      expect(typeof result.balance).toBe('number');
      expect(typeof result.customerId).toBe('string');
    });

    it('should return properly typed Account array', async () => {
      const mockAccounts = [
        {
          id: '1',
          accountNumber: 'ACC-1',
          balance: 1000.00,
          customerId: 'CUST-123',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccounts,
      });

      const result = await accountService.getAccountsByCustomerId('CUST-123');

      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('accountNumber');
      expect(result[0]).toHaveProperty('balance');
      expect(result[0]).toHaveProperty('customerId');
    });
  });
});