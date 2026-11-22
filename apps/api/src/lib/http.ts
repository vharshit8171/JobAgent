import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';
import multer from 'multer';

/** An error that carries the HTTP status it should produce. */
export class HttpError extends Error {
    constructor(
        public status: number,
        message: string
    ) {
        super(message);
    }
}

/** Lets async route handlers throw errors that reach the error middleware. */
export const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
        (req, res, next) => {
            fn(req, res, next).catch(next);
        };

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if (res.headersSent) {
        res.end();
        return;
    }
    if (err instanceof HttpError) {
        res.status(err.status).json({ error: err.message });
        return;
    }
    if (err instanceof multer.MulterError) {
        res.status(400).json({ error: err.message });
        return;
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
};