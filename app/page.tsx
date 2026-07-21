// app/page.tsx
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'หน้าแรก',
};

interface Post {
  id: number;
  title: string;
  body: string;
}

async function getRecentPosts(): Promise<Post[]> {
  const res = await fetch(
    'https://jsonplaceholder.typicode.com/posts?_limit=3',
    { cache: 'no-store' }
  );
  return res.json();
}

export default async function Home() {
  const posts: Post[] = await getRecentPosts();
  
  return (
    <div>
      <div className="text-center py-16 px-4">
        <h1 className="text-5xl font-bold text-blue-900 mb-4">สวัสดี! 👋</h1>
        <p className="text-xl text-gray-600 mb-8">
          บล็อกของ <strong>Thichanon thogplai</strong> • นิสิตปี 3 CS
        </p>
        <Link href="/posts"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          อ่านบทความ →
        </Link>
      </div>
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-blue-900 mb-4">บทความล่าสุด</h2>
        <div className="grid gap-4">
          {posts.map((post: Post) => (
            <Link 
              key={post.id} 
              href={`/posts/${post.id}`}
              className="p-5 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
            >
              <h3 className="font-bold text-blue-800 mb-2">{post.title}</h3>
              <p className="text-gray-500 text-sm">{post.body.slice(0, 80)}...</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}