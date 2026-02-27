import os
from http.server import HTTPServer, SimpleHTTPRequestHandler

def run(server_class=HTTPServer, handler_class=SimpleHTTPRequestHandler):
    port = int(os.environ.get('PORT', 8000))
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print(f"Starting simple HTTP server on port {port}...")
    httpd.serve_forever()

if __name__ == '__main__':
    run()
