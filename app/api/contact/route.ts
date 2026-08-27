import { addMessage, getMessages } from '@/lib/messages';
export async function GET() {
    return Response.json({ messages: getMessages() });
}
export async function POST(request: Request) {
    const body = await request.json();
    // ตรวจสอบฝั่ง Server เสมอ — ห้ามเชื่อ client อย่างเดียว
    if (!body.name || !body.email || !body.message) {
        return Response.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });
    }
    const saved = addMessage(body);
    return Response.json({ ok: true, item: saved }, { status: 201 });
}