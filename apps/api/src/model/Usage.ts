import { Schema, model } from 'mongoose';

const usageSchema = new Schema(
    {
        userId: { type: String, required: true },
        day: { type: String, required: true }, // "2026-11-22"
        messages: { type: Number, default: 0 },
    },
    { timestamps: true }
);
usageSchema.index({ userId: 1, day: 1 }, { unique: true });
usageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }); // forget after 30 days

export const Usage = model('Usage', usageSchema);