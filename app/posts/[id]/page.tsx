// app/posts/[id]/page.tsx
import type { Metadata, ResolvingMetadata } from 'next';

interface Post {
    id: number;
    title: string;
    body: string;
}

// ✨ TypeScript: กำหนด type ให้ params เพื่อใช้ร่วมกันทั้ง Component และ Metadata
type Props = {
    params: { id: string };
};

// ฟังก์ชันสำหรับสร้าง Dynamic Metadata (ดึงข้อมูลจาก API มาทำ Title/Description)
export async function generateMetadata(
    { params }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const res = await fetch(
        `https://jsonplaceholder.typicode.com/posts/${params.id}`
    );
    const post = await res.json();
    
    return {
        title: post.title,
        description: post.body.slice(0, 160),
    };
}

// ตัว Component เปลี่ยนมาใช้ Props ที่ประกาศไว้ด้านบน
export default async function PostDetail({ params }: Props) {
    const res = await fetch(
        `https://jsonplaceholder.typicode.com/posts/${params.id}`,
        { cache: 'no-store' }
    );
    
    if (!res.ok) {
        return (
            <main className="p-12">
                <h1 className="text-red-500">ไม่พบบทความ #{params.id}</h1>
            </main>
        );
    }
    
    const post: Post = await res.json();
    
    return (
        <main className="p-12 max-w-2xl mx-auto">
            <p className="text-gray-400 text-sm mb-2">บทความ #{post.id}</p>
            <h1 className="text-3xl font-bold text-blue-900 mb-4">{post.title}</h1>
            <p className="text-gray-700 leading-relaxed">{post.body}</p>
        </main>
    );
}