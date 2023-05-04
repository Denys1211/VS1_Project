import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { ReactiveVar } from 'meteor/reactive-var';
import { UtilityService } from "../utility-service";
import '../lib/global/erp-objects';
import 'jquery-ui-dist/external/jquery/jquery';
import 'jquery-ui-dist/jquery-ui';
import 'jQuery.print/jQuery.print.js';
import 'jquery-editable-select';
import { SideBarService } from '../js/sidebar-service';
import '../lib/global/indexdbstorage.js';
import { Template } from 'meteor/templating';
import './categorylistpop.html';
import moment from "moment";

let sideBarService = new SideBarService();
let utilityService = new UtilityService();
Template.categorylistpop.onCreated(() => {
    const templateObject = Template.instance();

    templateObject.tableheaderrecords = new ReactiveVar([]);
    templateObject.getDataTableList = function(data) {
        console.log(data);
        var dataList = [
            data.Id,
            data.CategoryName,
            "",
            "",
            data.CategoryDesc,
            "",
            "",
        ];
        return dataList;
    }

    let headerStructure = [
        { index: 0, label: 'Account ID', class: 'colAccountID', active: false, display: true, width: "10" },
        { index: 1, label: 'Category', class: 'colCategory', active: true, display: true, width: "110" },
        { index: 2, label: 'Account No', class: 'colAccountNo', active: true, display: true, width: "110" },
        { index: 3, label: 'Account Name', class: 'colAccountName', active: true, display: true, width: "120" },
        { index: 4, label: 'Description', class: 'colDescription', active: true, display: true, width: "300" },
        { index: 5, label: 'Tax Rate', class: 'colTaxRate', active: true, display: true, width: "110" },
        { index: 6, label: 'Status', class: 'colStatus', active: true, display: true, width: "120" },
    ];

    templateObject.tableheaderrecords.set(headerStructure);
});

Template.categorylistpop.onRendered(function() {
    const templateObject = Template.instance();
    let prefix = templateObject.data.custid ? templateObject.data.custid : '';
    $(`#categoryListModal${prefix}`).on('shown.bs.modal', function(){
        setTimeout(function() {
            $(`#tblcategorylistpop${prefix}_filter .form-control-sm`).get(0).focus()

        }, 500);
    });
});

Template.categorylistpop.helpers({
    salesCloudPreferenceRec: () => {
        return CloudPreference.findOne({
            userid: localStorage.getItem('mycloudLogonID'),
            PrefName: 'tblCategoryListPop'
        });
    },
    tableheaderrecords: () => {
        return Template.instance().tableheaderrecords.get();
    },

    apiFunction:function() {
        let sideBarService = new SideBarService();
        // Alex: add for bank rec {
        return sideBarService.getReceiptCategory;
    },

    searchAPI: function() {
        return sideBarService.getReceiptCategoryByName;
    },

    service: ()=>{
        let sideBarService = new SideBarService();
        return sideBarService;

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
        return ['limitCount', 'limitFrom', 'deleteFilter'];
    },
    tablename: () => {
        let templateObject = Template.instance();
        let accCustID = templateObject.data.custid ? templateObject.data.custid : '';
        return 'tblcategorylistpop'+ accCustID;
      },
});

Template.categorylistpop.events({
});

Template.registerHelper('equals', function(a, b) {
    return a === b;
});
