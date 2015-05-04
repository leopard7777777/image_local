# -*- coding: utf-8 -*-

import StringIO
import os
import time
import base64
import md5

import simplejson

from openerp import http
import openerp
from openerp.addons.web.controllers.main import Binary


class image_file(Binary):

    @http.route('/web/images/get', type='http', auth="user")
    def get(self, file_name):
        # 防御本地包含
        file_name = file_name.replace("../", "")
        addons_path = http.addons_manifest['web']['addons_path'] + "/web/static/src/img/storage/" + file_name
        try:
            file = open(addons_path, 'rb')
            content = file.read()
        except:
            pass
        finally:
            file.close()
        return content
    
    @http.route('/web/images/upload', type='http', auth="user")
    def upload(self, callback, ufile):
        # 触发对应widget中的on_file_uploaded_and_valid
        out = """<script language="javascript" type="text/javascript">
                    var win = window.top.window;
                    win.jQuery(win).trigger(%s, %s);
                </script>"""
        try:
            ext = os.path.splitext(ufile.filename)[1]
            data = ufile.read()
#             args = [len(data), ufile.filename,
#                     ufile.content_type, base64.b64encode(data)]
            if data:
                addons_path = http.addons_manifest['web']['addons_path'] + "/web/static/src/img/storage/"
                if not os.path.isdir(addons_path):
                    os.mkdir(addons_path)
                buff = StringIO.StringIO()
                buff.write(data)
                buff.seek(0)
                read = buff.read()
                file_name = md5.new(read).hexdigest()
                file_name += ext
                addons_path += file_name
    #             file_name = "/web/static/src/img/image_multi/" + file_name
                file = open(addons_path, 'wb')
                file.write(read)
                file.close()
                args = [len(data), ufile.filename, ufile.content_type, file_name]
            else:
                args = []
        except Exception, e:
            args = [False, e.message]
        return out % (simplejson.dumps(callback), simplejson.dumps(args))
    
