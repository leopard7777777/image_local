# -*- coding: utf-8 -*-

{
    "name" : "Local Image",
    "version" : "1.0",
    "author" : "King",
    "category": 'Image',
    'complexity': "easy",
    'depends': ['web'],
    "description": """
        This module provides the functionality to store multiple images for one record.
        All images store in server directory. so database size does not increase.
    """,
    'data': [
#         'image_view.xml',
        'views/image_file_views.xml',
    ],
    'qweb': ['static/src/xml/*.xml'],
    'installable': True,
    'auto_install': False,
    'application': True,
}

# vim:expandtab:smartindent:tabstop=4:softtabstop=4:shiftwidth=4:
