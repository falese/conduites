import { config } from '../../config/environment.js';

// Placeholder for account service client - would be implemented as HTTP client
const accountService = {
  async getAccountById(id: string) {
    // In a real implementation, this would call the account microservice
    // For now, return a placeholder response
    return {
      id,
      accountNumber: `ACC-${id}`,
      balance: 1000.00,
      customerId: `CUST-${id}`,
    };
  }
};

// Placeholder for customer service client
const customerService = {
  async getCustomerById(id: string) {
    // In a real implementation, this would call the customer microservice
    return {
      id,
      name: `Customer ${id}`,
      email: `customer${id}@example.com`,
    };
  }
};

/**
 * Account resolvers - THIN BFF pattern
 * All resolvers pass through directly to downstream services
 */
export const accountResolvers = {
  Query: {
    /**
     * Get account by ID - pass through to account service
     */
    async account(_: any, { id }: { id: string }) {
      try {
        return await accountService.getAccountById(id);
      } catch (error) {
        throw new Error(`Failed to fetch account: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  },

  Account: {
    /**
     * Resolve customer for account - pass through to customer service
     */
    async customer(parent: { customerId: string }) {
      try {
        return await customerService.getCustomerById(parent.customerId);
      } catch (error) {
        throw new Error(`Failed to fetch customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  },
};