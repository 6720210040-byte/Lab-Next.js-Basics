// app/courses/[id]/page.tsx
interface CourseDetail {
    name: string;
    desc: string;
    instructor: string;
}
// Record<string, CourseDetail> = object ที่ key เป็น string, value เป็น CourseDetail
const courseData: Record<string, CourseDetail> = {
    '0214321': { name: 'Web App Design & Dev', desc: 'Next.js + React + DB', instructor: 'อ.สิรินดา' },
    '0214101': { name: 'Programming Fundamentals', desc: 'C/C++ พื้นฐาน', instructor: 'อ.ประจํา' },
};
// ✨ TypeScript: กําหนด type ให้params
export default function CourseDetail(
    { params }: { params: { id: string } }
) {
    const course = courseData[params.id];
    if (!course) {
        return (
            <main className="p-12">
                <h1 className="text-red-500">ไม่พบรายวิชา {params.id}</h1>
            </main>
        );
    }
    return (
        <main className="p-12">
            <p className="text-gray-500 mb-2">รหัสวิชา: {params.id}</p>
            <h1 className="text-3xl font-bold text-blue-900">{course.name}</h1>
            <p className="mt-4 text-gray-700">{course.desc}</p>
            <p className="mt-2 text-gray-500">ผู้สอน: {course.instructor}</p>
        </main>
    );
}