export interface User { id: string; email: string; password: string; }
// mock ไว้ก่อน — Week 9 จะเปลี่ยนเป็นดึงจาก PostgreSQL จริง
const users: User[] = [
 { id: '1', email: 'admin@tsu.ac.th', password: '1234' },
];
export async function findUserByEmail(email: string) {
 return users.find((u) => u.email === email) ?? null;
}

export function findUserById(id: string) {
 return users.find((u) => u.id === id) ?? null;
}