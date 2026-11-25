export type MatchStatus = 'covered' | 'partial' | 'missing';
export type MatchItem = { requirement: string; status: MatchStatus; evidence: string };
export type MatchReport = { items: MatchItem[]; summary: string };
export type Tailoring = { bullets: string[]; coverLetter: string };

export type ReviewRequest = {
    job: { title: string; company: string } | null;
    score: number;
    report: MatchReport | null;
    draft: Tailoring | null;
    groundingIssues: string[];
};

export type ThreadSummary = { threadId: string; title: string; lastMessageAt: string };
export type ThreadDetail = {
    threadId: string;
    title: string;
    messages: { role: 'user' | 'assistant'; text: string }[];
    pendingReview: ReviewRequest | null;
};

export type ApplicationStatus = 'saved' | 'applied' | 'interview' | 'rejected' | 'offer';
export type ApplicationRow = {
    _id: string;
    company?: string;
    title?: string;
    score?: number;
    status: ApplicationStatus;
    createdAt: string;
};
export type ApplicationDetail = ApplicationRow & {
    matchReport: MatchReport | null;
    draft: Tailoring | null;
};

export type ResumeRow = { resumeId: string; fileName?: string; chunkCount?: number; updatedAt: string };
export type UploadResult = { resumeId: string; chunkCount: number; sections: string[] };