import tornado.httpserver
import tornado.ioloop
import tornado.web


class HSTSCookie(tornado.web.RequestHandler):
    def get(self):
        self.set_header('Access-Control-Allow-Origin', '*')
        if self.request.protocol == 'https':
            self.set_header('Strict-Transport-Security', 'max-age=31536000')
        self.write(self.request.protocol)
        self.write('<br>')
        self.write(self.request.host)


class Home(tornado.web.RequestHandler):
    def get(self):
        self.set_header('Access-Control-Allow-Origin', '*')
        self.write('<html><head><script src="hsts.js"></script></head><body></body></html>')

class HSTSScript(tornado.web.RequestHandler):
    def get(self):
        with open('hsts.js', 'r') as f:
            script = f.read()
            script = script.replace('[HOSTNAME]', 'bugben.com')
            self.write(script)




import binascii

def byte_to_binary(n):
    return ''.join(str((n & (1 << i)) and 1) for i in reversed(range(8)))

def hex_to_binary(h):
    return ''.join(byte_to_binary(ord(b)) for b in binascii.unhexlify(h))

print hex_to_binary('000f')


application = tornado.web.Application([
    (r'/', Home),
    (r'/h.gif', HSTSCookie),
    (r'/hsts.js', HSTSScript),
])

if __name__ == '__main__':
    https_server = tornado.httpserver.HTTPServer(application, ssl_options={
        "certfile": "keys/bugben.com.key.crt",
        "keyfile": "keys/bugben.com.key",
    })
    http_server = tornado.httpserver.HTTPServer(application)
    https_server.listen(443)
    http_server.listen(80)
    tornado.ioloop.IOLoop.instance().start()
