import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Подключаемся к Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
  
  // Получаем vk_id из query параметров
  const { vk_id } = req.query;
  
  if (!vk_id) {
    return res.status(400).json({ error: 'vk_id required' });
  }
  
  // Ищем подписку
  let { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('vk_id', vk_id)
    .single();
  
  // Если подписки нет — создаём пустую
  if (!subscription) {
    const { data: newSub, error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        vk_id: parseInt(vk_id),
        total_limit: 0,
        remaining_limit: 0
      })
      .select()
      .single();
    
    if (insertError) {
      return res.status(500).json({ error: insertError.message });
    }
    
    subscription = newSub;
  }
  
  return res.status(200).json(subscription);
}
