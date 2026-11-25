import { Suspense } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { Sidebar } from '@/components/SideBar';

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-dvh flex-col md:flex-row">
            <Suspense fallback={null}>
                <AuthGate>
                    <Sidebar />
                </AuthGate>
            </Suspense>

            <main className="min-h-0 min-w-0 flex-1">
                {children}
            </main>
        </div>
    );
}