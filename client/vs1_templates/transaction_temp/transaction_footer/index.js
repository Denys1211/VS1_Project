import { Template } from 'meteor/templating';
import "./template_footer_attachment_button.html"
import "./template_footer_cancel_button.html"
import "./template_footer_hold_button.html"
import "./template_footer_print_button.html"
import "./template_footer_process_button.html"
import "./template_footer_remove_button.html"
import "./template_footer_save_button.html"
import "./transaction_footer.html"

Template.transaction_footer.onCreated( function () {

});
Template.transaction_footer.onRendered( function () {});
// Template.transaction_footer.helpers({

// })
Template.transaction_footer.events({
  "click #open_print_confirm": function (event) {
    playPrintAudio();
    setTimeout(async function() {
      $('#printModal').modal('show');
    }, delayTimeAfterSound);
  },
  "click #btn_Attachment": function (event) {
    playPrintAudio();
    setTimeout(async function() {
      if($('#myModalAttachment_fromtransactionfooter').length > 0) {
        $('#myModalAttachment_fromtransactionfooter').modal('show');
      } else {
        $('#myModalAttachment').modal('show')
      }
    }, delayTimeAfterSound);
  },
});
