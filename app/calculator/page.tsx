'use client';
import { useState } from 'react';
export default function PriceCalculator() {
 const [quantity, setQuantity] = useState(1);
 const pricePerItem = 150;
 const total = quantity * pricePerItem; // ← คํานวณสด ไม่ใช่ state
 return (
 <div className="p-8">
 <input type="number" value={quantity} min={1}
 onChange={(e) => setQuantity(Number(e.target.value))} />
 <p>ราคารวม: {total.toLocaleString()} บาท</p>
 </div>
 );
}