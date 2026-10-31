import { env } from './env.js';
import { QdrantClient } from '@qdrant/js-client-rest';

// Instantiate the Qdrant connection client globally
export const qdrant = new QdrantClient({
    url: env.QDRANT_URL,
    apiKey: env.QDRANT_API_KEY || undefined,
    // Add a standard timeout safeguard so standard API queries don't hang indefinitely
    timeout: 5000,
});

/**
 * Checks if the Qdrant server is alive, authenticated, and accepting traffic.
 */
export async function pingQdrant(): Promise<boolean> {
    try {
        await qdrant.getCollections();
        return true;
    } catch (error) {
        console.error(
            '⚠️ Qdrant connection check failed:',
            error instanceof Error ? error.message : error
        );

        return false;
    }
}


/**
 * 🛰️ QDRANT VECTOR DATABASE CLIENT
 * 
 * WHAT THIS FILE DOES:
 * 1. Initializes a centralized instance of the Qdrant Client using your validated credentials.
 * 2. Standardizes authorization by parsing optional API tokens securely.
 * 3. Provides a dedicated health-check mechanism (`pingQdrant`) to monitor service availability.
 * 
 * WHY IT EXISTS:
 * - Single Instance: Shares one global client connection context across your API, reducing network overhead.
 * - Resiliency: Fails gracefully during health tests instead of dropping errors into system runtime loops.
 * - Modularity: Isolates AI vector database dependencies from your core server configuration logic.
 */