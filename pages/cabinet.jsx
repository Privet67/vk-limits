import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

export default function Cabinet() {
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;
    const vkId = router.query.vk_id;
    if (!vkId) return;

    // Загружаем подписку
    fetch(`/api/get-subscription?vk_id=${vkId}`)
      .then(r => r.json())
      .then(data => {
        setSubscription(data);
        setLoading(false);
      });

    // Загружаем товары
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_KEY
    );

    supabase
      .from('products')
      .select('*')
      .eq('in_stock', true)
      .then(({ data }) => {
        if (data) setProducts(data);
      });
  }, [router.isReady, router.query]);

  const buyProduct = async (product) => {
    if (!confirm(`Купить "${product.name}" за ${product.price} ₽?`)) return;

    setBuying(product.id);
    
    const res = await fetch('/api/buy-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vk_id: parseInt(router.query.vk_id),
        product_id: product.id
      })
    });

    const result = await res.json();

    if (result.success) {
      alert(`✅ Куплено: ${result.product_name}\nОстаток лимита: ${result.new_limit} ₽`);
      // Обновляем лимит
      setSubscription({ ...subscription, remaining_limit: result.new_limit });
    } else {
      alert(`❌ Ошибка: ${result.error}`);
    }

    setBuying(null);
  };

  if (loading) return <div style={{padding: 20, fontFamily: 'Arial'}}>Загрузка...</div>;
  if (!subscription) return <div style={{padding: 20}}>Подписка не найдена</div>;

  return (
    <div style={{ padding: 20, fontFamily: 'Arial', maxWidth: 800, margin: '0 auto' }}>
      <h1>💳 Ваша карта подписки</h1>
      
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: 30, 
        borderRadius: 15, 
        marginBottom: 30 
      }}>
        <h2 style={{ margin: '0 0 10px 0' }}>Лимит: {subscription.remaining_limit} ₽</h2>
        <p style={{ margin: 0, opacity: 0.9 }}>Всего начислено: {subscription.total_limit} ₽</p>
      </div>

      <h3>️ Каталог товаров</h3>
      
      {products.length === 0 ? (
        <p>Товары пока не добавлены</p>
      ) : (
        <div style={{ display: 'grid', gap: 15 }}>
          {products.map(product => (
            <div key={product.id} style={{ 
              border: '1px solid #ddd', 
              padding: 20, 
              borderRadius: 10,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h4 style={{ margin: '0 0 5px 0' }}>{product.name}</h4>
                <p style={{ margin: 0, color: '#666', fontSize: 18 }}>{product.price} ₽</p>
              </div>
              <button
                onClick={() => buyProduct(product)}
                disabled={buying === product.id || subscription.remaining_limit < product.price}
                style={{
                  background: subscription.remaining_limit >= product.price ? '#4CAF50' : '#ccc',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: 8,
                  cursor: subscription.remaining_limit >= product.price ? 'pointer' : 'not-allowed',
                  fontSize: 16
                }}
              >
                {buying === product.id ? 'Покупка...' : 'Купить'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
