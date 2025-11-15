import { config } from '../../config/environment.js';

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

// Placeholder for account service client
const accountService = {
  async getAccountsByCustomerId(customerId: string) {
    // In a real implementation, this would call the account microservice
    return [
      {
        id: `${customerId}-1`,
        accountNumber: `ACC-${customerId}-1`,
        balance: 1000.00,
        customerId,
      },
      {
        id: `${customerId}-2`,
        accountNumber: `ACC-${customerId}-2`,
        balance: 2500.00,
        customerId,
      },
    ];
  }
};

/**
 * Customer resolvers - THIN BFF pattern
 * All resolvers pass through directly to downstream services
 */
export const customerResolvers = {
  Query: {
    /**
     * Get customer by ID - pass through to customer service
     */
    async customer(_: any, { id }: { id: string }) {
      try {
        return await customerService.getCustomerById(id);
      } catch (error) {
        throw new Error(`Failed to fetch customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  },

  Customer: {
    /**
     * Resolve accounts for customer - pass through to account service
     */
    async accounts(parent: { id: string }) {
      try {
        return await accountService.getAccountsByCustomerId(parent.id);
      } catch (error) {
        throw new Error(`Failed to fetch accounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  },
};