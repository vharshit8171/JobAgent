import { Schema, model } from 'mongoose';

const resumeSchema = new Schema(
    {
        userId: { type: String, required: true },
        resumeId: { type: String, required: true },
        fileName: String,
        rawText: String,
        chunkCount: Number,
    },
    { timestamps: true }
);
resumeSchema.index({ userId: 1, resumeId: 1 }, { unique: true });

export const Resume = model('Resume', resumeSchema);