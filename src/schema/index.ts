import { createSchema } from 'graphql-yoga';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { resolvers } from './resolvers/index.js';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load GraphQL schema from schema.graphql file
 * @returns GraphQL schema string or throws error
 */
function loadSchemaFile(): string {
  try {
    const schemaPath = join(__dirname, 'schema.graphql');
    return readFileSync(schemaPath, 'utf8');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to load GraphQL schema file: ${errorMessage}`);
  }
}

/**
 * Create and export the complete GraphQL schema
 * Combines type definitions from schema.graphql with resolvers
 */
export const schema = (() => {
  try {
    const typeDefs = loadSchemaFile();
    
    return createSchema({
      typeDefs,
      resolvers,
    });
  } catch (error) {
    console.error('❌ Error creating GraphQL schema:', error);
    throw error;
  }
})();