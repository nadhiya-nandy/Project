# -*- coding: utf-8 -*-

from odoo import models, fields, api

#--------(Roja 25-1-18)--------------
class ProductCombo(models.Model):
    _name = 'product.combo'
    _description = 'Product Combo'
    _order = 'product_type'

    combo_product_id = fields.Many2one('product.template', string="Product", required=True)

    product_id = fields.Many2one('product.template', string="Product", required=True)
    quantity = fields.Float(string="Quantity", default=1.0)
    product_type = fields.Selection([('variable', 'Variable') ,('fixed', 'Fixed'),], string="Type",
                                    default="variable", required=True)
    sequence = fields.Integer(string='Sequence', default=5)

class ProductProduct(models.Model):
    _inherit = 'product.template'
    fav=fields.Float()
    is_combo = fields.Boolean(string="Is Combo Product")
    remove_trailing_zeros = fields.Boolean(string="Remove trailing zeros in reports")
    product_combo_ids = fields.One2many('product.combo', 'combo_product_id', string="Combo Product")
    @api.model
    def products_sort(self,product_id):
        product=self.env['product.template'].search([('id' , '=' , product_id)])
        product.update({'fav':product.fav+1})
        return product.fav

class PosOrderLine(models.Model):
    _inherit = "pos.order.line"

    sequence = fields.Integer(string='Sequence')

class PosOrderLine(models.Model):
    _inherit = "pos.order.line"

    sequence = fields.Integer(string='Sequence')


class ResCompany(models.Model):
    _inherit = 'res.company'

    tin = fields.Char("TIN")
