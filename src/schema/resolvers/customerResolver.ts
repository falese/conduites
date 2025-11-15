import { customerService } from '../../services/customerService.js';
import { accountService } from '../../services/accountService.js';
import { GraphQLError } from 'graphql';

/**
 * Customer resolver functions - THIN BFF pattern
 * These are pass-through resolvers with NO business logic
 * Only orchestrate I/O, log requests, handle errors
 */
export const customerResolver = {
  /**
   * Get customer by ID - thin pass-through to customer service
   * No transformation, validation, or computation
   */
  async getCustomer(parent: any, { id }: { id: string }, context: { requestId?: string }) {
    console.log(`[${context.requestId || 'unknown'}] Fetching customer: ${id}`);
    
    try {
      // Direct pass-through to service - no transformation
      const result = await customerService.getCustomerById(id);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch customer';
      throw new GraphQLError(message);
    }
  },

  /**
   * Get accounts for customer - thin pass-through to account service
   * No transformation, validation, or computation
   */
  async getAccounts(customer: { id: string }, args: any, context: { requestId?: string }) {
    console.log(`[${context.requestId || 'unknown'}] Fetching accounts for customer: ${customer.id}`);
    
    try {
      // Direct pass-through to service - no transformation
      const result = await accountService.getAccountsByCustomerId(customer.id);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch accounts';
      throw new GraphQLError(message);
    }
  },
};