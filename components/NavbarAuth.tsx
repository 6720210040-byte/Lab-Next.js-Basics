'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function NavbarAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    fetch('/api/auth/me', {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pathname]);

  async function handleLogout() {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  }

  if (loading) {
    return (
      <span className="text-blue-200 text-sm animate-pulse">...</span>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs bg-blue-800/80 px-2.5 py-1 rounded-full text-blue-200 border border-blue-700/50 flex items-center gap-1">
          👤 <span className="font-medium text-white">{user.email}</span>
        </span>
        <button
          type="button"
          onClick={handleLogout}
          className="text-red-300 hover:text-red-100 bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 px-3 py-1 rounded-md text-sm transition-colors cursor-pointer"
        >
          ออกจากระบบ
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="hover:text-blue-300 transition-colors bg-blue-800/60 hover:bg-blue-800 px-3 py-1 rounded-md text-sm border border-blue-700/40"
    >
      เข้าสู่ระบบ
    </Link>
  );
}
