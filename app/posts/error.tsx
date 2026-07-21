// app/posts/error.tsx
'use client'; // ← error.tsx ต้องเป็น Client Component เสมอ
// ✨ TypeScript: กําหนด type ให้props ของ error component
interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}
export default function ErrorPage({ error, reset }: ErrorProps) {
    return (
        <main className="p-12 text-center">
            <div className="p-8 bg-red-50 rounded-xl border border-red-200 max-w-md mx-auto">
                <p className="text-4xl mb-4">❌</p>
                <h2 className="text-xl font-bold text-red-700 mb-2">เกิดข้อผิดพลาด!</h2>
                <p className="text-red-600 text-sm mb-4">{error.message}</p>
                <button
                    onClick={(): void => reset()}
                    className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                    ลองอีกครั้ง
                </button>
            </div>
        </main>
    );
}