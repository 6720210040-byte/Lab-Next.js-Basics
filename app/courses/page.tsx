// app/courses/page.tsx
// ✨ TypeScript: กําหนด interface ให้ข้อมูลวิชา
interface Course {
    id: string;
    name: string;
    credits: number;
}
const courses: Course[] = [
    { id: '0214321', name: 'Web App Design & Dev', credits: 3 },
    { id: '0214101', name: 'Programming Fundamentals', credits: 3 },
    { id: '0214201', name: 'Data Structures', credits: 3 },
];
export default function Courses() {
    return (
        <main className="p-12">
            <h1 className="text-3xl font-bold text-blue-900 mb-6">รายวิชาของฉัน</h1>
            <div className="space-y-3">
                {courses.map((c: Course) => (
                    <div key={c.id}
                        className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                        <h2 className="font-bold text-blue-800">{c.id}</h2>
                        <p className="text-gray-600">{c.name} • {c.credits} หน่วยกิต</p>
                    </div>
                ))}
            </div>
        </main>
    );
}