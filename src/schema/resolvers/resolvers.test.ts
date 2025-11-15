import { describe, it, expect, vi, beforeEach } from 'vitest';
import { accountResolver } from './accountResolver.js';
import { customerResolver } from './customerResolver.js';
import { resolvers } from './index.js';
import { GraphQLError } from 'graphql';

// Mock the services
vi.mock('../../services/accountService.js', () => ({
  accountService: {
    getAccountById: vi.fn(),
    getAccountsByCustomerId: vi.fn(),
  },
}));

vi.mock('../../services/customerService.js', () => ({
  customerService: {
    getCustomerById: vi.fn(),
  },
}));

// Spy on console.log
const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

describe('GraphQL Resolvers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Account Resolver', () => {
    describe('getAccount', () => {
      it('should fetch account by ID successfully', async () => {
        const mockAccount = {
          id: 'acc123',
          accountNumber: 'ACC-001',
          balance: 1000.00,
          customerId: 'cust456',
        };

        const { accountService } = await import('../../services/accountService.js');
        vi.mocked(accountService.getAccountById).mockResolvedValue(mockAccount);

        const result = await accountResolver.getAccount(
          {},
          { id: 'acc123' },
          { requestId: 'req-001' }
        );

        expect(accountService.getAccountById).toHaveBeenCalledWith('acc123');
        expect(result).toEqual(mockAccount);
        expect(consoleLogSpy).toHaveBeenCalledWith('[req-001] Fetching account: acc123');
      });

      it('should handle service errors and convert to GraphQLError', async () => {
        const { accountService } = await import('../../services/accountService.js');
        vi.mocked(accountService.getAccountById).mockRejectedValue(new Error('Service unavailable'));

        await expect(
          accountResolver.getAccount({}, { id: 'acc123' }, { requestId: 'req-002' })
        ).rejects.toThrow(GraphQLError);

        await expect(
          accountResolver.getAccount({}, { id: 'acc123' }, { requestId: 'req-002' })
        ).rejects.toThrow('Service unavailable');

        expect(accountService.getAccountById).toHaveBeenCalledWith('acc123');
      });

      it('should handle unknown errors', async () => {
        const { accountService } = await import('../../services/accountService.js');
        vi.mocked(accountService.getAccountById).mockRejectedValue('String error');

        await expect(
          accountResolver.getAccount({}, { id: 'acc123' }, { requestId: 'req-003' })
        ).rejects.toThrow(GraphQLError);

        await expect(
          accountResolver.getAccount({}, { id: 'acc123' }, { requestId: 'req-003' })
        ).rejects.toThrow('Failed to fetch account');
      });

      it('should work without requestId in context', async () => {
        const mockAccount = { id: 'acc123', accountNumber: 'ACC-001', balance: 500.00, customerId: 'cust456' };

        const { accountService } = await import('../../services/accountService.js');
        vi.mocked(accountService.getAccountById).mockResolvedValue(mockAccount);

        const result = await accountResolver.getAccount({}, { id: 'acc123' }, {});

        expect(result).toEqual(mockAccount);
        expect(consoleLogSpy).toHaveBeenCalledWith('[unknown] Fetching account: acc123');
      });
    });

    describe('getCustomer', () => {
      it('should fetch customer for account successfully', async () => {
        const mockCustomer = {
          id: 'cust456',
          name: 'John Doe',
          email: 'john@example.com',
        };

        const { customerService } = await import('../../services/customerService.js');
        vi.mocked(customerService.getCustomerById).mockResolvedValue(mockCustomer);

        const result = await accountResolver.getCustomer(
          { customerId: 'cust456' },
          {},
          { requestId: 'req-004' }
        );

        expect(customerService.getCustomerById).toHaveBeenCalledWith('cust456');
        expect(result).toEqual(mockCustomer);
        expect(consoleLogSpy).toHaveBeenCalledWith('[req-004] Fetching customer for account: cust456');
      });

      it('should handle customer service errors', async () => {
        const { customerService } = await import('../../services/customerService.js');
        vi.mocked(customerService.getCustomerById).mockRejectedValue(new Error('Customer not found'));

        await expect(
          accountResolver.getCustomer({ customerId: 'cust456' }, {}, { requestId: 'req-005' })
        ).rejects.toThrow(GraphQLError);

        await expect(
          accountResolver.getCustomer({ customerId: 'cust456' }, {}, { requestId: 'req-005' })
        ).rejects.toThrow('Customer not found');
      });
    });
  });

  describe('Customer Resolver', () => {
    describe('getCustomer', () => {
      it('should fetch customer by ID successfully', async () => {
        const mockCustomer = {
          id: 'cust789',
          name: 'Jane Smith',
          email: 'jane@example.com',
        };

        const { customerService } = await import('../../services/customerService.js');
        vi.mocked(customerService.getCustomerById).mockResolvedValue(mockCustomer);

        const result = await customerResolver.getCustomer(
          {},
          { id: 'cust789' },
          { requestId: 'req-006' }
        );

        expect(customerService.getCustomerById).toHaveBeenCalledWith('cust789');
        expect(result).toEqual(mockCustomer);
        expect(consoleLogSpy).toHaveBeenCalledWith('[req-006] Fetching customer: cust789');
      });

      it('should handle service errors', async () => {
        const { customerService } = await import('../../services/customerService.js');
        vi.mocked(customerService.getCustomerById).mockRejectedValue(new Error('Database connection failed'));

        await expect(
          customerResolver.getCustomer({}, { id: 'cust789' }, { requestId: 'req-007' })
        ).rejects.toThrow(GraphQLError);

        await expect(
          customerResolver.getCustomer({}, { id: 'cust789' }, { requestId: 'req-007' })
        ).rejects.toThrow('Database connection failed');
      });
    });

    describe('getAccounts', () => {
      it('should fetch accounts for customer successfully', async () => {
        const mockAccounts = [
          { id: 'acc001', accountNumber: 'ACC-001', balance: 1000.00, customerId: 'cust789' },
          { id: 'acc002', accountNumber: 'ACC-002', balance: 2500.00, customerId: 'cust789' },
        ];

        const { accountService } = await import('../../services/accountService.js');
        vi.mocked(accountService.getAccountsByCustomerId).mockResolvedValue(mockAccounts);

        const result = await customerResolver.getAccounts(
          { id: 'cust789' },
          {},
          { requestId: 'req-008' }
        );

        expect(accountService.getAccountsByCustomerId).toHaveBeenCalledWith('cust789');
        expect(result).toEqual(mockAccounts);
        expect(consoleLogSpy).toHaveBeenCalledWith('[req-008] Fetching accounts for customer: cust789');
      });

      it('should handle empty accounts list', async () => {
        const { accountService } = await import('../../services/accountService.js');
        vi.mocked(accountService.getAccountsByCustomerId).mockResolvedValue([]);

        const result = await customerResolver.getAccounts({ id: 'cust789' }, {}, { requestId: 'req-009' });

        expect(result).toEqual([]);
        expect(accountService.getAccountsByCustomerId).toHaveBeenCalledWith('cust789');
      });

      it('should handle account service errors', async () => {
        const { accountService } = await import('../../services/accountService.js');
        vi.mocked(accountService.getAccountsByCustomerId).mockRejectedValue(new Error('Service timeout'));

        await expect(
          customerResolver.getAccounts({ id: 'cust789' }, {}, { requestId: 'req-010' })
        ).rejects.toThrow(GraphQLError);

        await expect(
          customerResolver.getAccounts({ id: 'cust789' }, {}, { requestId: 'req-010' })
        ).rejects.toThrow('Service timeout');
      });
    });
  });

  describe('Combined Resolvers Structure', () => {
    it('should have correct Query resolvers', () => {
      expect(resolvers.Query).toHaveProperty('account');
      expect(resolvers.Query).toHaveProperty('customer');
      expect(typeof resolvers.Query.account).toBe('function');
      expect(typeof resolvers.Query.customer).toBe('function');
    });

    it('should have correct Account field resolvers', () => {
      expect(resolvers.Account).toHaveProperty('customer');
      expect(typeof resolvers.Account.customer).toBe('function');
    });

    it('should have correct Customer field resolvers', () => {
      expect(resolvers.Customer).toHaveProperty('accounts');
      expect(typeof resolvers.Customer.accounts).toBe('function');
    });

    it('should map to correct resolver functions', () => {
      expect(resolvers.Query.account).toBe(accountResolver.getAccount);
      expect(resolvers.Query.customer).toBe(customerResolver.getCustomer);
      expect(resolvers.Account.customer).toBe(accountResolver.getCustomer);
      expect(resolvers.Customer.accounts).toBe(customerResolver.getAccounts);
    });
  });

  describe('Error Handling Patterns', () => {
    it('should consistently throw GraphQLError for all resolver errors', async () => {
      const { accountService } = await import('../../services/accountService.js');
      const { customerService } = await import('../../services/customerService.js');

      // Test all resolvers throw GraphQLError
      vi.mocked(accountService.getAccountById).mockRejectedValue(new Error('Test error'));
      vi.mocked(customerService.getCustomerById).mockRejectedValue(new Error('Test error'));
      vi.mocked(accountService.getAccountsByCustomerId).mockRejectedValue(new Error('Test error'));

      await expect(accountResolver.getAccount({}, { id: 'test' }, {})).rejects.toBeInstanceOf(GraphQLError);
      await expect(accountResolver.getCustomer({ customerId: 'test' }, {}, {})).rejects.toBeInstanceOf(GraphQLError);
      await expect(customerResolver.getCustomer({}, { id: 'test' }, {})).rejects.toBeInstanceOf(GraphQLError);
      await expect(customerResolver.getAccounts({ id: 'test' }, {}, {})).rejects.toBeInstanceOf(GraphQLError);
    });

    it('should preserve error messages when converting to GraphQLError', async () => {
      const { accountService } = await import('../../services/accountService.js');
      const errorMessage = 'Specific service error message';
      vi.mocked(accountService.getAccountById).mockRejectedValue(new Error(errorMessage));

      try {
        await accountResolver.getAccount({}, { id: 'test' }, {});
      } catch (error) {
        expect(error).toBeInstanceOf(GraphQLError);
        expect((error as GraphQLError).message).toBe(errorMessage);
      }
    });
  });

  describe('Logging Behavior', () => {
    it('should log all resolver calls with request IDs', async () => {
      const { accountService } = await import('../../services/accountService.js');
      const { customerService } = await import('../../services/customerService.js');

      vi.mocked(accountService.getAccountById).mockResolvedValue({} as any);
      vi.mocked(customerService.getCustomerById).mockResolvedValue({} as any);
      vi.mocked(accountService.getAccountsByCustomerId).mockResolvedValue([]);

      await accountResolver.getAccount({}, { id: 'acc123' }, { requestId: 'req-001' });
      await accountResolver.getCustomer({ customerId: 'cust456' }, {}, { requestId: 'req-002' });
      await customerResolver.getCustomer({}, { id: 'cust789' }, { requestId: 'req-003' });
      await customerResolver.getAccounts({ id: 'cust101' }, {}, { requestId: 'req-004' });

      expect(consoleLogSpy).toHaveBeenCalledWith('[req-001] Fetching account: acc123');
      expect(consoleLogSpy).toHaveBeenCalledWith('[req-002] Fetching customer for account: cust456');
      expect(consoleLogSpy).toHaveBeenCalledWith('[req-003] Fetching customer: cust789');
      expect(consoleLogSpy).toHaveBeenCalledWith('[req-004] Fetching accounts for customer: cust101');
    });

    it('should use "unknown" for missing request IDs', async () => {
      const { accountService } = await import('../../services/accountService.js');
      vi.mocked(accountService.getAccountById).mockResolvedValue({} as any);

      await accountResolver.getAccount({}, { id: 'acc123' }, {});

      expect(consoleLogSpy).toHaveBeenCalledWith('[unknown] Fetching account: acc123');
    });
  });

  describe('Thin BFF Pattern Compliance', () => {
    it('should pass through data without transformation', async () => {
      const { accountService } = await import('../../services/accountService.js');
      const originalData = {
        id: 'acc123',
        accountNumber: 'ACC-001',
        balance: 1234.56,
        customerId: 'cust456',
        additionalFields: { extra: 'data' },
      };

      vi.mocked(accountService.getAccountById).mockResolvedValue(originalData);

      const result = await accountResolver.getAccount({}, { id: 'acc123' }, {});

      expect(result).toEqual(originalData);
      expect(result).toBe(originalData); // Same object reference - no transformation
    });

    it('should not add business logic or computation', async () => {
      const { customerService } = await import('../../services/customerService.js');
      const customerData = {
        id: 'cust123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      vi.mocked(customerService.getCustomerById).mockResolvedValue(customerData);

      const result = await customerResolver.getCustomer({}, { id: 'cust123' }, {});

      // Result should be exactly what service returned - no additional fields, formatting, etc.
      expect(Object.keys(result)).toEqual(Object.keys(customerData));
      expect(result).toEqual(customerData);
    });

    it('should only orchestrate I/O calls', async () => {
      const { accountService } = await import('../../services/accountService.js');
      vi.mocked(accountService.getAccountsByCustomerId).mockResolvedValue([]);

      await customerResolver.getAccounts({ id: 'cust123' }, {}, {});

      // Verify only one service call was made - no additional processing
      expect(accountService.getAccountsByCustomerId).toHaveBeenCalledTimes(1);
      expect(accountService.getAccountsByCustomerId).toHaveBeenCalledWith('cust123');
    });
  });
});