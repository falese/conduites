import { config } from '../config/environment.js';

/**
 * Customer data interface
 */
export interface Customer {
  id: string;
  name: string;
  email: string;
}

/**
 * Customer service client - HTTP client for customer microservice
 * THIN client: just HTTP fetch, service mesh handles resilience
 */
class CustomerService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.downstream.customerService;
  }

  /**
   * Get customer by ID from downstream customer service
   * @param id - Customer ID
   * @returns Customer data
   * @throws Error if response not ok
   */
  async getCustomerById(id: string): Promise<Customer> {
    const url = `${this.baseUrl}/customers/${id}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch customer ${id}: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }
}

export const customerService = new CustomerService();