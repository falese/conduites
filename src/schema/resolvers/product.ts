import { productService } from '../../services/productService.js';

export const productResolvers = {
  Query: {
    // Get single product by ID - pass-through to product service
    async product(_: any, { id }: { id: string }) {
      return await productService.getProductById(id);
    },

    // Get list of products with optional category filter and pagination
    async products(_: any, { category, limit, offset }: { 
      category?: string; 
      limit: number; 
      offset: number; 
    }) {
      return await productService.getProducts({ category, limit, offset });
    },
  },

  Mutation: {
    // Create new product - pass-through to product service
    async createProduct(_: any, { input }: { input: any }) {
      return await productService.createProduct(input);
    },

    // Update product - pass-through to product service
    async updateProduct(_: any, { id, input }: { id: string; input: any }) {
      return await productService.updateProduct(id, input);
    },

    // Delete product - pass-through to product service
    async deleteProduct(_: any, { id }: { id: string }) {
      return await productService.deleteProduct(id);
    },
  },
};