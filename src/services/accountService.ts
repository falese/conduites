import { config } from '../config/environment.js';

/**
 * Account data interface
 */
export interface Account {
  id: string;
  accountNumber: string;
  balance: number;
  customerId: string;
}

/**
 * Account service client - HTTP client for account microservice
 * THIN client: just HTTP fetch, no retry/circuit breaker (service mesh handles that)
 */
class AccountService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.downstream.accountService;
  }

  /**
   * Get account by ID from downstream account service
   * @param id - Account ID
   * @returns Account data
   * @throws Error if response not ok
   */
  async getAccountById(id: string): Promise<Account> {
    const url = `${this.baseUrl}/accounts/${id}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch account ${id}: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Get accounts by customer ID from downstream account service
   * @param customerId - Customer ID
   * @returns Array of account data
   * @throws Error if response not ok
   */
  async getAccountsByCustomerId(customerId: string): Promise<Account[]> {
    const url = `${this.baseUrl}/accounts?customerId=${customerId}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch accounts for customer ${customerId}: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }
}

export const accountService = new AccountService();