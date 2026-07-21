// app/posts/loading.tsx
export default function Loading() {
    return (
        <main className="p-12">
            <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-8" />
            {[...Array(5)].map((_: unknown, i: number) => (
                <div key={i} className="p-5 bg-white rounded-lg border mb-4 animate-pulse">
                    <div className="h-4 w-16 bg-gray-200 rounded mb-2" />
                    <div className="h-6 w-3/4 bg-gray-300 rounded mb-3" />
                    <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded" />
                        <div className="h-3 bg-gray-200 rounded w-5/6" />
                    </div>
                </div>
            ))}
        </main>
    );
}