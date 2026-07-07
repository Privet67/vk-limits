import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Разрешаем только POST запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );

  const { vk_id, product_id } = req.body;

  if (!vk_id || !product_id) {
    return res.status(400).json({ error: 'vk_id and product_id required' });
  }

  // Получаем товар
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', product_id)
    .single();

  if (productError || !product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  // Получаем подписку
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('vk_id', vk_id)
    .single();

  if (subError || !subscription) {
    return res.status(400).json({ error: 'Subscription not found' });
  }

  // Проверяем лимит
  if (subscription.remaining_limit < product.price) {
    return res.status(400).json({ 
      error: 'Недостаточно лимита',
      remaining: subscription.remaining_limit,
      price: product.price
    });
  }

  // Списываем лимит
  const newRemaining = subscription.remaining_limit - product.price;
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({ 
      remaining_limit: newRemaining,
      updated_at: new Date().toISOString()
    })
    .eq('vk_id', vk_id);

  if (updateError) {
    return res.status(500).json({ error: updateError.message });
  }

  // Создаём заказ
  const { error: orderError } = await supabase
    .from('orders')
    .insert({
      vk_id: parseInt(vk_id),
      product_id: product_id,
      amount: product.price
    });

  if (orderError) {
    return res.status(500).json({ error: orderError.message });
  }

  return res.status(200).json({
    success: true,
    new_limit: newRemaining,
    product_name: product.name
  });
}
