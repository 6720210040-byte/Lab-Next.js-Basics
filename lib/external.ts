export interface ExternalItem {
    id: string;
    title: string;
    subtitle?: string;
    image?: string;
}
export async function fetchExternal(
    source: 'products' | 'news'
): Promise<ExternalItem[]> {
    if (source === 'products') {
        try {
            const res = await fetch(
                'https://dummyjson.com/products?limit=8',
                { cache: 'no-store' }
            );
            if (!res.ok) throw new Error('Failed to fetch from primary product API');
            const data = await res.json();
            return (data.products || []).map((p: any) => ({
                id: String(p.id),
                title: p.title,
                subtitle: `$${p.price} • ${p.category}`,
                image: p.thumbnail || p.images?.[0],
            }));
        } catch {
            // Mock fallback data กรณี API ภายนอกมีปัญหา
            return [
                { id: '1', title: 'Fjallraven - Foldsack No. 1 Backpack', subtitle: '$109.95 • men\'s clothing' },
                { id: '2', title: 'Mens Casual Premium Slim Fit T-Shirts', subtitle: '$22.3 • men\'s clothing' },
                { id: '3', title: 'Mens Cotton Jacket', subtitle: '$55.99 • men\'s clothing' },
                { id: '4', title: 'Mens Casual Slim Fit', subtitle: '$15.99 • men\'s clothing' },
                { id: '5', title: 'John Hardy Women\'s Legends Naga Gold & Silver Bracelet', subtitle: '$695 • jewelery' },
                { id: '6', title: 'Solid Gold Petite Micropave', subtitle: '$168 • jewelery' },
                { id: '7', title: 'White Gold Plated Princess', subtitle: '$9.99 • jewelery' },
                { id: '8', title: 'Pierced Owl Rose Gold Plated Stainless Steel Double', subtitle: '$10.99 • jewelery' },
            ];
        }
    }
    // source === 'news' — ดึงจาก Hacker News (Algolia)
    const data = await fetch(
        'https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=8'
    ).then((r) => r.json());
    return (data.hits || []).map((h: any) => ({
        id: String(h.objectID), title: h.title,
        subtitle: `${h.points ?? 0} points • by ${h.author}`,
    }));
}