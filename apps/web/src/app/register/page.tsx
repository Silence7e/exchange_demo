'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      toast.success('Registration successful');
      router.push('/markets');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-lg border border-border bg-surface p-6">
      <h1 className="mb-6 text-2xl font-bold">Register</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border border-border bg-background px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border border-border bg-background px-3 py-2"
          required
          minLength={8}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-price-up py-2 font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Register'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-price-neutral">
        Have an account? <Link href="/login" className="text-price-up">Login</Link>
      </p>
    </div>
  );
}
