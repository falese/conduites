import { HttpClient } from './httpClient.js';
import { appConfig } from '../config/index.js';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  inStock: boolean;
  createdAt: string;
}

export interface ProductInput {
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  inStock?: boolean;
}

interface GetProductsOptions {
  category?: string;
  limit: number;
  offset: number;
}

class ProductService {
  private client: HttpClient;

  constructor() {
    this.client = new HttpClient(appConfig.services.productService);
  }

  async getProductById(id: string): Promise<Product> {
    const response = await this.client.get<Product>(`/products/${id}`);
    
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to fetch product');
    }
    
    return response.data;
  }

  async getProducts(options: GetProductsOptions): Promise<Product[]> {
    const { category, limit, offset } = options;
    const queryParams = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    if (category) {
      queryParams.append('category', category);
    }
    
    const response = await this.client.get<Product[]>(`/products?${queryParams}`);
    
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to fetch products');
    }
    
    return response.data;
  }

  async createProduct(input: ProductInput): Promise<Product> {
    const response = await this.client.post<Product>('/products', input);
    
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to create product');
    }
    
    return response.data;
  }

  async updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
    const response = await this.client.put<Product>(`/products/${id}`, input);
    
    if (response.error || !response.data) {
      throw new Error(response.error || 'Failed to update product');
    }
    
    return response.data;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const response = await this.client.delete(`/products/${id}`);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response.status === 204;
  }

  async healthCheck() {
    return this.client.healthCheck();
  }
}

export const productService = new ProductService();