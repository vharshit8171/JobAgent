import { env } from './env.js';
import { MongoClient } from 'mongodb';
import { MongoDBSaver } from '@langchain/langgraph-checkpoint-mongodb';

// The checkpointer uses its own MongoDB client, separate from Mongoose.
export const checkpointClient = new MongoClient(env.MONGODB_URI);

export const checkpointer = new MongoDBSaver({
  client: checkpointClient,
  dbName: 'job_agent',
});