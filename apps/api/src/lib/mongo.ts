import { env } from './env.js';
import mongoose from 'mongoose';

export async function connectMongo(): Promise<void> {
    // 1. Skip trying to connect if Mongoose is already connected (1 = connected)
    if (mongoose.connection.readyState === 1) {
        console.log('ℹ️ MongoDB is already connected.');
        return;
    }

    try {
        console.log('⏳ Connecting to MongoDB...');

        // 2. Trigger the connection using your validated environment variable
        await mongoose.connect(env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // Stop trying and crash after 5 seconds if DB is down
        });

        console.log('✅ MongoDB connected successfully.');
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error instanceof Error ? error.message : error);
        throw error; // Pass the error up so the application knows starting failed
    }
}


export async function pingMongo(): Promise<boolean> {
    try {
        // Quick exit if the mongoose state isn't even "connected"
        if (mongoose.connection.readyState !== 1) return false;

        // Run a lightweight database command to verify the connection is active
        await mongoose.connection.db?.command({ ping: 1 });
        return true;
    } catch {
        return false; // Any error means the database isn't responding right now
    }
}


/**
 * 🗄️ DATABASE CONNECTION UTILITY
 * 
 * WHAT THIS FILE DOES:
 * 1. Establishes a secure connection to your MongoDB database using Mongoose.
 * 2. Provides a quick "ping" function to check if the database is currently healthy and online.
 * 
 * WHY IT EXISTS:
 * - Centralization: Instead of writing connection settings everywhere, your entire app uses this single file.
 * - Error Prevention: It stops your app from trying to connect if it's already connected, and provides
 *   clear error feedback if the database credentials or server are broken.
 */
