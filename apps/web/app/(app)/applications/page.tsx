import { ApplicationsTable } from '@/components/ApplicationsTable';

export default function ApplicationsPage() {
    return (
        <div className="h-full overflow-y-auto bg-background">
            <div className="mx-auto max-w-4xl px-5 py-10 md:px-10">
                <h1 className="text-3xl font-extrabold tracking-tight text-[#526B54]">
                    Applications
                </h1>

                <p className="mt-2 max-w-prose text-muted-foreground">
                    Every draft you save from a chat lands here.
                    Open an application to review the match,
                    requirements, and your saved draft.
                </p>

                <ApplicationsTable />
            </div>
        </div>
    );
}