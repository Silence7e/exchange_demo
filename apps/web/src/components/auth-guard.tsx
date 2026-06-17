'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/queries/use-session';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { data, isLoading, isError } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isError) {
      router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [isLoading, isError, router]);

  if (isLoading) {
    return <div className="py-12 text-center text-price-neutral">Loading...</div>;
  }

  if (isError || !data) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-price-neutral">Please login to continue</p>
        <Link href="/login" className="text-price-up">Go to Login</Link>
      </div>
    );
  }

  return <>{children}</>;
};
