'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Comment } from '@/lib/comments';

type CommentBoxProps = {
  chatId: string;
};

type CommentStatus = 'idle' | 'loading' | 'success' | 'error';

export default function CommentBox({ chatId }: CommentBoxProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [filter, setFilter] = useState('');
  const [content, setContent] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [status, setStatus] = useState<CommentStatus>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    fetch(`/api/comments?chatId=${encodeURIComponent(chatId)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error('โหลดคอมเมนต์ไม่สำเร็จ');
        return response.json() as Promise<{ comments: Comment[]; authenticated: boolean }>;
      })
      .then((data) => {
        if (!active) return;
        setComments(data.comments);
        setAuthenticated(data.authenticated);
      })
      .catch(() => {
        if (active) setError('ไม่สามารถโหลดคอมเมนต์ได้');
      })
      .finally(() => {
        if (active) setIsCheckingAuth(false);
      });

    return () => {
      active = false;
    };
  }, [chatId]);

  const validationError =
    content.trim().length > 0 && content.trim().length < 3
      ? 'คอมเมนต์ต้องมีอย่างน้อย 3 ตัวอักษร'
      : content.length > 1000
        ? 'คอมเมนต์ต้องไม่เกิน 1,000 ตัวอักษร'
        : '';

  const filteredComments = useMemo(() => {
    const keyword = filter.trim().toLowerCase();
    if (!keyword) return comments;
    return comments.filter(
      (comment) =>
        comment.content.toLowerCase().includes(keyword) ||
        comment.author.toLowerCase().includes(keyword),
    );
  }, [comments, filter]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (validationError || content.trim().length < 3 || status === 'loading') return;

    setError('');
    setStatus('loading');

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, content }),
      });
      const data = await response.json() as { comment?: Comment; error?: string };

      if (!response.ok || !data.comment) {
        if (response.status === 401) setAuthenticated(false);
        throw new Error(data.error || 'ส่งคอมเมนต์ไม่สำเร็จ');
      }

      setComments((current) => [...current, data.comment!]);
      setContent('');
      setStatus('success');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'ส่งคอมเมนต์ไม่สำเร็จ');
      setStatus('error');
    }
  }

  return (
    <section className="mt-10 border-t border-gray-200 pt-6" aria-labelledby="comments-title">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 id="comments-title" className="text-xl font-bold text-gray-900">
          คอมเมนต์ ({comments.length})
        </h2>
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="กรองคอมเมนต์..."
          aria-label="กรองคอมเมนต์"
          className="w-48 border border-gray-300 rounded px-3 py-2 text-sm"
        />
      </div>

      {filteredComments.length > 0 ? (
        <div className="space-y-3 mb-6">
          {filteredComments.map((comment) => (
            <article key={comment.id} className="border-l-4 border-blue-500 bg-white p-4 shadow-sm">
              <div className="flex justify-between gap-3 text-sm mb-1">
                <strong className="text-gray-800">{comment.author}</strong>
                <time className="text-gray-400" dateTime={comment.createdAt}>
                  {new Date(comment.createdAt).toLocaleString('th-TH')}
                </time>
              </div>
              <p className="text-gray-600 whitespace-pre-wrap">{comment.content}</p>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 mb-6">ยังไม่มีคอมเมนต์</p>
      )}

      {isCheckingAuth ? (
        <p className="text-gray-400">กำลังตรวจสอบสิทธิ์...</p>
      ) : authenticated ? (
        <form onSubmit={handleSubmit} className="space-y-2">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="เขียนคอมเมนต์ของคุณ..."
            maxLength={1000}
            aria-label="เขียนคอมเมนต์"
            className="w-full min-h-24 border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center justify-between gap-3">
            <p className={`text-sm ${validationError ? 'text-red-600' : 'text-gray-400'}`}>
              {validationError || `${content.length}/1,000`}
            </p>
            <button
              type="submit"
              disabled={content.trim().length < 3 || status === 'loading'}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-300"
            >
              {status === 'loading' ? 'กำลังส่ง...' : 'ส่งคอมเมนต์'}
            </button>
          </div>
          {status === 'success' && <p className="text-green-600 text-sm">ส่งคอมเมนต์สำเร็จ</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </form>
      ) : (
        <p className="text-gray-600">
          <Link href="/login" className="text-blue-600 underline">เข้าสู่ระบบ</Link> ก่อนจึงจะแสดงความคิดเห็นได้
        </p>
      )}
    </section>
  );
}
