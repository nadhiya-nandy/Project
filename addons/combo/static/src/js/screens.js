//--->(Roja 25-1-18)
odoo.define('combo.screens', function (require) {
  "use strict";
  var screens = require('point_of_sale.screens');

  var models = require('point_of_sale.models');
  var db = require('point_of_sale.DB');
  var chrome = require('point_of_sale.chrome');
  var rpc = require('web.rpc');
  var core = require('web.core');
  var utils = require('web.utils');
  var round_pr = utils.round_precision;
  var _t = core._t;

  var QWeb = core.qweb;
  var total = 0;
  var i = 1;
  var sunmi = navigator.javaEnabled();

  screens.ProductScreenWidget.include({


    click_product: function (product) {
      var id;
      var self = this;
      console.log("Click product");
      var total_combo_price = product.list_price;
      if (navigator.userAgent == "my-user-agent") {
        $('.product-screen').find('.leftpane').css({
          "visibility": "visible",
          "opacity": "1"
        });
        $('.product-screen').find('.rightpane').css({
          "visibility": "hidden",
          "opacity": "0"
        });
        $('.pos-switchbuttons').find('.switchorder').css({
          "border-top": "0.1em solid #d3d3d3"
        });
        $('.pos-switchbuttons').find('.switchpay').css({
          "border-top": "0.1em solid #6ec89b"
        });
      }
      if (product.to_weight && this.pos.config.iface_electronic_scale) {

        this.gui.show_screen('scale', {
          product: product
        });
      } else {
        if (product.is_combo == true) {
          var id;
          var all_taxes;
          var remaining_amount = product.list_price;
          var dic = [];
          var com_id = [];
          var len = product.product_combo_ids.length;
          for (var i = 0; i < len; i++) {
            var combo_id = product.product_combo_ids[i];
            var records = self.pos.db.get_combo_product_by_id(combo_id);
            if (records) {
              var product_taxes = [];
              var product_price = 0.0;
              id = records.product_id[0];
              var com_product = self.pos.db.get_product_by_id(id);
              com_id.push(com_product);
              if (records.product_type == 'fixed') {
                if (com_product.taxes_id) {
                  var taxes_ids = com_product.taxes_id;
                  var taxes = self.pos.taxes;
                  _(taxes_ids).each(function (el) {
                    product_taxes.push(_.detect(taxes, function (t) {
                      return t.id === el;
                    }));
                  });
                }
                all_taxes = self.compute_all(product_taxes, com_product.list_price, records.quantity, self.pos.currency.rounding);
                product_price = all_taxes.total_included;
                remaining_amount -= product_price;
                dic.push({
                  'quantity': records.quantity,
                  'sequence': records.sequence
                });
              } else if (records.product_type == 'variable') {
                dic.push({
                  'display_price': Math.abs(remaining_amount),
                  'sequence': records.sequence
                })
              }


            }
          }
          var dict = dic && dic[0] || {}
          if (dic[1] != undefined) {
            var dict1 = dic && dic[1] || {}
            self.pos.get_order().add_product(com_id[1], dict1);
          }
          self.pos.get_order().add_product(com_id[0], dict);


        } else {
          self.pos.get_order().add_product(product);
        }
      }
    },
    // TAX method:
    compute_all: function (taxes, price_unit, quantity, currency_rounding) {
      var self = this;
      var list_taxes = [];
      var total_excluded = round_pr(price_unit * quantity, currency_rounding);
      var total_included = total_excluded;
      var base = total_excluded;
      var currency_rounding_bak = currency_rounding;
      if (self.pos.company.tax_calculation_rounding_method == "round_globally") {
        currency_rounding = currency_rounding * 0.00001;
      }
      _(taxes).each(function (tax) {
        if (tax.amount_type === 'group') {
          var ret = self.compute_all(tax.children_tax_ids, price_unit, quantity, currency_rounding);
          total_excluded = ret.total_excluded;
          base = ret.total_excluded;
          total_included = ret.total_included;
          list_taxes = list_taxes.concat(ret.taxes);
        } else {
          var tax_amount = self._compute_all(tax, base, quantity);
          tax_amount = round_pr(tax_amount, currency_rounding);
          if (tax_amount) {
            if (tax.price_include) {
              total_excluded -= tax_amount;
              base -= tax_amount;
            } else {
              total_included += tax_amount;
            }
            if (tax.include_base_amount) {
              base += tax_amount;
            }
            var data = {
              id: tax.id,
              amount: tax_amount,
              name: tax.name,
            };
            list_taxes.push(data);
          }
        }
      });
      return {
        taxes: list_taxes,

        total_excluded: round_pr(total_excluded, currency_rounding_bak),
        total_included: round_pr(total_included, currency_rounding_bak)
      };
    },
    _compute_all: function (tax, base_amount, quantity) {
      if (tax.amount_type === 'fixed') {
        var sign_base_amount = base_amount >= 0 ? 1 : -1;
        return (Math.abs(tax.amount) * sign_base_amount) * quantity;
      }
      if ((tax.amount_type === 'percent' && !tax.price_include) || (tax.amount_type === 'division' && tax.price_include)) {
        return base_amount * tax.amount / 100;
      }
      if (tax.amount_type === 'percent' && tax.price_include) {
        return base_amount - (base_amount / (1 + tax.amount / 100));
      }
      if (tax.amount_type === 'division' && !tax.price_include) {
        return base_amount / (1 - tax.amount / 100) - base_amount;
      }
      return false;
    },


  });

  screens.OrderWidget.include({

    init: function (parent, options) {
      var self = this;
      this._super(parent, options);

      this.numpad_state = options.numpad_state;
      this.numpad_state.reset();
      this.numpad_state.bind('set_value', this.set_value, this);

      this.pos.bind('change:selectedOrder', this.change_selected_order, this);

      this.line_click_handler = function (event) {
        self.click_line(this.orderline, event);
      };

      var cnt = $('.pos-switchbuttons').find('.count').val();
      //console.log("true:"+cnt);

      if (this.pos.get_order()) {
        this.bind_order_events();
      }

    },

    set_value: function (val) {
      var order = this.pos.get_order();
      if (order.get_selected_orderline()) {
        var mode = this.numpad_state.get('mode');
        if (mode === 'quantity') {
          order.get_selected_orderline().set_quantity(val);
        } else if (mode === 'discount') {
          order.get_selected_orderline().set_discount(val);
        } else if (mode === 'price') {
          order.get_selected_orderline().set_unit_price(val);
        } else if (mode === 'amt') {
          order.get_selected_orderline().set_display_price(val);
        }
      }
    },
    orderline_remove: function (line) {
      this.remove_orderline(line);

      var cnt = $(".orderlines > li").size();
      $('.pos-switchbuttons').find('.count').text(Number(cnt));
      $('.pos-switchbuttons').find('.count').css("visibility", "visible");

      this.numpad_state.reset();
      this.update_summary();
    },
  });

  screens.NumpadWidget.include({


    clickDeleteLastChar: function () {

      return this.state.deleteLastChar();
    },


  });

  db.include({
    init: function (options) {
      this._super.apply(this, arguments);

      this.combo_product_by_id = {};
    },
    get_combo_product_by_id: function (id) {
      return this.combo_product_by_id[id];
    },
  });

});
