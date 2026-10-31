import cors from 'cors';
import express from 'express';
import { env } from './lib/env.js';
import { connectMongo, pingMongo } from './lib/mongo.js';
import { pingQdrant } from './lib/qdrant.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
    const [mongo, qdrant] = await Promise.all([pingMongo(), pingQdrant()]);
    const ok = mongo && qdrant;
    return res
        .status(ok ? 200 : 503)
        .json({ status: ok ? 'ok' : 'degraded', mongo, qdrant });
});

async function start() {
    await connectMongo();
    app.listen(env.PORT, () => {
        console.log(`API running on http://localhost:${env.PORT}`);
    });
}

start().catch((err) => {
    console.error('Failed to start:', err);
    process.exit(1);
});


/**
 * 🚀 MAIN API SERVER ENTRY POINT
 *
 * WHAT THIS FILE DOES:
 * 1. Initializes the Express application and configures global middleware (CORS and JSON parsing).
 * 2. Defines a `/health` endpoint to monitor the availability of MongoDB and Qdrant.
 * 3. Connects to MongoDB before starting the API server.
 * 4. Starts the Express server on the port specified in the environment configuration.
 * 5. Handles startup failures and exits the process if initialization fails.
 *
 * WHY IT EXISTS:
 * - Centralized Startup: Provides a single entry point for initializing and running the backend.
 * - Middleware Configuration: Sets up common request-processing functionality.
 * - Service Monitoring: Allows us to check whether essential database services are reachable.
 * - Startup Safety: Ensures MongoDB is connected before accepting incoming API requests.
 * - Maintainability: Keeps server initialization and lifecycle management separate from business logic.
 */