import psycopg2
import pytz
import logging
import threading

from odoo import models, fields, api, tools
from odoo.tools.profiler import profile
from odoo.tools import float_is_zero
from odoo.exceptions import UserError
from odoo.http import request
from odoo.addons import decimal_precision as dp

_logger = logging.getLogger(__name__)
class InheritPosOrders(models.Model):
    _name='pos.order.old'
    _inherit='pos.order'
    
    lines = fields.One2many('pos.order.line.old', 'order_id', string='Order Lines', states={'draft': [('readonly', False)]}, readonly=True, copy=True)
    
    
class InheritPosOrderLines(models.Model):
    _name='pos.order.line.old'
    _inherit='pos.order.line'
    
    order_id = fields.Many2one('pos.order.old', string='Order Ref', ondelete='cascade')
