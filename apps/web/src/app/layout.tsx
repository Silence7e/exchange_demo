import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/components/providers';
import { NavBar } from '@/components/nav-bar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Exchange Platform',
  description: 'Digital currency exchange',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <QueryProvider>
          <NavBar />
          <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
          <Toaster richColors position="top-right" />
        </QueryProvider>
      </body>
    </html>
  );
}
