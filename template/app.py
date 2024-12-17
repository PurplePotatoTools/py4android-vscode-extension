
from http.server import HTTPServer, SimpleHTTPRequestHandler
import sys
import datetime
import os
import py4a

py4a.check_preinstalled()


class HttpHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        version = sys.version
        current_datetime = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(b'<h1>Hello, world</h1> <br> <h2>Python version: ' + version.encode(
        ) + b'</h2> <br> <h2>Current date and time: ' + current_datetime.encode() + b'</h2>')
        return


if __name__ == '__main__':
    port = os.environ.get('PY4A_PORT')
    httpd = HTTPServer(('127.0.0.1', int(port)), HttpHandler)
    httpd.serve_forever()
