import { accountService } from '../../services/accountService.js';
import { customerService } from '../../services/customerService.js';
import { GraphQLError } from 'graphql';

/**
 * Account resolver functions - THIN BFF pattern
 * These are pass-through resolvers with NO business logic
 * Only orchestrate I/O, log requests, handle errors
 */
export const accountResolver = {
  /**
   * Get account by ID - thin pass-through to account service
   * No transformation, validation, or computation
   */
  async getAccount(parent: any, { id }: { id: string }, context: { requestId?: string }) {
    console.log(`[${context.requestId || 'unknown'}] Fetching account: ${id}`);
    
    try {
      // Direct pass-through to service - no transformation
      const result = await accountService.getAccountById(id);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch account';
      throw new GraphQLError(message);
    }
  },

  /**
   * Get customer for account - thin pass-through to customer service
   * No transformation, validation, or computation
   */
  async getCustomer(account: { customerId: string }, args: any, context: { requestId?: string }) {
    console.log(`[${context.requestId || 'unknown'}] Fetching customer for account: ${account.customerId}`);
    
    try {
      // Direct pass-through to service - no transformation
      const result = await customerService.getCustomerById(account.customerId);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch customer';
      throw new GraphQLError(message);
    }
  },
};