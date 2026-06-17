'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/hooks/queries/use-session';
import { cn } from '@/lib/utils';

const links = [
  { href: '/markets', label: 'Markets' },
  { href: '/trade/BTC-USDT', label: 'Trade' },
  { href: '/orders', label: 'Orders' },
  { href: '/wallet', label: 'Wallet' },
];

export const NavBar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold">
          Exchange
        </Link>
        <nav className="flex items-center gap-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'text-sm hover:text-foreground',
                pathname.startsWith(l.href) ? 'text-foreground' : 'text-price-neutral',
              )}
            >
              {l.label}
            </Link>
          ))}
          {session ? (
            <span className="text-sm text-price-neutral">{session.user.email}</span>
          ) : (
            <Link href="/login" className="rounded bg-price-up px-3 py-1 text-sm text-white">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};
