'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ExternalItem } from '@/lib/external';

export default function BlogSpaPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // =========================
  // W.3 URL State
  // =========================

  // อ่าน query จาก URL ตอนเปิดหน้า
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState<string>(initialQuery);

  // Source
  const [source, setSource] =
    useState<'products' | 'news'>('products');

  // Items
  const [items, setItems] = useState<ExternalItem[]>([]);

  // Loading
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ⭐ W.4 Error
  const [error, setError] = useState<string>('');

  // W.2 Selected Item
  const [selectedItem, setSelectedItem] =
    useState<ExternalItem | null>(null);

  // =========================
  // Fetch Data
  // =========================

  useEffect(() => {
    setIsLoading(true);
    setError('');

    fetch(`/api/aggregate?source=${source}`)
      .then(async (res) => {
        const data = await res.json();

        // ตรวจสอบ Error จาก API
        if (data.error) {
          throw new Error(data.error);
        }

        return data;
      })
      .then((data: { external: ExternalItem[] }) => {
        setItems(data.external);
        setIsLoading(false);
      })
      .catch(() => {
        setItems([]);
        setIsLoading(false);
        setError(
          'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง'
        );
      });
  }, [source]);

  // =========================
  // W.3 Search + URL
  // =========================

  function handleSearch(value: string) {
    setQuery(value);

    if (value.trim() === '') {
      router.replace(`/blog-spa?source=${source}`);
    } else {
      router.replace(
        `/blog-spa?source=${source}&q=${encodeURIComponent(value)}`
      );
    }
  }

  // =========================
  // W.1 Real-time Search
  // =========================

  const filteredItems = items.filter((item) => {
    const keyword = query.toLowerCase();

    return (
      item.title.toLowerCase().includes(keyword) ||
      item.subtitle?.toLowerCase().includes(keyword)
    );
  });

  // =========================
  // เปลี่ยน Source
  // =========================

  function handleSourceChange(
    newSource: 'products' | 'news'
  ) {
    setSource(newSource);

    if (query.trim() === '') {
      router.replace(
        `/blog-spa?source=${newSource}`
      );
    } else {
      router.replace(
        `/blog-spa?source=${newSource}&q=${encodeURIComponent(query)}`
      );
    }
  }

  return (
    <main className="p-8">

      {/* ========================= */}
      {/* Title */}
      {/* ========================= */}

      <h1 className="text-2xl font-bold text-blue-900 mb-6">
        🧩 Blog Aggregator (SPA)
      </h1>

      {/* ========================= */}
      {/* Tabs */}
      {/* ========================= */}

      <div className="flex gap-3 mb-6">

        <button
          onClick={() => handleSourceChange('products')}
          className={`px-4 py-2 rounded-lg ${
            source === 'products'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Products
        </button>

        <button
          onClick={() => handleSourceChange('news')}
          className={`px-4 py-2 rounded-lg ${
            source === 'news'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          News
        </button>

      </div>

      {/* ========================= */}
      {/* W.1 + W.3 Search */}
      {/* ========================= */}

      <div className="mb-6">

        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="ค้นหาสินค้าหรือข่าว..."
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <p className="text-sm text-gray-400 mt-2">
          URL จะบันทึกคำค้นหาไว้ เช่น ?q=shirt
        </p>

      </div>

      {/* ========================= */}
      {/* W.4 Loading */}
      {/* ========================= */}

      {isLoading && (
        <div className="p-6 bg-blue-50 rounded-lg">
          <p className="text-blue-600">
            ⏳ กำลังโหลดข้อมูล {source}...
          </p>
        </div>
      )}

      {/* ========================= */}
      {/* W.4 Error */}
      {/* ========================= */}

      {!isLoading && error && (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="font-bold text-red-700 mb-2">
            ⚠️ เกิดข้อผิดพลาด
          </h2>

          <p className="text-red-600 mb-4">
            {error}
          </p>

          <button
            onClick={() => handleSourceChange(source)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            ลองโหลดใหม่
          </button>
        </div>
      )}

      {/* ========================= */}
      {/* Empty */}
      {/* ========================= */}

      {!isLoading &&
        !error &&
        filteredItems.length === 0 && (
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h2 className="font-bold text-yellow-700 mb-2">
              🔍 ไม่พบข้อมูล
            </h2>

            <p className="text-yellow-600">
              ไม่พบข้อมูลที่ตรงกับ "{query}"
            </p>

            <button
              onClick={() => handleSearch('')}
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg"
            >
              ล้างการค้นหา
            </button>
          </div>
        )}

      {/* ========================= */}
      {/* Items */}
      {/* ========================= */}

      {!isLoading &&
        !error &&
        filteredItems.length > 0 && (

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {filteredItems.map((item) => (

              <div
                key={item.id}
                className="p-4 bg-white rounded-lg border shadow-sm"
              >

                <h2 className="font-bold text-blue-800 mb-2">
                  {item.title}
                </h2>

                <p className="text-gray-500 text-sm mb-4">
                  {item.subtitle}
                </p>

                {/* W.2 */}
                <button
                  onClick={() => setSelectedItem(item)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  ดูรายละเอียด
                </button>

              </div>

            ))}

          </div>

        )}

      {/* ========================= */}
      {/* W.2 Modal */}
      {/* ========================= */}

      {selectedItem && (

        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">

            <h2 className="text-xl font-bold text-blue-900 mb-4">
              รายละเอียด
            </h2>

            <h3 className="text-lg font-bold mb-2">
              {selectedItem.title}
            </h3>

            <p className="text-gray-600 mb-4">
              {selectedItem.subtitle}
            </p>

            <p className="text-sm text-gray-400 mb-6">
              ID: {selectedItem.id}
            </p>

            <button
              onClick={() => setSelectedItem(null)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg"
            >
              ปิด
            </button>

          </div>

        </div>

      )}

    </main>
  );
}