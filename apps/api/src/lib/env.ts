import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(4000),
    MONGODB_URI: z.string().min(1),
    QDRANT_URL: z.url(),
    QDRANT_API_KEY: z.string().optional(),
    GROQ_API_KEY: z.string().optional(),
    TAVILY_API_KEY: z.string().optional(),
    GOOGLE_API_KEY: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
    console.error('Invalid environment variables:');
    for (const issue of parsed.error.issues) {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
}

export const env = parsed.data;


/**
 * 🛠️ ENVIRONMENT VARIABLES VALIDATOR (Zod Schema)
 * 
 * WHAT THIS FILE DOES:
 * 1. Loads configuration variables from your system environment or a `.env` file (via `dotenv`).
 * 2. Defines a strict structure (schema) describing exactly what types those variables must be.
 * 3. Validates the variables at runtime the moment the application starts up.
 * 
 * WHY IT EXISTS / BENEFITS:
 * - Fail Fast: If a critical variable (like `MONGODB_URI` or `QDRANT_URL`) is missing or formatted  incorrectly, the app crashes instantly with a clear error message instead of failing silently later.
 * - Type Safety: It exports a heavily typed `env` object. When you import `env` into other files, your IDE will provide auto-complete and warn you if you misspell a variable name.
 * - Coercion & Defaults: Automatically falls back to standard values (like port `4000`) and converts string variables into actual numbers where required.
 */