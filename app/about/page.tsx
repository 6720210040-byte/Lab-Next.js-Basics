// app/about/page.tsx
export default function About() {
    return (
        <main className="p-12">
            <h1 className="text-3xl font-bold text-blue-900">เกี่ยวกับฉัน</h1>
            <div className="mt-6 space-y-2 text-gray-700">
                <p>🎓 สาขา: วิทยาการคอมพิวเตอร์</p>
                <p>📚 รายวิชาที่ชอบ: [ชื่อรายวิชา]</p>
                <p>🎯 เป้าหมาย: [เป้าหมาย]</p>
            </div>
        </main>
    );
}