export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

// เก็บใน memory ไปก่อน — Week 9 จะเปลี่ยนเป็น PostgreSQL + Prisma
// ใส่ข้อมูลเริ่มต้น (Initial Seed Data) สำหรับทดสอบค้นหา ?search=สวัสดี
const messages: ContactMessage[] = [
  {
    id: 'msg-1',
    name: 'สมชาย ใจดี',
    email: 'somchai@example.com',
    message: 'สวัสดีครับ สนใจสอบถามข้อมูลเพิ่มเติมเกี่ยวกับคอร์สเรียน',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'msg-2',
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Hello, I would like to know more about the project.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'msg-3',
    name: 'สมหญิง สวัสดี',
    email: 'somying@example.com',
    message: 'ส่งการบ้านแลปเรียบร้อยแล้วค่ะ ขอบคุณอาจารย์มากค่ะ',
    createdAt: new Date().toISOString(),
  },
];

export function addMessage(data: Omit<ContactMessage, 'id' | 'createdAt'>) {
  const item: ContactMessage = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...data,
  };
  messages.push(item);
  return item;
}

export function getMessages() {
  return messages;
}

export function updateMessage(id: string, updates: Partial<ContactMessage>) {
  const index = messages.findIndex((m) => m.id === id);
  if (index === -1) return null;
  messages[index] = { ...messages[index], ...updates };
  return messages[index];
}

export function deleteMessage(id: string) {
  const index = messages.findIndex((m) => m.id === id);
  if (index === -1) return false;
  messages.splice(index, 1);
  return true;
}