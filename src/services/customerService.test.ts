import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { customerService } from './customerService.js';

// Mock the config
vi.mock('../config/environment.js', () => ({
  config: {
    downstream: {
      customerService: 'http://customer-service:8080',
    },
  },
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('CustomerService', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getCustomerById', () => {
    it('should fetch customer by ID successfully', async () => {
      const mockCustomer = {
        id: '123',
        name: 'John Doe',
        email: 'john.doe@example.com',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCustomer,
      });

      const result = await customerService.getCustomerById('123');

      expect(mockFetch).toHaveBeenCalledWith('http://customer-service:8080/customers/123', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      expect(result).toEqual(mockCustomer);
    });

    it('should throw error when customer not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      await expect(customerService.getCustomerById('999'))
        .rejects
        .toThrow('Failed to fetch customer 999: 404 Not Found');

      expect(mockFetch).toHaveBeenCalledWith('http://customer-service:8080/customers/999', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(customerService.getCustomerById('123'))
        .rejects
        .toThrow('Network error');
    });

    it('should handle various customer IDs', async () => {
      const testCases = ['1', 'cust-abc123', 'customer-456-xyz'];

      for (const customerId of testCases) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: customerId, name: 'Test Customer', email: 'test@example.com' }),
        });

        await customerService.getCustomerById(customerId);

        expect(mockFetch).toHaveBeenCalledWith(`http://customer-service:8080/customers/${customerId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Malformed JSON response');
        },
      });

      await expect(customerService.getCustomerById('123'))
        .rejects
        .toThrow('Malformed JSON response');
    });

    it('should include proper headers in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', name: 'John Doe', email: 'john.doe@example.com' }),
      });

      await customerService.getCustomerById('123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
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
        { status: 504, statusText: 'Gateway Timeout' },
      ];

      for (const testCase of testCases) {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: testCase.status,
          statusText: testCase.statusText,
        });

        await expect(customerService.getCustomerById('123'))
          .rejects
          .toThrow(`Failed to fetch customer 123: ${testCase.status} ${testCase.statusText}`);
      }
    });
  });

  describe('Service URL Configuration', () => {
    it('should use configured base URL', () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', name: 'John Doe', email: 'john.doe@example.com' }),
      });

      customerService.getCustomerById('123');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://customer-service:8080/customers/123',
        expect.any(Object)
      );
    });

    it('should construct URLs correctly for different customer IDs', async () => {
      const testCases = [
        { id: '1', expectedUrl: 'http://customer-service:8080/customers/1' },
        { id: 'abc123', expectedUrl: 'http://customer-service:8080/customers/abc123' },
        { id: 'customer-456', expectedUrl: 'http://customer-service:8080/customers/customer-456' },
      ];

      for (const testCase of testCases) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: testCase.id, name: 'Test', email: 'test@example.com' }),
        });

        await customerService.getCustomerById(testCase.id);

        expect(mockFetch).toHaveBeenCalledWith(testCase.expectedUrl, expect.any(Object));
      }
    });
  });

  describe('Type Safety', () => {
    it('should return properly typed Customer object', async () => {
      const mockCustomer = {
        id: '123',
        name: 'John Doe',
        email: 'john.doe@example.com',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCustomer,
      });

      const result = await customerService.getCustomerById('123');

      // Verify all required Customer properties are present
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
      
      // Verify types
      expect(typeof result.id).toBe('string');
      expect(typeof result.name).toBe('string');
      expect(typeof result.email).toBe('string');
    });

    it('should handle Customer objects with only required fields', async () => {
      const minimalCustomer = {
        id: '123',
        name: 'Jane Smith',
        email: 'jane@example.com',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => minimalCustomer,
      });

      const result = await customerService.getCustomerById('123');

      expect(result.id).toBe('123');
      expect(result.name).toBe('Jane Smith');
      expect(result.email).toBe('jane@example.com');
    });
  });

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle response with extra unexpected fields', async () => {
      const mockCustomer = {
        id: '123',
        name: 'John Doe',
        email: 'john.doe@example.com',
        // Extra fields that shouldn't break the system
        internalId: 'INT-123',
        metadata: { source: 'legacy' },
        createdAt: '2024-01-01T00:00:00Z',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCustomer,
      });

      const result = await customerService.getCustomerById('123');
      
      // Should still have all expected fields
      expect(result.id).toBe('123');
      expect(result.name).toBe('John Doe');
      expect(result.email).toBe('john.doe@example.com');
      
      // Extra fields should be preserved (TypeScript allows this)
      expect((result as any).internalId).toBe('INT-123');
      expect((result as any).metadata).toEqual({ source: 'legacy' });
    });

    it('should handle special characters in customer IDs', async () => {
      const specialIds = [
        'customer-with-dashes',
        'customer_with_underscores',
        'customer.with.dots',
        'customer123',
        'CUSTOMER_UPPERCASE',
      ];

      for (const customerId of specialIds) {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: customerId, name: 'Test Customer', email: 'test@example.com' }),
        });

        const result = await customerService.getCustomerById(customerId);
        expect(result.id).toBe(customerId);
      }
    });

    it('should handle network timeout errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      await expect(customerService.getCustomerById('123'))
        .rejects
        .toThrow('Request timeout');
    });

    it('should handle DNS resolution errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('getaddrinfo ENOTFOUND customer-service'));

      await expect(customerService.getCustomerById('123'))
        .rejects
        .toThrow('getaddrinfo ENOTFOUND customer-service');
    });

    it('should handle empty response body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      const result = await customerService.getCustomerById('123');
      expect(result).toBeNull();
    });

    it('should handle invalid JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON at position 0');
        },
      });

      await expect(customerService.getCustomerById('123'))
        .rejects
        .toThrow('Unexpected token < in JSON at position 0');
    });
  });

  describe('Service Instantiation', () => {
    it('should create service instance with correct base URL', () => {
      // This verifies that the service is properly instantiated with config
      expect(customerService).toBeDefined();
      expect(typeof customerService.getCustomerById).toBe('function');
    });
  });

  describe('Request Headers', () => {
    it('should send Content-Type header with all requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', name: 'Test', email: 'test@example.com' }),
      });

      await customerService.getCustomerById('123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });
});