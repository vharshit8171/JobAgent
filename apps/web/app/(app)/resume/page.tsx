import { ResumeUploader } from '@/components/ResumeUploader';

export default function ResumePage() {
    return (
        <div className="h-full overflow-y-auto bg-background">
            <div className="mx-auto max-w-3xl px-5 py-10 md:px-10">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#526B54]">
                        Your Resume
                    </h1>
                    <p className="mt-2 max-w-prose text-muted-foreground">
                        CareerPilot reads your PDF and extracts the information it
                        can reference. Your career recommendations and drafts
                        are based on the information in your resume.
                    </p>
                </div>

                <ResumeUploader />
            </div>
        </div>
    );
}