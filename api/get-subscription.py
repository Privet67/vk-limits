from http.server import BaseHTTPRequestHandler
import json
import os
from urllib.parse import urlparse, parse_qs
from supabase import create_client

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Подключаемся к Supabase
        supabase = create_client(
            os.environ.get('SUPABASE_URL'),
            os.environ.get('SUPABASE_KEY')
        )
        
        # Получаем vk_id из URL
        query = parse_qs(urlparse(self.path).query)
        vk_id = query.get('vk_id', [None])[0]
        
        if not vk_id:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b'{"error": "vk_id required"}')
            return
        
        # Ищем подписку
        result = supabase.table('subscriptions')\
            .select('*')\
            .eq('vk_id', vk_id)\
            .execute()
        
        # Если подписки нет — создаём пустую
        if not result.data:
            supabase.table('subscriptions').insert({
                'vk_id': int(vk_id),
                'total_limit': 0,
                'remaining_limit': 0
            }).execute()
            result = supabase.table('subscriptions')\
                .select('*')\
                .eq('vk_id', vk_id)\
                .execute()
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(result.data[0]).encode())
