import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

export default function Cabinet() {
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [showOrders, setShowOrders] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;
    const vkId = router.query.vk_id;
    if (!vkId) return;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_KEY
    );

    // Загружаем подписку
    fetch(`/api/get-subscription?vk_id=${vkId}`)
      .then(r => r.json())
      .then(data => {
        setSubscription(data);
        setLoading(false);
      });

// Загружаем товары через API
fetch('/api/get-products')
  .then(r => r.json())
  .then(data => {
    if (data) setProducts(data);
  })
  .catch(err => console.error('Error loading products:', err));

    // Загружаем историю покупок
    supabase
      .from('orders')
      .select('*, products(name)')
      .eq('vk_id', parseInt(vkId))
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setOrders(data);
      });
  }, [router.isReady, router.query]);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

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
      setSubscription({ ...subscription, remaining_limit: result.new_limit });
      showNotification(`Куплено: ${result.product_name} | Остаток: ${result.new_limit} ₽`, 'success');
      
      // Обновляем историю
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_KEY
      );
      const { data } = await supabase
        .from('orders')
        .select('*, products(name)')
        .eq('vk_id', parseInt(router.query.vk_id))
        .order('created_at', { ascending: false });
      if (data) setOrders(data);
    } else {
      showNotification(result.error, 'error');
    }

    setBuying(null);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ color: 'white', fontSize: 24 }}>
          <div style={{
            width: 50, height: 50, border: '4px solid rgba(255,255,255,0.3)',
            borderTop: '4px solid white', borderRadius: '50%',
            animation: 'spin 1s linear infinite', margin: '0 auto 20px'
          }} />
          Загрузка...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontFamily: 'Arial', fontSize: 20
      }}>
        Подписка не найдена. Обратитесь к администратору.
      </div>
    );
  }

  const percent = subscription.total_limit > 0
    ? Math.round((subscription.remaining_limit / subscription.total_limit) * 100)
    : 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      fontFamily: 'Arial, sans-serif',
      color: 'white',
      padding: 0,
      margin: 0
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      {/* Уведомление */}
      {notification && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: notification.type === 'success' ? 'linear-gradient(135deg, #00b09b, #96c93d)' : 'linear-gradient(135deg, #ff416c, #ff4b2b)',
          color: 'white', padding: '15px 30px', borderRadius: 12,
          fontSize: 16, fontWeight: 'bold', zIndex: 1000,
          boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          animation: 'slideDown 0.3s ease'
        }}>
          {notification.type === 'success' ? '✅' : '❌'} {notification.message}
        </div>
      )}

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>

        {/* Карточка подписки */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 24, padding: 35, marginBottom: 30,
          boxShadow: '0 20px 60px rgba(102, 126, 234, 0.4)',
          animation: 'fadeIn 0.5s ease',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: -50, right: -50,
            width: 200, height: 200, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)'
          }} />
          <div style={{
            position: 'absolute', bottom: -30, left: -30,
            width: 150, height: 150, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)'
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 5 }}>💳 КАРТА ПОДПИСКИ</div>
            <div style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 5 }}>
              {subscription.remaining_limit.toLocaleString()} ₽
            </div>
            <div style={{ fontSize: 16, opacity: 0.7, marginBottom: 20 }}>
              из {subscription.total_limit.toLocaleString()} ₽
            </div>

            {/* Прогресс-бар */}
            <div style={{
              background: 'rgba(255,255,255,0.2)', borderRadius: 10,
              height: 12, overflow: 'hidden'
            }}>
              <div style={{
                background: percent > 30 ? '#00d2ff' : '#ff416c',
                height: '100%', width: `${percent}%`, borderRadius: 10,
                transition: 'width 0.5s ease'
              }} />
            </div>
            <div style={{ fontSize: 13, opacity: 0.7, marginTop: 8, textAlign: 'right' }}>
              Осталось {percent}%
            </div>
          </div>
        </div>

        {/* Табы */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 25, animation: 'fadeIn 0.6s ease' }}>
          <button
            onClick={() => setShowOrders(false)}
            style={{
              flex: 1, padding: '14px 20px', border: 'none', borderRadius: 14,
              background: !showOrders ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255,255,255,0.05)',
              color: 'white', fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
              border: !showOrders ? '1px solid rgba(102, 126, 234, 0.5)' : '1px solid transparent'
            }}
          >
            🛍️ Товары ({products.length})
          </button>
          <button
            onClick={() => setShowOrders(true)}
            style={{
              flex: 1, padding: '14px 20px', border: 'none', borderRadius: 14,
              background: showOrders ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255,255,255,0.05)',
              color: 'white', fontSize: 16, fontWeight: 'bold', cursor: 'pointer',
              border: showOrders ? '1px solid rgba(102, 126, 234, 0.5)' : '1px solid transparent'
            }}
          >
            📋 История ({orders.length})
          </button>
        </div>

        {/* Товары */}
        {!showOrders && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            {products.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: 60,
                background: 'rgba(255,255,255,0.05)', borderRadius: 20
              }}>
                <div style={{ fontSize: 48, marginBottom: 15 }}>📦</div>
                <div style={{ fontSize: 18, opacity: 0.6 }}>Товары пока не добавлены</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 15 }}>
                {products.map((product, i) => {
                  const canBuy = subscription.remaining_limit >= product.price;
                  return (
                    <div key={product.id} style={{
                      background: 'rgba(255,255,255,0.07)',
                      borderRadius: 18, padding: 22,
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      border: '1px solid rgba(255,255,255,0.1)',
                      animation: `fadeIn ${0.3 + i * 0.1}s ease`,
                      backdropFilter: 'blur(10px)'
                    }}>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 5 }}>
                          {product.name}
                        </div>
                        <div style={{
                          fontSize: 22, fontWeight: 'bold',
                          background: 'linear-gradient(135deg, #00d2ff, #928dab)',
                          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                        }}>
                          {product.price.toLocaleString()} ₽
                        </div>
                      </div>
                      <button
                        onClick={() => buyProduct(product)}
                        disabled={buying === product.id || !canBuy}
                        style={{
                          background: canBuy
                            ? 'linear-gradient(135deg, #00b09b, #96c93d)'
                            : 'rgba(255,255,255,0.1)',
                          color: canBuy ? 'white' : 'rgba(255,255,255,0.3)',
                          padding: '14px 28px', border: 'none', borderRadius: 14,
                          fontSize: 16, fontWeight: 'bold', cursor: canBuy ? 'pointer' : 'not-allowed',
                          transition: 'all 0.3s ease',
                          boxShadow: canBuy ? '0 5px 20px rgba(0,176,155,0.3)' : 'none'
                        }}
                      >
                        {buying === product.id ? '⏳' : canBuy ? 'Купить' : 'Нет лимита'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* История покупок */}
        {showOrders && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            {orders.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: 60,
                background: 'rgba(255,255,255,0.05)', borderRadius: 20
              }}>
                <div style={{ fontSize: 48, marginBottom: 15 }}>🛒</div>
                <div style={{ fontSize: 18, opacity: 0.6 }}>Покупок пока нет</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {orders.map((order, i) => (
                  <div key={order.id} style={{
                    background: 'rgba(255,255,255,0.07)', borderRadius: 14, padding: 18,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    border: '1px solid rgba(255,255,255,0.1)',
                    animation: `fadeIn ${0.3 + i * 0.1}s ease`
                  }}>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: 16 }}>
                        {order.products?.name || `Товар #${order.product_id}`}
                      </div>
                      <div style={{ fontSize: 13, opacity: 0.5, marginTop: 4 }}>
                        {new Date(order.created_at).toLocaleDateString('ru-RU', {
                          day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div style={{
                      fontSize: 18, fontWeight: 'bold', color: '#ff6b6b'
                    }}>
                      -{order.amount.toLocaleString()} ₽
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Подвал */}
        <div style={{
          textAlign: 'center', padding: '40px 0 20px',
          fontSize: 13, opacity: 0.3
        }}>
          Система подписок • vk-limits
        </div>
      </div>
    </div>
  );
}
