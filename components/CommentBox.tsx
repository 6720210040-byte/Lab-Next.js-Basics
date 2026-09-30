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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [status, setStatus] = useState<CommentStatus>('idle');
  const [error, setError] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    let active = true;

    async function fetchData() {
      try {
        setIsCheckingAuth(true);

        const [commentsRes, meRes] = await Promise.all([
          fetch(`/api/comments?chatId=${encodeURIComponent(chatId)}`, {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
          }),
          fetch('/api/auth/me', {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
          }),
        ]);

        if (!active) return;

        let isAuth = false;
        let userId: string | null = null;

        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.authenticated && meData.user) {
            isAuth = true;
            userId = meData.user.id;
          }
        }

        if (commentsRes.ok) {
          const data = await commentsRes.json();
          setComments(data.comments || []);
          if (data.authenticated) {
            isAuth = true;
            userId = data.currentUserId || userId;
          }
        } else {
          setError('ไม่สามารถโหลดคอมเมนต์ได้');
        }

        setAuthenticated(isAuth);
        setCurrentUserId(userId);
      } catch {
        if (active) setError('ไม่สามารถโหลดคอมเมนต์ได้');
      } finally {
        if (active) setIsCheckingAuth(false);
      }
    }

    fetchData();

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
        (comment.content || (comment as any).text || '').toLowerCase().includes(keyword) ||
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
        body: JSON.stringify({ chatId, content, text: content }),
      });
      const data = await response.json() as { comment?: Comment; error?: string };

      if (!response.ok || !data.comment) {
        if (response.status === 401 || response.status === 403) setAuthenticated(false);
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

  function handleStartEdit(comment: Comment) {
    setEditingId(comment.id);
    setEditContent(comment.content || (comment as any).text || '');
    setActionError('');
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditContent('');
    setActionError('');
  }

  async function handleSaveEdit(id: string) {
    if (editContent.trim().length < 3) {
      setActionError('คอมเมนต์ต้องมีอย่างน้อย 3 ตัวอักษร');
      return;
    }
    setIsSavingEdit(true);
    setActionError('');

    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent, text: editContent }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'แก้ไขคอมเมนต์ไม่สำเร็จ');
      }

      setComments((current) =>
        current.map((c) => (c.id === id ? { ...c, content: editContent, text: editContent } : c))
      );
      setEditingId(null);
      setEditContent('');
    } catch (err: any) {
      setActionError(err.message || 'เกิดข้อผิดพลาดในการแก้ไข');
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบคอมเมนต์นี้?')) return;
    setActionError('');

    try {
      const response = await fetch(`/api/comments/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ลบคอมเมนต์ไม่สำเร็จ');
      }

      setComments((current) => current.filter((c) => c.id !== id));
    } catch (err: any) {
      setActionError(err.message || 'เกิดข้อผิดพลาดในการลบ');
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

      {actionError && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
          {actionError}
        </div>
      )}

      {filteredComments.length > 0 ? (
        <div className="space-y-3 mb-6">
          {filteredComments.map((comment) => {
            const isOwner = Boolean(currentUserId && (comment as any).authorId === currentUserId);
            const isEditing = editingId === comment.id;

            return (
              <article key={comment.id} className="border-l-4 border-blue-500 bg-white p-4 shadow-sm rounded-r">
                <div className="flex justify-between items-center gap-3 text-sm mb-2">
                  <div className="flex items-center gap-2">
                    <strong className="text-gray-800">{comment.author}</strong>
                    {isOwner && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium">
                        คุณ (เจ้าของ)
                      </span>
                    )}
                  </div>
                  <time className="text-gray-400 text-xs" dateTime={typeof comment.createdAt === 'string' ? comment.createdAt : new Date(comment.createdAt).toISOString()}>
                    {new Date(comment.createdAt).toLocaleString('th-TH')}
                  </time>
                </div>

                {isEditing ? (
                  <div className="space-y-2 mt-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full min-h-20 border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isSavingEdit}
                        className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={isSavingEdit || editContent.trim().length < 3}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
                      >
                        {isSavingEdit ? 'กำลังบันทึก...' : 'บันทึก'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-600 whitespace-pre-wrap">{comment.content || (comment as any).text}</p>
                    {isOwner && (
                      <div className="flex gap-2 mt-3 pt-2 border-t border-gray-100 justify-end">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(comment)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50"
                        >
                          ✏️ แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(comment.id)}
                          className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50"
                        >
                          🗑️ ลบ
                        </button>
                      </div>
                    )}
                  </>
                )}
              </article>
            );
          })}
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 text-center my-4">
          <p className="text-gray-700 font-medium text-sm mb-1">
            🔒 บุคคลที่จะคอมเมนต์ต้องเข้าสู่ระบบก่อน
          </p>
          <p className="text-gray-500 text-xs mb-3">
            คุณสามารถเข้าสู่ระบบหรือสมัครสมาชิกใหม่ได้ง่ายๆ ด้วย Gmail และรหัสผ่าน
          </p>
          <Link
            href="/login?redirect=/blog-spa"
            className="inline-block px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            เข้าสู่ระบบ / สมัครสมาชิก
          </Link>
        </div>
      )}
    </section>
  );
}

