// app/posts/page.tsx
interface Post {
    id: number;
    title: string;
    body: string;
    userId: number;
}
export default async function PostsPage() {
    const res = await fetch(
        'https://jsonplaceholder.typicode.com/posts?_limit=10',
        { cache: 'no-store' }
    );
    if (!res.ok) throw new Error('โหลดข้อมูลไม่สําเร็จ');
    const posts: Post[] = await res.json();
    return (
        <main className="p-12">
            <h1 className="text-3xl font-bold text-blue-900 mb-6">
                📝 บทความทั้งหมด ({posts.length})
            </h1>
            <div className="space-y-4 max-w-2xl">
                {posts.map((post: Post) => (
                    <article key={post.id}
                        className="p-5 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-xs text-gray-400 font-mono">#{post.id}</span>
                        <h2 className="text-lg font-bold text-blue-800 mt-1 mb-2">
                            {post.title}
                        </h2>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {post.body.slice(0, 120)}...
                        </p>
                    </article>
                ))}
            </div>
        </main>
    );
}