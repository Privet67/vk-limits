export default function handler(req, res) {
  const { password } = req.body;
  
  // Простой пароль (в реальном проекте лучше использовать环境变量)
  if (password === 'admin123') {
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ error: 'Неверный пароль' });
  }
}
