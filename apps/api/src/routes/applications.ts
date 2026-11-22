import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { asyncHandler, HttpError } from '../lib/http.js';
import { Application } from '../model/Application.js';

const statusSchema = z.enum(['saved', 'applied', 'interview', 'rejected', 'offer']);

function requireValidId(id: string) {
    if (!mongoose.isValidObjectId(id)) throw new HttpError(404, 'Application not found');
}

export const applicationsRouter = Router();

applicationsRouter.get(
    '/',
    asyncHandler(async (req, res) => {
        const filter: Record<string, unknown> = { userId: res.locals.userId };
        const status = statusSchema.safeParse(req.query.status);
        if (status.success) filter.status = status.data;

        const apps = await Application.find(filter)
            .sort({ createdAt: -1 })
            .select('company title score status createdAt')
            .lean();
        res.json(apps);
    })
);

applicationsRouter.get(
    '/:id',
    asyncHandler(async (req, res) => {
        const id = String(req.params.id);
        requireValidId(id);
        const app = await Application.findOne({ _id: id, userId: res.locals.userId }).lean();
        if (!app) throw new HttpError(404, 'Application not found');
        res.json(app);
    })
);

applicationsRouter.patch(
    '/:id',
    asyncHandler(async (req, res) => {
        const id = String(req.params.id);
        requireValidId(id);
        const body = z.object({ status: statusSchema }).safeParse(req.body);
        if (!body.success) throw new HttpError(400, 'status must be saved, applied, interview, rejected or offer');

        const app = await Application.findOneAndUpdate(
            { _id: id, userId: res.locals.userId },
            { status: body.data.status },
            { new: true }
        ).lean();
        if (!app) throw new HttpError(404, 'Application not found');
        res.json(app);
    })
);