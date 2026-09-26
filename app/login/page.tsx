'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (!res.ok) { setError('เข้าสู่ระบบไม่สําเร็จ'); return; }
        router.push('/dashboard');
    }
    return (
        <main className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6">เข้าสู่ระบบ</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block">
                    <span className="block mb-1">อีเมล</span>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border p-2 w-full rounded"
                        required
                    />
                </label>
                <label className="block">
                    <span className="block mb-1">รหัสผ่าน</span>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border p-2 w-full rounded"
                        required
                    />
                </label>
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    เข้าสู่ระบบ
                </button>
            </form>
        </main>
    );
}