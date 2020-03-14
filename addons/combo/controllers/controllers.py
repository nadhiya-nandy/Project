# -*- coding: utf-8 -*-
from odoo import http

# class ComboProduct(http.Controller):
#     @http.route('/combo_product/combo_product/', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/combo_product/combo_product/objects/', auth='public')
#     def list(self, **kw):
#         return http.request.render('combo_product.listing', {
#             'root': '/combo_product/combo_product',
#             'objects': http.request.env['combo_product.combo_product'].search([]),
#         })

#     @http.route('/combo_product/combo_product/objects/<model("combo_product.combo_product"):obj>/', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('combo_product.object', {
#             'object': obj
#         })


