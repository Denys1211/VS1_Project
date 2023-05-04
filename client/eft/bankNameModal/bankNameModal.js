import { ReactiveVar } from "meteor/reactive-var";
import { BankNameList } from "../../lib/global/bank-names";
import {BankNameService} from "../../lib/global/bank-names";
import { Template } from 'meteor/templating';
import './bankNameModal.html';
import moment from "moment";
import {SideBarService} from "../../js/sidebar-service";

let bankNameService = new BankNameService();
Template.bankNameModal.onCreated(function () {
  const templateObject = Template.instance();
  templateObject.eftOptionsList = new ReactiveVar([]);

  templateObject.tableheaderrecords = new ReactiveVar([]);

  templateObject.getDataTableList = function(data) {
    let dataList = [
        data.fields.BankCode || "",
        data.fields.BankName || "",
        data.fields.Active ? "" : "In-Active",
    ];
    return dataList;
  }

  let headerStructure = [
    {index: 0, label: "Account Name", class: "colBankName", width: "200", active: true, display: true},
    {index: 1, label: "Description", class: "colDescription", width: "300", active: true, display: true},
    {index: 2, label: "Status", class: "colStatus", width: "120", active: true, display: true},
  ];
  templateObject.tableheaderrecords.set(headerStructure);
});

Template.bankNameModal.onRendered(function () {
  let templateObject = Template.instance();
  $(document).on('click', '#tblBankName tbody tr', function (e) {
      var eftTable = $(this).closest("tr");
      let eftBankName = eftTable.find('.colBankName').text();
      let eftDescription = eftTable.find('.colDescription').text();
      // $('#eftOptionsModal').modal('toggle');
      $('#eftBankName').val(eftBankName);
      $('#eftDescription').val(eftDescription);
  });

  $(`#bankNameModal`).on('shown.bs.modal', function(){
    setTimeout(function() {
      $(`#tblBankName_filter .form-control-sm`).get(0).focus()
    }, 500);
  });
});


Template.bankNameModal.events({
  "click .btnCancelEftBankName": (e) => {
      $('#bankNameModal').modal('hide');
  },

});

Template.bankNameModal.helpers({
  tableheaderrecords: () => {
    return Template.instance().tableheaderrecords.get();
  },

  apiFunction:function() {
    let bankNameService = new BankNameService();
    return bankNameService.getBankNameList;
  },

  searchAPI: function() {
    return bankNameService.getBankNameList;
  },

  service: ()=>{
    let bankNameService = new BankNameService();
    return bankNameService;

  },

  datahandler: function () {
    let templateObject = Template.instance();
    return function(data) {
      let dataReturn =  templateObject.getDataTableList(data)
      return dataReturn
    }
  },

  exDataHandler: function() {
    let templateObject = Template.instance();
    return function(data) {
      let dataReturn =  templateObject.getDataTableList(data)
      return dataReturn
    }
  },

  apiParams: function() {
    return ["limitCount", "LimitFrom", "deleteFilter"];
  },
});
