# -*- coding: utf-8 -*-
from odoo import http

# class Combo(http.Controller):
#     @http.route('/combo/combo/', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/combo/combo/objects/', auth='public')
#     def list(self, **kw):
#         return http.request.render('combo.listing', {
#             'root': '/combo/combo',
#             'objects': http.request.env['combo.combo'].search([]),
#         })

#     @http.route('/combo/combo/objects/<model("combo.combo"):obj>/', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('combo.object', {
#             'object': obj
#         })