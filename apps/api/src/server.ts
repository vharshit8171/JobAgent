import express, { type RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { clerkMiddleware, getAuth } from '@clerk/express';
import { env } from './lib/env.js';
import { errorHandler } from './lib/http.js';
import { apiLimiter } from './lib/limits.js';
import { connectMongo, pingMongo } from './lib/mongo.js';
import { pingQdrant } from './lib/qdrant.js';
import { resumeRouter } from './routes/resume.js';
import { chatRouter } from './routes/chat.js';
import { threadsRouter } from './routes/thread.js';
import { applicationsRouter } from './routes/applications.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: env.WEB_ORIGIN }));
app.use(express.json({ limit: '1mb' }));
app.use(clerkMiddleware()); // verifies the token and attaches the auth state

// Public, so hosting platforms can check that the API is alive.
app.get('/health', async (_req, res) => {
    const [mongo, qdrant] = await Promise.all([pingMongo(), pingQdrant()]);
    const ok = mongo && qdrant;
    res.status(ok ? 200 : 503).json({ status: ok ? 'ok' : 'degraded', mongo, qdrant });
});

/** Everything under /api needs a signed-in user. */
const requireUser: RequestHandler = (req, res, next) => {
    const { userId } = getAuth(req);
    if (!userId) {
        res.status(401).json({ error: 'Sign in to continue' });
        return;
    }
    res.locals.userId = userId; // the only source of userId from now on
    next();
};

app.use('/api', requireUser, apiLimiter);
app.use('/api/resume', resumeRouter);
app.use('/api/chat', chatRouter);
app.use('/api/threads', threadsRouter);
app.use('/api/applications', applicationsRouter);

app.use(errorHandler);

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