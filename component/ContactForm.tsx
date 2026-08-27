'use client'; // ← บรรทัดแรกเสมอ
import { useState } from 'react';
export default function ContactForm() {
 const [name, setName] = useState('');
 const [email, setEmail] = useState('');
 const [message, setMessage] = useState('');
 const [error, setError] = useState('');
 function validate() {
 if (name.trim().length < 2) return 'กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร';
 if (!email.includes('@')) return 'อีเมลไม่ถูกต้อง';
 if (message.trim().length < 5) return 'ข้อความสั้นเกินไป';
 return '';
 }
 function handleSubmit(e: React.FormEvent) {
 e.preventDefault(); // ← ห้ามให้browser reload
 const msg = validate();
 if (msg) { setError(msg); return; }
 setError('');
 // ขั้นต่อไป: ส่งไป API route (ดูL2)
 }
 return (
 <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
 <input value={name} onChange={(e) => setName(e.target.value)}
 placeholder="ชื่อ" className="border p-2 w-full rounded" />
 <input value={email} onChange={(e) => setEmail(e.target.value)}
 placeholder="อีเมล" className="border p-2 w-full rounded" />
 <textarea value={message} onChange={(e) => setMessage(e.target.value)}
 placeholder="ข้อความ" className="border p-2 w-full rounded" />
 {error && <p className="text-red-600 text-sm">{error}</p>}
 <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
 ส่งข้อความ
 </button>
 </form>
 );
}