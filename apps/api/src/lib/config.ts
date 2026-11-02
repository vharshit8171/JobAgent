// Real auth arrives in Phase 6. Until then everything belongs to one dev user.
export const DEV_USER_ID = 'dev-user';

export const EMBEDDING_MODEL = 'gemini-embedding-001';
// Qdrant needs to know the vector size up front. Change this later and you must recreate the collection.
export const EMBEDDING_DIM = 768;

export const COLLECTION = 'career_chunks';