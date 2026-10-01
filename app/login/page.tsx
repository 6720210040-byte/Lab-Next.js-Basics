'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'register') {
      if (password.length < 4) {
        setError('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
        return;
      }
      if (password !== confirmPassword) {
        setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
        return;
      }
    }

    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/api/login' : '/api/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || (mode === 'login' ? 'เข้าสู่ระบบไม่สำเร็จ' : 'สมัครสมาชิกไม่สำเร็จ'));
        setLoading(false);
        return;
      }

      setSuccess(mode === 'login' ? 'เข้าสู่ระบบสำเร็จ กำลังพาคุณไป...' : 'สมัครสมาชิกสำเร็จ กำลังเข้าสู่ระบบ...');

      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = redirectTo;
        } else {
          router.push(redirectTo);
          router.refresh();
        }
      }, 600);
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      setLoading(false);
    }
  }

  return (
    <main className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-100 mt-6">
      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError('');
            setSuccess('');
          }}
          className={`flex-1 pb-3 text-center font-semibold text-sm transition-colors border-b-2 ${
            mode === 'login'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🔐 เข้าสู่ระบบ (Sign In)
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setError('');
            setSuccess('');
          }}
          className={`flex-1 pb-3 text-center font-semibold text-sm transition-colors border-b-2 ${
            mode === 'register'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          ✨ สมัครสมาชิก (Sign Up)
        </button>
      </div>

      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-800">
          {mode === 'login' ? 'ยินดีต้อนรับกลับมา' : 'สร้างบัญชีผู้ใช้ใหม่'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {mode === 'login'
            ? 'กรอก Gmail/อีเมล และรหัสผ่านเพื่อเข้าสู่ระบบ'
            : 'สมัครสมาชิกง่ายๆ ใช้เพียง Gmail/อีเมล และรหัสผ่าน'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gmail / อีเมล
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="เช่น user@gmail.com"
            className="border border-gray-300 p-2.5 w-full rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            รหัสผ่าน
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'register' ? 'อย่างน้อย 4 ตัวอักษร' : 'กรอกรหัสผ่าน'}
            className="border border-gray-300 p-2.5 w-full rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        {mode === 'register' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ยืนยันรหัสผ่าน
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="กรอกรหัสผ่านอีกครั้ง"
              className="border border-gray-300 p-2.5 w-full rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoComplete="new-password"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:bg-gray-400 mt-2"
        >
          {loading
            ? 'กำลังดำเนินการ...'
            : mode === 'login'
              ? 'เข้าสู่ระบบ'
              : 'สมัครสมาชิกและเข้าใช้งาน'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        {mode === 'login' ? (
          <p>
            ยังไม่มีบัญชีใช่ไหม?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
                setSuccess('');
              }}
              className="text-blue-600 font-semibold hover:underline"
            >
              สมัครสมาชิกที่นี่
            </button>
          </p>
        ) : (
          <p>
            มีบัญชีผู้ใช้อยู่แล้ว?{' '}
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
                setSuccess('');
              }}
              className="text-blue-600 font-semibold hover:underline"
            >
              เข้าสู่ระบบที่นี่
            </button>
          </p>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center p-8 text-gray-500">กำลังโหลด...</div>}>
      <AuthContent />
    </Suspense>
  );
}