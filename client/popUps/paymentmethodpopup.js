import {
    TaxRateService
} from "../settings/settings-service";
import {
    ReactiveVar
} from 'meteor/reactive-var';
import {
    OrganisationService
} from '../js/organisation-service';
import {
    SideBarService
} from '../js/sidebar-service';
import '../lib/global/indexdbstorage.js';
import { Template } from 'meteor/templating';
import './paymentmethodpopup.html';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

let sideBarService = new SideBarService();
let organisationService = new OrganisationService();
Template.paymentmethodpop.onCreated(function() {
    const templateObject = Template.instance();
    templateObject.datatablerecords = new ReactiveVar([]);
    templateObject.tableheaderrecords = new ReactiveVar([]);

    templateObject.deptrecords = new ReactiveVar();

    templateObject.includeCreditCard = new ReactiveVar();
    templateObject.includeCreditCard.set(false);

    templateObject.includeAccountID = new ReactiveVar();
    templateObject.includeAccountID.set(false);

    templateObject.accountID = new ReactiveVar();
    templateObject.tablename = new ReactiveVar();

    templateObject.getDataTableList = function(data) {
        let linestatus = '';
        if (data.fields.Active == true) {
            linestatus = "";
        } else if (data.fields.Active == false) {
            linestatus = "In-Active";
        };
        let tdIsCreditCard = data.fields.IsCreditCard;

        if (data.fields.IsCreditCard == true) {
            tdIsCreditCard = '<div class="custom-control custom-switch chkBox text-center"><input class="custom-control-input chkBox" type="checkbox" id="iscreditcard-' + data.PayMethodID + '" checked><label class="custom-control-label chkBox" for="iscreditcard-' + data.PayMethodID + '"></label></div>';
        } else {
            tdIsCreditCard = '<div class="custom-control custom-switch chkBox text-center"><input class="custom-control-input chkBox" type="checkbox" id="iscreditcard-' + data.PayMethodID + '"><label class="custom-control-label chkBox" for="iscreditcard-' + data.PayMethodID + '"></label></div>';
        };
        var dataList = [
            data.fields.ID || "",
            data.fields.PaymentMethodName || "",
            tdIsCreditCard,
            linestatus,
        ];
        return dataList;
    }

    let headerStructure = [
        { index: 0, label: '#ID', class: 'colPayMethodID', active: false, display: true, width: "50" },
        { index: 1, label: 'Payment Method Name', class: 'colNamePopUp', active: true, display: true, width: "150" },
        { index: 2, label: 'Is Credit Card', class: 'colCreditCardPopUp', active: true, display: true, width: "100" },
        { index: 3, label: 'Status', class: 'colStatus', active: false, display: true, width: "60" },
    ];
    templateObject.tableheaderrecords.set(headerStructure);
});

Template.paymentmethodpop.onRendered(function() {
    const templateObject = Template.instance();
    let prefix = templateObject.data.custid ? templateObject.data.custid : '';
    $(`#PaymentListModal${prefix}`).on('shown.bs.modal', function(){
        setTimeout(function() {
            $(`#tblPaymentMethod${prefix}_filter .form-control-sm`).get(0).focus()
        }, 500);
    });
});


Template.paymentmethodpop.events({
    'click #btnNewInvoice': function(event) {
        // FlowRouter.go('/invoicecard');
    },
    'click .btnAddNewPaymentMethod': function (event) {
          $('#isformcreditcard').prop('checked', false);
          $('#edtPaymentMethodName').val('');
        setTimeout(function () {
          $('#edtPaymentMethodName').focus();
        }, 1000);
    },
    'click .feeOnTopInput': function(event) {
        if ($(event.target).is(':checked')) {
            $('.feeInPriceInput').attr('checked', false);
        }
    },
    'click .feeInPriceInput': function(event) {
        if ($(event.target).is(':checked')) {
            $('.feeOnTopInput').attr('checked', false);
        }
    },

    'click .chkDatatable': function(event) {
        var columns = $('#'+currenttablename+' th');
        let columnDataValue = $(event.target).closest("div").find(".divcolumn").text();

        $.each(columns, function(i, v) {
            let className = v.classList;
            let replaceClass = className[1];

            if (v.innerText == columnDataValue) {
                if ($(event.target).is(':checked')) {
                    $("." + replaceClass + "").css('display', 'table-cell');
                    $("." + replaceClass + "").css('padding', '.75rem');
                    $("." + replaceClass + "").css('vertical-align', 'top');
                } else {
                    $("." + replaceClass + "").css('display', 'none');
                }
            }
        });
    },
    'click .resetTable': function(event) {
        var getcurrentCloudDetails = CloudUser.findOne({
            _id: localStorage.getItem('mycloudLogonID'),
            clouddatabaseID: localStorage.getItem('mycloudLogonDBID')
        });
        if (getcurrentCloudDetails) {
            if (getcurrentCloudDetails._id.length > 0) {
                var clientID = getcurrentCloudDetails._id;
                var clientUsername = getcurrentCloudDetails.cloudUsername;
                var clientEmail = getcurrentCloudDetails.cloudEmail;
                var checkPrefDetails = CloudPreference.findOne({
                    userid: clientID,
                    PrefName: 'paymentmethodList'
                });
                if (checkPrefDetails) {
                    CloudPreference.remove({
                        _id: checkPrefDetails._id
                    }, function(err, idTag) {
                        if (err) {

                        } else {
                            Meteor._reload.reload();
                        }
                    });

                }
            }
        }
    },
    'click .saveTable': function(event) {
        let lineItems = [];
        $('.columnSettings').each(function(index) {
            var $tblrow = $(this);
            var colTitle = $tblrow.find(".divcolumn").text() || '';
            var colWidth = $tblrow.find(".custom-range").val() || 0;
            var colthClass = $tblrow.find(".divcolumn").attr("valueupdate") || '';
            var colHidden = false;
            if ($tblrow.find(".custom-control-input").is(':checked')) {
                colHidden = false;
            } else {
                colHidden = true;
            }
            let lineItemObj = {
                index: index,
                label: colTitle,
                hidden: colHidden,
                width: colWidth,
                thclass: colthClass
            }

            lineItems.push(lineItemObj);
        });

        var getcurrentCloudDetails = CloudUser.findOne({
            _id: localStorage.getItem('mycloudLogonID'),
            clouddatabaseID: localStorage.getItem('mycloudLogonDBID')
        });
        if (getcurrentCloudDetails) {
            if (getcurrentCloudDetails._id.length > 0) {
                var clientID = getcurrentCloudDetails._id;
                var clientUsername = getcurrentCloudDetails.cloudUsername;
                var clientEmail = getcurrentCloudDetails.cloudEmail;
                var checkPrefDetails = CloudPreference.findOne({
                    userid: clientID,
                    PrefName: 'paymentmethodList'
                });
                if (checkPrefDetails) {
                    CloudPreference.update({
                        _id: checkPrefDetails._id
                    }, {
                        $set: {
                            userid: clientID,
                            username: clientUsername,
                            useremail: clientEmail,
                            PrefGroup: 'salesform',
                            PrefName: 'paymentmethodList',
                            published: true,
                            customFields: lineItems,
                            updatedAt: new Date()
                        }
                    }, function(err, idTag) {
                        if (err) {
                            $('#myModal2').modal('toggle');
                        } else {
                            $('#myModal2').modal('toggle');
                        }
                    });

                } else {
                    CloudPreference.insert({
                        userid: clientID,
                        username: clientUsername,
                        useremail: clientEmail,
                        PrefGroup: 'salesform',
                        PrefName: 'paymentmethodList',
                        published: true,
                        customFields: lineItems,
                        createdAt: new Date()
                    }, function(err, idTag) {
                        if (err) {
                            $('#myModal2').modal('toggle');
                        } else {
                            $('#myModal2').modal('toggle');

                        }
                    });
                }
            }
        }
        $('#myModal2').modal('toggle');
    },
    'blur .divcolumn': function(event) {
        let columData = $(event.target).text();
        let columnDatanIndex = $(event.target).closest("div.columnSettings").attr('id');
        let currenttablename = templateObject.tablename.get() || '';
        var datable = $('#'+currenttablename).DataTable();
        var title = datable.column(columnDatanIndex).header();
        $(title).html(columData);

    },
    'change .rngRange': function(event) {
        let range = $(event.target).val();
        $(event.target).closest("div.divColWidth").find(".spWidth").html(range + 'px');

        let columData = $(event.target).closest("div.divColWidth").find(".spWidth").attr("value");
        let columnDataValue = $(event.target).closest("div").prev().find(".divcolumn").text();
        let currenttablename = templateObject.tablename.get() || '';
        var datable = $('#'+currenttablename+' th');
        $.each(datable, function(i, v) {

            if (v.innerText == columnDataValue) {
                let className = v.className;
                let replaceClass = className.replace(/ /g, ".");
                $("." + replaceClass + "").css('width', range + 'px');

            }
        });

    },
    'click .btnOpenSettings': function(event) {
        let templateObject = Template.instance();
        let currenttablename = templateObject.tablename.get() || '';
        var columns = $('#'+currenttablename+' th');

        const tableHeaderList = [];
        let sTible = "";
        let sWidth = "";
        let sIndex = "";
        let sVisible = "";
        let columVisible = false;
        let sClass = "";
        $.each(columns, function(i, v) {
            if (v.hidden == false) {
                columVisible = true;
            }
            if ((v.className.includes("hiddenColumn"))) {
                columVisible = false;
            }
            sWidth = v.style.width.replace('px', "");

            let datatablerecordObj = {
                sTitle: v.innerText || '',
                sWidth: sWidth || '',
                sIndex: v.cellIndex || '',
                sVisible: columVisible || false,
                sClass: v.className || ''
            };
            tableHeaderList.push(datatablerecordObj);
        });
        templateObject.tableheaderrecords.set(tableHeaderList);
    },
    'click #exportbtn': function() {
        $('.fullScreenSpin').css('display', 'inline-block');
        let currenttablename = templateObject.tablename.get() || '';
        jQuery('#'+currenttablename+'_wrapper .dt-buttons .btntabletoexcel').click();
        $('.fullScreenSpin').css('display', 'none');

    },
    'click .btnRefresh': function() {
        $('.fullScreenSpin').css('display', 'inline-block');
        sideBarService.getPaymentMethodDataVS1().then(function(dataReload) {
            addVS1Data('TPaymentMethod', JSON.stringify(dataReload)).then(function(datareturn) {
                location.reload(true);
            }).catch(function(err) {
                location.reload(true);
            });
        }).catch(function(err) {
            location.reload(true);
        });
    },
    'click .btnRefreshPaymentMethod': function (event) {
        let templateObject = Template.instance();
        $('.fullScreenSpin').css('display', 'inline-block');
        const customerList = [];
        const clientList = [];
        let salesOrderTable;
        var splashArray = new Array();
        var splashArrayPaymentMethodList = new Array();
        const dataTableList = [];
        const tableHeaderList = [];
        let sideBarService = new SideBarService();
        let taxRateService = new TaxRateService();
        let currenttablename = templateObject.tablename.get() || '';
        let dataSearchName = $('#'+currenttablename+'_filter input').val();
        var currentLoc = FlowRouter.current().route.path;
        if (dataSearchName.replace(/\s/g, '') != '') {
            sideBarService.getPaymentMethodVS1ByName(dataSearchName).then(function (data) {
                let lineItems = [];
                let lineItemObj = {};
                if (data.tpaymentmethodvs1.length > 0) {
                  for (let i = 0; i < data.tpaymentmethodvs1.length; i++) {
                    let getIsCreditCard = '';
                    if(data.tpaymentmethodvs1[i].fields.IsCreditCard){
                      getIsCreditCard = '<div class="custom-control custom-checkbox chkBox"><input class="custom-control-input chkBox" type="checkbox" id="' + data.tpaymentmethodvs1[i].Id + '" checked><label class="custom-control-label chkBox"for="' + data.tpaymentmethodvs1[i].Id + '"></label></div>';
                    }else{
                      getIsCreditCard = '<div class="custom-control custom-checkbox chkBox"><input class="custom-control-input chkBox" type="checkbox" id="' + data.tpaymentmethodvs1[i].Id + '"><label class="custom-control-label chkBox"for="' + data.tpaymentmethodvs1[i].Id + '"></label></div>';
                    }
                    var dataList = [
                      data.tpaymentmethodvs1[i].fields.PaymentMethodName || '',
                      getIsCreditCard
                    ];
                splashArrayPaymentMethodList.push(dataList);
                  }

                    var datatable = $('#'+currenttablename).DataTable();
                    datatable.clear();
                    datatable.rows.add(splashArrayPaymentMethodList);
                    datatable.draw(false);

                    $('.fullScreenSpin').css('display', 'none');
                } else {

                    $('.fullScreenSpin').css('display', 'none');
                     $('#paymentMethodModal').modal('toggle');
                    swal({
                        title: 'Question',
                        text: "Payment Method does not exist, would you like to create it?",
                        type: 'question',
                        showCancelButton: true,
                        confirmButtonText: 'Yes',
                        cancelButtonText: 'No'
                    }).then((result) => {
                        if (result.value) {
                            $('#newPaymentMethodModal').modal('toggle');
                            $('#edtPaymentMethodName').val(dataSearchName);
                        } else if (result.dismiss === 'cancel') {
                            $('#newPaymentMethodModal').modal('toggle');
                        }
                    });

                }

            }).catch(function (err) {
                $('.fullScreenSpin').css('display', 'none');
            });
        } else {
          sideBarService.getPaymentMethodVS1().then(function(data) {

                  let records = [];
                  let inventoryData = [];
                  for (let i = 0; i < data.tpaymentmethodvs1.length; i++) {
                    let getIsCreditCard = '';
                    if(data.tpaymentmethodvs1[i].fields.IsCreditCard){
                      getIsCreditCard = '<div class="custom-control custom-checkbox chkBox"><input class="custom-control-input chkBox" type="checkbox" id="' + data.tpaymentmethodvs1[i].Id + '" checked><label class="custom-control-label chkBox"for="' + data.tpaymentmethodvs1[i].Id + '"></label></div>';
                    }else{
                      getIsCreditCard = '<div class="custom-control custom-checkbox chkBox"><input class="custom-control-input chkBox" type="checkbox" id="' + data.tpaymentmethodvs1[i].Id + '"><label class="custom-control-label chkBox"for="' + data.tpaymentmethodvs1[i].Id + '"></label></div>';
                    }
                    var dataList = [
                      data.tpaymentmethodvs1[i].fields.PaymentMethodName || '',
                      getIsCreditCard
                    ];
                splashArrayPaymentMethodList.push(dataList);

                  }
        var datatable = $('#'+currenttablename).DataTable();
              datatable.clear();
              datatable.rows.add(splashArrayPaymentMethodList);
              datatable.draw(false);

              $('.fullScreenSpin').css('display', 'none');
              }).catch(function (err) {
                $('.fullScreenSpin').css('display', 'none');
            });
        }
    },
    'keyup #paymentmethodList_filter input': function (event) {
      if (event.keyCode == 13) {
         $(".btnRefreshPaymentMethod").trigger("click");
      }
    },
    'click .btnDeletePaymentMethod': function() {
        playDeleteAudio();
        let taxRateService = new TaxRateService();
        setTimeout(function(){
        let paymentMethodId = $('#selectDeleteLineID').val();

        let objDetails = {
            type: "TPaymentMethod",
            fields: {
                Id: parseInt(paymentMethodId),
                Active: false
            }
        };

        taxRateService.savePaymentMethod(objDetails).then(function(objDetails) {
            sideBarService.getPaymentMethodDataVS1().then(function(dataReload) {
                addVS1Data('TPaymentMethod', JSON.stringify(dataReload)).then(function(datareturn) {
                    location.reload(true);
                }).catch(function(err) {
                    location.reload(true);
                });
            }).catch(function(err) {
                location.reload(true);
            });
        }).catch(function(err) {
            swal({
                title: 'Oooops...',
                text: err,
                type: 'error',
                showCancelButton: false,
                confirmButtonText: 'Try Again'
            }).then((result) => {
                if (result.value) {
                    Meteor._reload.reload();
                } else if (result.dismiss === 'cancel') {

                }
            });
            $('.fullScreenSpin').css('display', 'none');
        });
    }, delayTimeAfterSound);
    },
    // 'click .btnSavePaymentMethod': function() {
    //     $('.fullScreenSpin').css('display', 'inline-block');
    //     let taxRateService = new TaxRateService();
    //     let paymentMethodID = $('#edtPaymentMethodID').val();
    //     //let headerDept = $('#sltDepartment').val();
    //     let paymentName = $('#edtName').val();
    //     let isCreditCard = false;
    //     let siteCode = $('#edtSiteCode').val();
    //
    //     if ($('#isformcreditcard').is(':checked')) {
    //         isCreditCard = true;
    //     } else {
    //         isCreditCard = false;
    //     }
    //
    //     let objDetails = '';
    //     if (paymentName === '') {
    //         $('.fullScreenSpin').css('display', 'none');
    //         Bert.alert('<strong>WARNING:</strong> Payment Method Name cannot be blank!', 'warning');
    //         e.preventDefault();
    //     }
    //
    //     if (paymentMethodID == "") {
    //         taxRateService.checkPaymentMethodByName(paymentName).then(function(data) {
    //             paymentMethodID = data.tpaymentmethod[0].Id;
    //             objDetails = {
    //                 type: "TPaymentMethod",
    //                 fields: {
    //                     ID: parseInt(paymentMethodID),
    //                     Active: true,
    //                     //PaymentMethodName: paymentName,
    //                     IsCreditCard: isCreditCard,
    //                     PublishOnVS1: true
    //                 }
    //             };
    //
    //             taxRateService.savePaymentMethod(objDetails).then(function(objDetails) {
    //                 sideBarService.getPaymentMethodDataVS1().then(function(dataReload) {
    //                     addVS1Data('TPaymentMethod', JSON.stringify(dataReload)).then(function(datareturn) {
    //                         location.reload(true);
    //                     }).catch(function(err) {
    //                         location.reload(true);
    //                     });
    //                 }).catch(function(err) {
    //                     location.reload(true);
    //                 });
    //             }).catch(function(err) {
    //                 swal({
    //                     title: 'Oooops...',
    //                     text: err,
    //                     type: 'error',
    //                     showCancelButton: false,
    //                     confirmButtonText: 'Try Again'
    //                 }).then((result) => {
    //                     if (result.value) {
    //                         Meteor._reload.reload();
    //                     } else if (result.dismiss === 'cancel') {
    //
    //                     }
    //                 });
    //                 $('.fullScreenSpin').css('display', 'none');
    //             });
    //         }).catch(function(err) {
    //             objDetails = {
    //                 type: "TPaymentMethod",
    //                 fields: {
    //                     Active: true,
    //                     PaymentMethodName: paymentName,
    //                     IsCreditCard: isCreditCard,
    //                     PublishOnVS1: true
    //                 }
    //             };
    //
    //             taxRateService.savePaymentMethod(objDetails).then(function(objDetails) {
    //                 sideBarService.getPaymentMethodDataVS1().then(function(dataReload) {
    //                     addVS1Data('TPaymentMethod', JSON.stringify(dataReload)).then(function(datareturn) {
    //                         location.reload(true);
    //                     }).catch(function(err) {
    //                         location.reload(true);
    //                     });
    //                 }).catch(function(err) {
    //                     location.reload(true);
    //                 });
    //             }).catch(function(err) {
    //                 swal({
    //                     title: 'Oooops...',
    //                     text: err,
    //                     type: 'error',
    //                     showCancelButton: false,
    //                     confirmButtonText: 'Try Again'
    //                 }).then((result) => {
    //                     if (result.value) {
    //                         Meteor._reload.reload();
    //                     } else if (result.dismiss === 'cancel') {
    //
    //                     }
    //                 });
    //                 $('.fullScreenSpin').css('display', 'none');
    //             });
    //         });
    //
    //     } else {
    //         objDetails = {
    //             type: "TPaymentMethod",
    //             fields: {
    //                 ID: parseInt(paymentMethodID),
    //                 Active: true,
    //                 PaymentMethodName: paymentName,
    //                 IsCreditCard: isCreditCard,
    //                 PublishOnVS1: true
    //             }
    //         };
    //
    //         taxRateService.savePaymentMethod(objDetails).then(function(objDetails) {
    //             sideBarService.getPaymentMethodDataVS1().then(function(dataReload) {
    //                 addVS1Data('TPaymentMethod', JSON.stringify(dataReload)).then(function(datareturn) {
    //                     location.reload(true);
    //                 }).catch(function(err) {
    //                     location.reload(true);
    //                 });
    //             }).catch(function(err) {
    //                 location.reload(true);
    //             });
    //         }).catch(function(err) {
    //             swal({
    //                 title: 'Oooops...',
    //                 text: err,
    //                 type: 'error',
    //                 showCancelButton: false,
    //                 confirmButtonText: 'Try Again'
    //             }).then((result) => {
    //                 if (result.value) {
    //                     Meteor._reload.reload();
    //                 } else if (result.dismiss === 'cancel') {
    //
    //                 }
    //             });
    //             $('.fullScreenSpin').css('display', 'none');
    //         });
    //     }
    //
    //
    //
    //
    // },
    'click .btnAddPaymentMethod': function() {
        let templateObject = Template.instance();
        $('#add-paymentmethod-title').text('Add New Payment Method');
        $('#edtPaymentMethodID').val('');
        $('#edtPaymentMethodName').val('');
        templateObject.includeCreditCard.set(false);
    },
    'click .btnBack': function(event) {
        playCancelAudio();
        event.preventDefault();
        setTimeout(function(){
        history.back(1);
        }, delayTimeAfterSound);
    }


});

Template.paymentmethodpop.helpers({
    datatablerecords: () => {
        return Template.instance().datatablerecords.get().sort(function(a, b) {
            if (a.paymentmethodname == 'NA') {
                return 1;
            } else if (b.paymentmethodname == 'NA') {
                return -1;
            }
            return (a.paymentmethodname.toUpperCase() > b.paymentmethodname.toUpperCase()) ? 1 : -1;
        });
    },
    accountID: () => {
        return Template.instance().accountID.get();
    },
    apiFunction:function() {
        let sideBarService = new SideBarService();
        return sideBarService.getPaymentMethodDataList;
    },
    tableheaderrecords: () => {
        return Template.instance().tableheaderrecords.get();
    },
    salesCloudPreferenceRec: () => {
        return CloudPreference.findOne({
            userid: localStorage.getItem('mycloudLogonID'),
            PrefName: 'paymentmethodList'
        });
    },
    searchAPI: function() {
        return sideBarService.getPaymentMethodDataList;
    },

    service: ()=>{
        let sideBarService = new SideBarService();
        return sideBarService;

    },
    deptrecords: () => {
        return Template.instance().deptrecords.get().sort(function(a, b) {
            if (a.department == 'NA') {
                return 1;
            } else if (b.department == 'NA') {
                return -1;
            }
            return (a.department.toUpperCase() > b.department.toUpperCase()) ? 1 : -1;
        });
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
    includeAccountID: () => {
        return Template.instance().includeAccountID.get();
    },
    includeCreditCard: () => {
        return Template.instance().includeCreditCard.get();
    },
    loggedCompany: () => {
        return localStorage.getItem('mySession') || '';
    },
    tablename: () => {
        let templateObject = Template.instance();
        let accCustID = templateObject.data.custid ? templateObject.data.custid : '';
        return 'tblPaymentMethod'+ accCustID;
    }

});

Template.registerHelper('equals', function(a, b) {
    return a === b;
});
