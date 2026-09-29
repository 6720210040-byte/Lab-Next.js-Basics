'use client'; // ← บรรทัดแรกเสมอ
import { useState } from 'react';

export default function ContactForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [tag, setTag] = useState('General');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

    // 1. เพิ่มตัวแปร isValid สำหรับตรวจสอบตอนพิมพ์ (Task 1.4)
    const isValid = name.trim().length >= 2 && email.includes('@') && message.trim().length >= 5;

    function validate() {
        if (name.trim().length < 2) return 'กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร';
        if (!email.includes('@')) return 'อีเมลไม่ถูกต้อง';
        if (message.trim().length < 5) return 'ข้อความสั้นเกินไป';
        return '';
    }
    
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const msg = validate();
        if (msg) { setError(msg); return; }
        
        setError(''); 
        setStatus('sending');
        
        const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, tag, message }),
        });
        
        if (!res.ok) { setStatus('error'); return; }
        
        setStatus('success');
        setName(''); setEmail(''); setTag('General'); setMessage('');
    }

    // 2. ส่วน return ต้องอยู่ตรงนี้! (ก่อนปีกกาปิดตัวล่างสุด)
    return (
        <form onSubmit={handleSubmit} className="space-y-3 max-w-md">
            <input 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                placeholder="ชื่อ" 
                className="border p-2 w-full rounded" 
            />
            
            <input 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                placeholder="อีเมล" 
                className="border p-2 w-full rounded" 
            />

            <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="border p-2 w-full rounded bg-white text-gray-900"
            >
                <option value="General">General (ทั่วไป)</option>
                <option value="Support">Support (แจ้งปัญหา/ช่วยเหลือ)</option>
                <option value="Feedback">Feedback (ข้อเสนอแนะ)</option>
            </select>
            
            <textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)}
                placeholder="ข้อความ" 
                className="border p-2 w-full rounded" 
            />
            
            {/* แจ้งเตือน Validate ฝั่ง Client */}
            {error && <p className="text-red-600 text-sm">{error}</p>}
            
            {/* แสดงสถานะตอนกด Submit (Task 2.2) */}
            {status === 'sending' && <p className="text-gray-400">กำลังส่ง...</p>}
            {status === 'success' && <p className="text-green-600">ส่งสำเร็จ ขอบคุณครับ/ค่ะ</p>}
            {status === 'error' && <p className="text-red-600">ส่งไม่สำเร็จ ลองใหม่อีกครั้ง</p>}

            {/* ใช้ isValid ควบคุมการกดปุ่ม (Task 1.4) */}
            <button 
                type="submit" 
                disabled={!isValid}
                className={isValid ? "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition" : "bg-gray-300 text-white px-4 py-2 rounded cursor-not-allowed"}
            >
                ส่งข้อความ
            </button>
        </form>
    );
} // ← ปีกกาปิดของฟังก์ชัน ContactForm ต้องอยู่ตรงนี้เท่านั้น