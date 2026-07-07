import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Cabinet() {
  const router = useRouter();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!router.isReady) return;
    const vkId = router.query.vk_id;
    if (!vkId) return;

    fetch(`/api/get-subscription?vk_id=${vkId}`)
      .then(r => r.json())
      .then(setData)
      .catch(err => console.error(err));
  }, [router.isReady, router.query]);

  if (!data) return <div style={{padding: 20}}>Загрузка...</div>;

  return (
    <div style={{ padding: 20, fontFamily: 'Arial', maxWidth: 600, margin: '0 auto' }}>
      <h1>Ваша карта подписки</h1>
      <div style={{ background: '#f0f0f0', padding: 20, borderRadius: 10 }}>
        <h2>Лимит: {data.remaining_limit} ₽</h2>
        <p>Всего: {data.total_limit} ₽</p>
      </div>
    </div>
  );
}
