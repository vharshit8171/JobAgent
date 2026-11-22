import { Schema, model } from 'mongoose';

const threadSchema = new Schema(
    {
        threadId: { type: String, required: true, unique: true },
        userId: { type: String, required: true, index: true },
        title: { type: String, default: 'New chat' },
        lastMessageAt: { type: Date, default: () => new Date() },
    },
    { timestamps: true }
);

export const Thread = model('Thread', threadSchema);