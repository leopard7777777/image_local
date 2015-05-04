# -*- coding: utf-8 -*-

from openerp.osv import fields, osv

class image_local(osv.osv):
    _name = "image.local"

    _columns = {
        'uri': fields.text("Image URI"),
        'path':fields.text('Store Path'),
    }

