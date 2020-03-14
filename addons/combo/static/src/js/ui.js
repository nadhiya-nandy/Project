odoo.define('combo.ui', function (require) {
  "use strict";
  var Widget = require('web.Widget');
  var menu = require('web.Menu');
  var core = require('web.core');
  var session = require('web.session');
  var BasicView = require('web.BasicView');
  var rpc = require('web.rpc');

  menu.include({
    init: function () {
      this._super.apply(this, arguments);
      this.is_bound = $.Deferred();
      this.data = {
        data: {
          children: []
        }
      };
      core.bus.on('change_menu_section', this, this.on_change_top_menu);
      this.show();
    },
    show: function () {
      var clicked = true;
      $('.navbar-collapse').find('#menu_more_container').css('display', 'none');
      $('.o_sub_menu').find('.fa.fa-angle-double-right').on('click', function () {

        if (clicked) {
          $('.o_sub_menu').css('left', '0');
          clicked = false;
        } else {
          $('.o_sub_menu').css('left', '-50%');
          clicked = true;
        }
      });
    },
  });
});
