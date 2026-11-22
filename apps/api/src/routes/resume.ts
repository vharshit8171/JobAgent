import { Router } from 'express';
import multer from 'multer';
import { asyncHandler, HttpError } from '../lib/http.js';
import { ingestResume } from '../rag/ingestResume.js';
import { Resume } from '../model/Resume.js';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (_req, file, cb) =>
        file.mimetype === 'application/pdf' ? cb(null, true) : cb(new HttpError(400, 'Only PDF files are allowed')),
});

export const resumeRouter = Router();

resumeRouter.post(
    '/',
    upload.single('file'),
    asyncHandler(async (req, res) => {
        if (!req.file) throw new HttpError(400, 'Attach a PDF in the "file" field');
        const result = await ingestResume({
            userId: res.locals.userId,
            fileName: req.file.originalname,
            data: new Uint8Array(req.file.buffer),
        });
        res.status(201).json(result);
    })
);

resumeRouter.get(
    '/',
    asyncHandler(async (_req, res) => {
        const resumes = await Resume.find({ userId: res.locals.userId })
            .select('resumeId fileName chunkCount updatedAt')
            .lean();
        res.json(resumes);
    })
);