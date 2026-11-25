import { Suspense } from 'react';
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
    return (
        <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#26352c] px-5 py-10">
            <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#dce8d9]/60 blur-[100px]" />
            <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-[#e8e5d6]/70 blur-[100px]" />

            <div className="relative z-10 mb-8 max-w-md text-center">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dce5d9] bg-white/70 px-3.5 py-1.5">
                    <span className="h-2 w-2 rounded-full bg-[#66866a]" />
                    <span className="text-xs font-medium tracking-wide text-[#607563]">
                        YOUR CAREER COMPANION
                    </span>
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight text-[#5e806b] sm:text-5xl">
                    Make your next
                    <span className="block text-[#66866a]">
                        career move count.
                    </span>
                </h1>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-[#78847a] sm:text-base">
                    Discover opportunities, match your skills, and turn your
                    resume into your next big opportunity.
                </p>
            </div>

            <div className="relative z-10">
                <Suspense
                    fallback={
                        <div className="flex min-h-100 items-center justify-center text-sm text-[#78847a]">
                            Loading sign in...
                        </div>
                    }
                >
                    <SignIn
                        appearance={{
                            options: {
                                socialButtonsVariant: 'blockButton',
                            },
                            variables: {
                                colorPrimary: '#526b54',
                                colorForeground: '#232830',
                                fontFamily: 'var(--font-ui)',
                                borderRadius: '0.25rem',
                            },
                            elements: {
                                footerAction: 'hidden',
                                cardBox: 'shadow-none border border-rule',
                            },
                        }}
                    />
                </Suspense>
            </div>

            <p className="relative z-10 mt-8 text-xs font-medium tracking-wide text-[#78847a] sm:text-sm">
                Less guessing. More meaningful career moves.
            </p>
        </div>
    );
}
