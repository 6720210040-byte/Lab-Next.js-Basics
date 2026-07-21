// components/LikeButton.tsx
'use client'; // ← ต้องวางบรรทัดแรก!
import { useState } from 'react';
export default function LikeButton() {
    // ✨ TypeScript: useState<Type> กําหนดชนิดให้state
    const [liked, setLiked] = useState<boolean>(false);
    const [count, setCount] = useState<number>(0);
    const handleLike = (): void => {
        setLiked((prev: boolean) => !prev);
        setCount((prev: number) => prev + (liked ? -1 : 1));
    };
    return (
        <button
            onClick={handleLike}
            className={`px-6 py-3 rounded-full text-lg font-bold transition-all ${liked
                    ? 'bg-red-500 text-white scale-110'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
        >
            {liked ? '❤' : '🤍'} {count} Likes
        </button>
    );
}