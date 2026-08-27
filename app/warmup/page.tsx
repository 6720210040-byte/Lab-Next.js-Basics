'use client';

import { useState } from 'react';

export default function WarmupPage() {
  const [text, setText] = useState('');

  return (
    <div className="p-8">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="พิมพ์ข้อความ"
        className="border p-2 rounded"
      />

      <p className="mt-4">
        พิมพ์ว่า: {text}
      </p>
    </div>
  );
}