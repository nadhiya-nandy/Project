//--->(Roja 25-1-18)
odoo.define('combo.models', function (require) {
  "use strict";
  var rpc = require('web.rpc');
  var models = require('point_of_sale.models');
  var _super_posmodel = models.PosModel.prototype;
  var _super_model = models.Orderline.prototype;
  var _super_ordermodel = models.Order.prototype;
  var db = require('point_of_sale.DB');
  var utils = require('web.utils');
  var field_utils = require('web.field_utils');
  var round_pr = utils.round_precision;
  var round_di = utils.round_decimals;
  var i = 1;
  models.PosModel = models.PosModel.extend({
    // Added fields in model which are created backend
    initialize: function (session, attributes) {
      this.combo_product_by_id = {};

      return _super_posmodel.initialize.call(this, session, attributes);
    },
  });
  var combo_product_by_id = {};

  models.load_fields("product.template", ['product_combo_ids', 'is_combo', 'l10n_in_hsn_code', 'fav', 'remove_trailing_zeros', 'product_classification_id']);
  models.load_fields("product.product", ['product_combo_ids', 'is_combo', 'l10n_in_hsn_code', 'fav', 'remove_trailing_zeros', 'product_classification_id']);
  models.load_models([{
    model: 'product.combo',
    fields: ['sequence', 'product_id', 'quantity', 'product_type', 'combo_product_id'],
    domain: null,
    context: {},
    loaded: function (self, combo_product) {
      self.combo_product = combo_product;

      for (var i = 0, len = combo_product.length; i < len; i++) {

        self.db.combo_product_by_id[combo_product[i].id] = combo_product[i];

      }

    }
  }]);
  models.load_models([{
    model: 'product.uom',
    fields: [],
    domain: null,
    context: function (self) {
      return {
        active_test: false
      };
    },
    loaded: function (self, units) {
      self.units = units;
      var units_by_id = {};
      for (var i = 0, len = units.length; i < len; i++) {
        units_by_id[units[i].id] = units[i];
        units[i].groupable = (units[i].groupable_in_pos);
        units[i].is_unit = (units[i].id === 1);
      }
      self.units_by_id = units_by_id;
    }
  }]);


  models.Order = models.Order.extend({
    initialize: function (attributes, options) {
      _super_ordermodel.initialize.call(this, attributes, options);
      this.name = this.uid;
      this.pos_session_id = this.pos.pos_session.id;
      this.pos_config_id = this.pos.pos_session.config_id;
    },

    get_tax_details: function () {
      var details = {};
      var fulldetails = [];

      this.orderlines.each(function (line) {
        var ldetails = line.get_tax_details();
        for (var id in ldetails) {
          if (ldetails.hasOwnProperty(id)) {
            details[id] = (details[id] || 0) + ldetails[id];
          }
        }
      });

      for (var id in details) {
        if (details.hasOwnProperty(id)) {
          fulldetails.push({
            amount: details[id],
            tax: this.pos.taxes_by_id[id],
            name: this.pos.taxes_by_id[id].name,
            description: this.pos.taxes_by_id[id].description
          });
        }
      }

      return fulldetails;
    },


    add_product: function (product, options) {

      if (this._printed) {
        this.destroy();
        return this.pos.get_order().add_product(product, options);
      }
      this.assert_editable();
      options = options || {};
      var attr = JSON.parse(JSON.stringify(product));
      attr.pos = this.pos;
      attr.order = this;
      var line = new models.Orderline({}, {
        pos: this.pos,
        order: this,
        product: product
      });
      if (options.price !== undefined) {
        line.set_unit_price(options.price);
      }
      if (options.display_price !== undefined) {
        line.set_display_price(options.display_price);
      }

      if (options.quantity !== undefined) {
        line.set_quantity(options.quantity);
      }

      if (options.discount !== undefined) {
        line.set_discount(options.discount);
      }

      if (options.extras !== undefined) {
        for (var prop in options.extras) {
          line[prop] = options.extras[prop];
        }
      }

      if (options.sequence !== undefined) {
        line.set_sequence(options.sequence);
      }


      // check orderlines and merge
      var orderline = this.get_orderlines();
      var flag = 0;

      if (orderline.length !== 0) {
        for (var i = 0; i < orderline.length; i++) {
          if (orderline[i].can_be_merged_with(line) && options.merge !== false) {
            flag = 0;
            orderline[i].merge(line);
            this.select_orderline(orderline[i]);
            break;
          } else {
            flag = 1;
          }
        }
      } else {
        this.orderlines.add(line);
        this.select_orderline(this.get_last_orderline());
      }
      if (flag == 1) {
        this.orderlines.add(line);
        this.select_orderline(this.get_last_orderline());

      }

      if (line.has_product_lot) {
        this.display_lot_popup();
      }
      var cnt = $(".orderlines > li").size();
      //console.log("count:"+(Number(cnt)+1));

      $('.pos-switchbuttons').find('.count').text(Number(cnt));
      $('.pos-switchbuttons').find('.count').css("visibility", "visible");
    },
    add_orderline: function (line) {
      this.assert_editable();
      if (line.order) {
        line.order.remove_orderline(line);
      }
      line.order = this;


      this.orderlines.add(line);

      this.select_orderline(this.get_last_orderline());
    },

  });

  models.Orderline = models.Orderline.extend({

    initialize: function (session, attributes) {
      this.sequence = 10;
      this.pos = attributes.pos;
      this.pos_config_id = this.pos.pos_session.config_id;
      var tn = [];
      return _super_model.initialize.call(this, session, attributes);
    },
    get_sequence: function () {
      return this.sequence;
    },
    export_as_JSON: function () {
      var orderline_data = _super_model.export_as_JSON.call(this);
      $.extend(orderline_data, {
        'sequence': this.sequence
      })
      return orderline_data
    },
    export_for_printing: function () {
      var orderline_data = _super_model.export_for_printing.call(this);
      var new_val = {
        'sequence': this.get_sequence(),
        'get_quantity_str_with_unit': this.get_quantity_str_with_unit(),
        'hsn_code': this.get_product().hsn_code,
      }
      $.extend(orderline_data, new_val);
      return orderline_data
    },

    set_display_price: function (price) {
      this.order.assert_editable();
      var quantity = 1.0
      quantity = price / this.price;
      this.set_quantity(quantity);
      this.trigger('change', this);
    },


    set_sequence: function (sequence) {
      return this.sequence = sequence;
    },
  });

});
