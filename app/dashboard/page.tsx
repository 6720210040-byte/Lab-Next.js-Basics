import { getMessages } from '@/lib/messages';

export default async function DashboardPage() {
    const messages = await getMessages(); // Server Component — เรียก Model ตรงได้
    return (
        <main className="p-8">
            <h1 className="text-2xl font-bold mb-4">Dashboard (ต้อง Login ก่อน)</h1>
            <p>จํานวนข้อความที่ได้รับ: {messages.length}</p>
        </main>
    );
}