import { accountResolver } from './accountResolver.js';
import { customerResolver } from './customerResolver.js';

/**
 * Combined resolvers for the Graph Conduit Accounts BFF
 * This is a THIN BFF - resolvers only orchestrate calls to downstream services
 */
export const resolvers = {
  Query: {
    account: accountResolver.getAccount,
    customer: customerResolver.getCustomer,
  },
  
  Account: {
    customer: accountResolver.getCustomer,
  },
  
  Customer: {
    accounts: customerResolver.getAccounts,
  },
};