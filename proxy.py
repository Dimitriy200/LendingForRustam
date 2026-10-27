import http.server
import urllib.request
import urllib.error
import logging


class ProxyHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path.startswith('/api/'):
            # Перенаправляем на бэкенд
            url = f"http://127.0.0.1:3000{self.path}"
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            
            try:
                req = urllib.request.Request(url, data=body, method='POST')
                req.add_header('Content-Type', 'application/json')
                
                with urllib.request.urlopen(req) as response:
                    result = response.read()
                    self.send_response(response.status)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(result)
            except urllib.error.HTTPError as e:
                self.send_response(e.code)
                self.end_headers()
        else:
            super().do_POST()

if __name__ == '__main__':
    import os
    os.chdir('public')
    server = http.server.HTTPServer(('127.0.0.1', 8080), ProxyHandler)
    logging.info("Прокси запущен на http://127.0.0.1:8080")
    server.serve_forever()