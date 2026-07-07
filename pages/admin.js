import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function Admin() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_KEY
    );

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setSubscriptions(data);
    }
    setLoading(false);
  };

  const updateLimit = async (vkId, amount) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_KEY
    );

    // Находим текущую подписку
    const sub = subscriptions.find(s => s.vk_id === vkId);
    
    const newTotal = (sub ? sub.total_limit : 0) + parseInt(amount);
    const newRemaining = (sub ? sub.remaining_limit : 0) + parseInt(amount);

    if (sub) {
      // Обновляем существующую
      await supabase
        .from('subscriptions')
        .update({
          total_limit: newTotal,
          remaining_limit: newRemaining,
          updated_at: new Date().toISOString()
        })
        .eq('vk_id', vkId);
    } else {
      // Создаём новую
      await supabase
        .from('subscriptions')
        .insert({
          vk_id: vkId,
          total_limit: parseInt(amount),
          remaining_limit: parseInt(amount)
        });
    }

    loadSubscriptions();
    setEditingId(null);
    setEditAmount('');
    alert(`✅ Начислено ${amount} ₽ клиенту ${vkId}`);
  };

  const deleteSubscription = async (vkId) => {
    if (!confirm(`Удалить подписку клиента ${vkId}?`)) return;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_KEY
    );

    await supabase
      .from('subscriptions')
      .delete()
      .eq('vk_id', vkId);

    loadSubscriptions();
  };

  if (loading) return <div style={{padding: 20}}>Загрузка...</div>;

  return (
    <div style={{ padding: 20, fontFamily: 'Arial', maxWidth: 1000, margin: '0 auto' }}>
      <h1>🔧 Админ-панель</h1>
      
      <div style={{ marginBottom: 30, padding: 20, background: '#f5f5f5', borderRadius: 10 }}>
        <h3>📊 Статистика</h3>
        <p>Всего клиентов: {subscriptions.length}</p>
        <p>
          Общий лимит: {subscriptions.reduce((sum, s) => sum + (s.total_limit || 0), 0)} ₽
        </p>
      </div>

      <h3>👥 Клиенты</h3>
      
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#667eea', color: 'white' }}>
            <th style={{ padding: 12, textAlign: 'left' }}>VK ID</th>
            <th style={{ padding: 12, textAlign: 'left' }}>Лимит</th>
            <th style={{ padding: 12, textAlign: 'left' }}>Остаток</th>
            <th style={{ padding: 12, textAlign: 'left' }}>Действия</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map(sub => (
            <tr key={sub.vk_id} style={{ borderBottom: '1px solid #ddd' }}>
              <td style={{ padding: 12 }}>{sub.vk_id}</td>
              <td style={{ padding: 12 }}>{sub.total_limit} ₽</td>
              <td style={{ padding: 12 }}>
                <span style={{ 
                  color: sub.remaining_limit < 1000 ? 'red' : 'green',
                  fontWeight: 'bold'
                }}>
                  {sub.remaining_limit} ₽
                </span>
              </td>
              <td style={{ padding: 12 }}>
                {editingId === sub.vk_id ? (
                  <>
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      placeholder="Сумма"
                      style={{ padding: 5, marginRight: 5, width: 100 }}
                    />
                    <button
                      onClick={() => updateLimit(sub.vk_id, editAmount)}
                      style={{ 
                        background: '#4CAF50',
                        color: 'white',
                        padding: '5px 10px',
                        border: 'none',
                        borderRadius: 5,
                        marginRight: 5,
                        cursor: 'pointer'
                      }}
                    >
                      OK
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setEditAmount(''); }}
                      style={{ 
                        background: '#f44336',
                        color: 'white',
                        padding: '5px 10px',
                        border: 'none',
                        borderRadius: 5,
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => { setEditingId(sub.vk_id); setEditAmount(''); }}
                      style={{ 
                        background: '#2196F3',
                        color: 'white',
                        padding: '5px 10px',
                        border: 'none',
                        borderRadius: 5,
                        marginRight: 5,
                        cursor: 'pointer'
                      }}
                    >
                      Начислить
                    </button>
                    <button
                      onClick={() => deleteSubscription(sub.vk_id)}
                      style={{ 
                        background: '#f44336',
                        color: 'white',
                        padding: '5px 10px',
                        border: 'none',
                        borderRadius: 5,
                        cursor: 'pointer'
                      }}
                    >
                      Удалить
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {subscriptions.length === 0 && (
