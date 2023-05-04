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
import './fieldlistpop.html';
import moment from "moment";

let sideBarService = new SideBarService();
let utilityService = new UtilityService();
Template.fieldlistpop.onCreated(() => {
    const templateObject = Template.instance();

    templateObject.tableheaderrecords = new ReactiveVar([]);
    templateObject.getDataTableList = function(data) {
        console.log(data);
        var dataList = [
            data[0],
            data[1],
            data[2],
        ];
        return dataList;
    }

    let headerStructure = [
        { index: 0, label: 'Field Name', class: 'colFieldName', active: true, display: true, width: "110" },
        { index: 1, label: 'Description', class: 'colDescription', active: true, display: true, width: "300" },
        { index: 2, label: 'Status', class: 'colStatus', active: true, display: true, width: "120" },
    ];

    templateObject.tableheaderrecords.set(headerStructure);
});

Template.fieldlistpop.onRendered(function() {

});

Template.fieldlistpop.helpers({
    salesCloudPreferenceRec: () => {
        return CloudPreference.findOne({
            userid: localStorage.getItem('mycloudLogonID'),
            PrefName: 'tblFields'
        });
    },
    tableheaderrecords: () => {
        return Template.instance().tableheaderrecords.get();
    },

    apiFunction:function() {
        let sideBarService = new SideBarService();
        const templateObject = Template.instance();
        return sideBarService.getFieldList;
    },

    searchAPI: function() {
        return sideBarService.getFieldList;
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
        return 'tblFields'+ accCustID;
    },
});

Template.fieldlistpop.events({
});

Template.registerHelper('equals', function(a, b) {
    return a === b;
});
