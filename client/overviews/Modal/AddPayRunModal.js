import {ReactiveVar} from "meteor/reactive-var";
import moment from "moment";
import {AccountService} from "../../accounts/account-service";
import Datehandler from "../../DateHandler";
import PayRunHandler from "../../js/ObjectManager/PayRunHandler";
import PayRun from "../../js/Api/Model/PayRun";
import {OrganisationService} from "../../js/organisation-service";
import {SideBarService} from "../../js/sidebar-service";
import CachedHttp from "../../lib/global/CachedHttp";
import erpObject from "../../lib/global/erp-objects";
import LoadingOverlay from "../../LoadingOverlay";
import {TaxRateService} from "../../settings/settings-service";
import {UtilityService} from "../../utility-service";
import { Template } from 'meteor/templating';
import './AddPayRunModal.html';
let utilityService = new UtilityService();
let sideBarService = new SideBarService();
let accountService = new AccountService();
let taxRateService = new TaxRateService();
let organisationService = new OrganisationService();
let payRunHandler = new PayRunHandler();

Template.AddPayRunModal.onCreated(function () {
  const templateObject = Template.instance();
  templateObject.calendarPeriods = new ReactiveVar([]);

  templateObject.AppTableModalData = new ReactiveVar();
    templateObject.tableheaderrecords = new ReactiveVar([]);
    templateObject.getDataTableList = function(data) {
        let ID = data.fields.ID || '';
        var dataList = [
            ID,
            data.fields.PayrollCalendarName || '',
            data.fields.PayrollCalendarPayPeriod || '',
            moment(data.fields.PayrollCalendarStartDate).format('DD/MM/YYYY') || '',
            moment(data.fields.PayrollCalendarFirstPaymentDate).format('DD/MM/YYYY') || '',
            data.fields.PayrollCalendarActive == true ? '' : 'In-Active',
        ];
        return dataList;
    }

    let headerStructure = [
        { index: 0, label: 'ID', class: 'colCalenderID', active: false, display: true, width: "10" },
        { index: 1, label: 'Name', class: 'colPayCalendarName', active: true, display: true, width: "200" },
        { index: 2, label: 'Pay Period', class: 'colPayPeriod', active: true, display: true, width: "110" },
        { index: 3, label: 'Next Pay Period', class: 'colNextPayPeriod', active: true, display: true, width: "110" },
        { index: 4, label: 'Next Payment Date', class: 'colNextPaymentDate', active: true, display: true, width: "80" },
        { index: 5, label: 'Status', class: 'colStatus', active: true, display: true, width: "120" },
    ];
  templateObject.tableheaderrecords.set(headerStructure);
});

Template.AddPayRunModal.onRendered(() => {
  const templateObject = Template.instance();

  getVS1Data('TPayrollCalendars').then(function (dataObject) {
    if (dataObject.length == 0) {
        sideBarService.getCalender(initialBaseDataLoad, 0).then(async function (data) {
            await addVS1Data('TPayrollCalendars', JSON.stringify(data));
            templateObject.payrollcalendersorts(data);
        }).catch(function (err) {

        });
    } else {
        let data = JSON.parse(dataObject[0].data);
        templateObject.payrollcalendersorts(data);
        
    }
  }).catch(function (err) {
    sideBarService.getCalender(initialBaseDataLoad, 0).then(async function (data) {
        await addVS1Data('TPayrollCalendars', JSON.stringify(data));
        templateObject.payrollcalendersorts(data);
    }).catch(function (err) {

    });
  });

  getVS1Data('TPayRun').then(function (dataObject) {

        let data = JSON.parse(dataObject[0].data);
       

  }).catch(function (err) {
    sideBarService.getCalender(initialBaseDataLoad, 0).then(async function (data) {
        await addVS1Data('TPayRun', JSON.stringify(data));
        templateObject.payrollcalendersorts(data);
    }).catch(function (err) {

    });
  });



  templateObject.payrollcalendersorts = function(data) {
    let Calendardata = data.tpayrollcalendars;
    
  for(var k =0; k< Calendardata.length ; k++)
  {
    $("#selectAPayRun").append("<option value='"+Calendardata[k].fields.ID +"'>" + Calendardata[k].fields.PayrollCalendarPayPeriod+ " : " +Calendardata[k].fields.PayrollCalendarFirstPaymentDate + "</option>");
  }
  
  }
  // templateObject.loadCalendars = async () => {
  //   payRunHandler.loadFromLocal();
  //   LoadingOverlay.show();

  //   let list = [];
  //   let data = await CachedHttp.get(erpObject.TPayrollCalendars, async () => {
  //     return await sideBarService.getCalender(initialBaseDataLoad, 0);
  //   }, {
  //     useIndexDb: true,
  //     useLocalStorage: false,
  //     validate: cachedResponse => {
  //       return false;
  //     }
  //   });

  //   data = data.response;
  //   // data.tpayrollcalendars.forEach(element => {
  //   //   list.push(element.fields);
  //   // });
  //   let splashArrayCalenderList = [];

  //   data.tpayrollcalendars.forEach(calendar => {
  //     dataListAllowance = [
  //       calendar.fields.ID || "",
  //       calendar.fields.PayrollCalendarName || "",
  //       calendar.fields.PayrollCalendarPayPeriod || "",
  //       moment(calendar.fields.PayrollCalendarStartDate).format("DD/MM/YYYY") || "",
  //       moment(calendar.fields.PayrollCalendarFirstPaymentDate).format("DD/MM/YYYY") || "",
  //       '<td contenteditable="false" class="colDeleteCalenders"><span class="table-remove"><button type="button" class="btn btn-danger btn-rounded btn-sm my-0"><i class="fa fa-remove"></i></button></span>'
  //     ];

  //     splashArrayCalenderList.push(dataListAllowance);
  //   });

    // setTimeout(function () {
    //   $("#tblPayCalendars").DataTable({
    //     data: splashArrayCalenderList,
    //     sDom: "<'row'><'row'<'col-sm-12 col-md-6'f><'col-sm-12 col-md-6'l>r>t<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>B",
    //     columnDefs: [
    //       {
    //         className: "colCalenderID hiddenColumn",
    //         targets: [0]
    //       }, {
    //         className: "colPayCalendarName",
    //         targets: [1]
    //       }, {
    //         className: "colPayPeriod",
    //         targets: [2]
    //       }, {
    //         className: "colNextPayPeriod",
    //         targets: [3]
    //       }, {
    //         className: "colNextPaymentDate",
    //         targets: [4]
    //       }, {
    //         className: "colDeleteCalenders",
    //         orderable: false,
    //         targets: -1
    //       }
    //     ],
    //     select: true,
    //     destroy: true,
    //     colReorder: true,
    //     pageLength: initialDatatableLoad,
    //     lengthMenu: [
    //       [
    //         initialDatatableLoad, -1
    //       ],
    //       [
    //         initialDatatableLoad, "All"
    //       ]
    //     ],
    //     info: true,
    //     responsive: true,
    //     order: [
    //       [0, "asc"]
    //     ],
    //     action: function () {
    //       $("#tblPayCalendars").DataTable().ajax.reload();
    //     },
    //     fnDrawCallback: function (oSettings) {
    //       $(".paginate_button.page-item").removeClass("disabled");
    //       $("#tblPayCalendars_ellipsis").addClass("disabled");
    //       if (oSettings._iDisplayLength == -1) {
    //         if (oSettings.fnRecordsDisplay() > 150) {}
    //       } else {}
    //       if (oSettings.fnRecordsDisplay() < initialDatatableLoad) {
    //         $(".paginate_button.page-item.next").addClass("disabled");
    //       }

    //       $(".paginate_button.next:not(.disabled)", this.api().table().container()).on("click", function () {
    //         LoadingOverlay.show();
    //         var splashArrayCalenderListDupp = new Array();
    //         let dataLenght = oSettings._iDisplayLength;
    //         let customerSearch = $("#tblPayCalendars_filter input").val();

    //         sideBarService.getCalender(initialDatatableLoad, oSettings.fnRecordsDisplay()).then(function (data) {
    //           for (let i = 0; i < data.tpayrollcalendars.length; i++) {
    //             var dataListAllowance = [
    //               data.tpayrollcalendars[i].fields.ID || "",
    //               data.tpayrollcalendars[i].fields.PayrollCalendarName || "",
    //               data.tpayrollcalendars[i].fields.PayrollCalendarPayPeriod || "",
    //               moment(data.tpayrollcalendars[i].fields.PayrollCalendarStartDate).format("DD/MM/YYYY") || "",
    //               moment(data.tpayrollcalendars[i].fields.PayrollCalendarFirstPaymentDate).format("DD/MM/YYYY") || "",
    //               '<td contenteditable="false" class="colDeleteCalenders"><span class="table-remove"><button type="button" class="btn btn-danger btn-rounded btn-sm my-0"><i class="fa fa-remove"></i></button></span>'
    //             ];

    //             splashArrayCalenderList.push(dataListAllowance);
    //           }

    //           let uniqueChars = [...new Set(splashArrayCalenderList)];
    //           var datatable = $("#tblPayCalendars").DataTable();
    //           datatable.clear();
    //           datatable.rows.add(uniqueChars);
    //           datatable.draw(false);
    //           setTimeout(function () {
    //             $("#tblPayCalendars").dataTable().fnPageChange("last");
    //           }, 400);

    //           LoadingOverlay.hide();
    //         }).catch(function (err) {
    //           LoadingOverlay.hide();
    //         });
    //       });
    //       // setTimeout(function () {
    //       //   MakeNegative();
    //       // }, 100);
    //     },
    //     fnInitComplete: function () {
    //       $("<button class='btn btn-primary btnAddNewpaycalender' data-dismiss='modal' data-toggle='modal' data-target='#newPayCalendarModal' type='button' style='padding: 4px 10px; font-size: 16px; margin-left: 12px !important;'><i class='fas fa-plus'></i></button>").insertAfter("#tblPayCalendars_filter");
    //       $("<button class='btn btn-primary btnRefreshCalender' type='button' id='btnRefreshAllowance' style='padding: 4px 10px; font-size: 16px; margin-left: 12px !important;'><i class='fas fa-search-plus' style='margin-right: 5px'></i>Search</button>").insertAfter("#ttblPayCalendars_filter");
    //     }
    //   }).on("page", function () {
    //     // setTimeout(function () {
    //     //   MakeNegative();
    //     // }, 100);
    //   }).on("column-reorder", function () {}).on("length.dt", function (e, settings, len) {
    //     //$('.fullScreenSpin').css('display', 'inline-block');
    //     let dataLenght = settings._iDisplayLength;
    //     splashArrayCalenderList = [];
    //     if (dataLenght == -1) {
    //       LoadingOverlay.hide();
    //     } else {
    //       if (settings.fnRecordsDisplay() >= settings._iDisplayLength) {
    //         LoadingOverlay.hide();
    //       } else {
    //         sideBarService.getCalender(dataLenght, 0).then(function (dataNonBo) {
    //           addVS1Data("TPayrollCalendars", JSON.stringify(dataNonBo)).then(function (datareturn) {
    //             templateObject.resetData(dataNonBo);
    //             LoadingOverlay.hide();
    //           }).catch(function (err) {
    //             LoadingOverlay.hide();
    //           });
    //         }).catch(function (err) {
    //           LoadingOverlay.hide();
    //         });
    //       }
    //     }
    //     // setTimeout(function () {
    //     //   MakeNegative();
    //     // }, 100);
    //   });
    // }, 0);

    // $("div.dataTables_filter input").addClass("form-control form-control-sm");

    // setTimeout(() => {
    //   const trs = $("#tblPayCalendars tbody").find("tr");

    //   $("#AppTableModal").modal("show");
    //   $(trs).each((index, tr) => {
    //     $(tr).on("click", e => {
    //       const id = $(e.currentTarget).find(".colCalenderID").text();
    //       const name = $(e.currentTarget).find(".colPayCalendarName").text();
    //       const payPeriod = $(e.currentTarget).find(".colPayPeriod").text();
    //       const nextPayPeriod = $(e.currentTarget).find(".colNextPayPeriod").text();
    //       const nextPaymentDate = $(e.currentTarget).find(".colNextPaymentDate").text();

    //       $("#selectAPayRun").attr("calendar-id", id);
    //       $("#selectAPayRun").val(`${name} (${payPeriod} | ${nextPayPeriod} - ${nextPaymentDate})`);
    //       $("#AppTableModal").modal("hide");
    //     });
    //   });

    //   $(document).on("click", ".colDeleteCalenders", function (event) {
    //     event.stopPropagation();
    //     let targetID = $(event.target).closest("tr").find(".colCalenderID").text() || 0; // table row ID

    //     let calenderName = $(this).closest("tr").find(".colPayCalendarName").text() || "";

    //     $("#selectColDeleteLineID").val(targetID);
    //     $("#selectCalenderName").val(targetID);
    //     $("#deleteCalenderLineModal").modal("toggle");
    //   });
    // }, 300);



//     LoadingOverlay.hide();
//   };

//   // $("#payperiod").editableSelect("add", "Weekly");
//   // $("#payperiod").editableSelect("add", "Fortnightly");
//   // $("#payperiod").editableSelect("add", "Twice Monthly");
//   // $("#payperiod").editableSelect("add", "Four Weekly");
//   // $("#payperiod").editableSelect("add", "Monthly");
//   // $("#payperiod").editableSelect("add", "Quarterly");

//   //templateObject.loadCalendars();

//   Datehandler.defaultDatePicker();
  
});

Template.AddPayRunModal.events({
  "click .selectAPayRun": (e, ui) => {
    // ui.loadCalendars();
    //  $('#AppTableModal').modal("show");

  },
  "click .btnPayRunNext": async event => {
    $(".modal-backdrop").css("display", "none");
    const calendarId = $("#selectAPayRun").val();


    if (await payRunHandler.isPayRunCalendarAlreadyDrafted(calendarId) == undefined) {
      window.location.href = `/payrundetails?cid=${calendarId}`; // this will generate one 
    } else {
      const result = await swal({title: "Can't create duplicate draft PayRuns", text: "You can't select this Pay Pariod while one is in draft. Please Approve or Delete it to create a new one first", type: "error", showCancelButton: true, confirmButtonText: "Ok"});
    }
  },

  // "click .btnAddNewPayCalender": (e, ui) => {
  //   let id = $("#paycalendarId").val();
  //   var today = new Date();
  //   var dd = String(today.getDate()).padStart(2, "0");
  //   var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  //   var yyyy = today.getFullYear();
  //   today = dd + "/" + mm + "/" + yyyy;
  //   $("#edtStartDate").val(today);
  //   $("#edtFirstPaymentDate").val(today);
  //   $("#paycalendarId").val(0);
  //   $("#calender_name").val("");
  //   $("#newPayCalendarLabel").text("Add New Pay Calender");
  //   $("#payperiod").val("");
  // },

  // "click .savenewcalender": (e, ui) => {
  //   LoadingOverlay.show();
  //   let taxRateService = new TaxRateService();
  //   let oldpaycalenderid = $("#paycalendarId").val() || 0;
  //   let payperiod = $("#payperiod").val() || "";
  //   let calender_name = $("#calender_name").val() || "";
  //   let startdate = $("#edtStartDate").val() || "";
  //   let FirstPaymentDate = $("#edtFirstPaymentDate").val() || "";

  //   if (payperiod === "") {
  //     LoadingOverlay.hide();
  //     swal("Pay period has not been selected!", "", "warning");
  //     e.preventDefault();
  //   } else if (calender_name === "") {
  //     LoadingOverlay.hide();
  //     swal("Calender Name Can not blank!", "", "warning");
  //     e.preventDefault();
  //   } else if (startdate === "") {
  //     LoadingOverlay.hide();
  //     swal("Start Date Has not been selected!", "", "warning");
  //     e.preventDefault();
  //   } else if (FirstPaymentDate === "") {
  //     LoadingOverlay.hide();
  //     swal("First Payment Date Has not been selected!", "", "warning");
  //     e.preventDefault();
  //   } else {
  //     if (oldpaycalenderid != 0) {
  //       LoadingOverlay.show();
  //       objDetails = {
  //         type: "TPayrollCalendars",
  //         fields: {
  //           ID: parseInt(oldpaycalenderid),
  //           PayrollCalendarPayPeriod: payperiod,
  //           PayrollCalendarName: calender_name,
  //           PayrollCalendarStartDate: moment(startdate, "DD/MM/YYYY").format("YYYY-MM-DD"),
  //           PayrollCalendarFirstPaymentDate: moment(FirstPaymentDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
  //           PayrollCalendarActive: true
  //         }
  //       };

  //       taxRateService.saveCalender(objDetails).then(function (objDetails) {
  //         LoadingOverlay.hide();
  //         swal({title: "Success", text: "Pay Calendar saved successfully.", type: "success", showCancelButton: false, confirmButtonText: "Done"}).then(result => {
  //           if (result.value) {
  //             sideBarService.getCalender(initialBaseDataLoad, 0).then(function (dataReload) {
  //               addVS1Data("TPayrollCalendars", JSON.stringify(dataReload)).then(function (datareturn) {
  //                 $("#closemodel").trigger("click");
  //                 LoadingOverlay.show();
  //                 // window.open("/payrollrules?active_key=calender", "_self");
  //                 ui.loadCalendars();
  //               }).catch(function (err) {
  //                 $("#closemodel").trigger("click");
  //                 LoadingOverlay.show();

  //                 // window.open("/payrollrules?active_key=calender", "_self");
  //                 ui.loadCalendars();
  //               });
  //             }).catch(function (err) {
  //               $("#closemodel").trigger("click");
  //               LoadingOverlay.show();

  //               // window.open("/payrollrules?active_key=calender", "_self");
  //               ui.loadCalendars();
  //             });
  //           } else if (result.dismiss === "cancel") {}
  //         });
  //       }).catch(function (err) {
  //         LoadingOverlay.hide();
  //         swal({title: "Oooops...", text: err, type: "error", showCancelButton: false, confirmButtonText: "ok"}).then(result => {
  //           if (result.value) {} else if (result.dismiss === "cancel") {}
  //         });
  //       });
  //     } else {
  //       LoadingOverlay.show();

  //       taxRateService.checkCalenderName(calender_name).then(function (data) {
  //         calenderID = data.tpayrollcalendars;
  //         var calender_id = calenderID[0];

  //         objDetails = {
  //           type: "TPayrollCalendars",
  //           fields: {
  //             ID: parseInt(calender_id.Id),
  //             PayrollCalendarPayPeriod: payperiod,
  //             PayrollCalendarName: calender_name,
  //             PayrollCalendarStartDate: moment(startdate, "DD/MM/YYYY").format("YYYY-MM-DD"),
  //             PayrollCalendarFirstPaymentDate: moment(FirstPaymentDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
  //             PayrollCalendarActive: true
  //           }
  //         };

  //         taxRateService.saveCalender(objDetails).then(function (objDetails) {
  //           LoadingOverlay.hide();
  //           swal({title: "Success", text: "Pay Calendar saved successfully.", type: "success", showCancelButton: false, confirmButtonText: "Done"}).then(result => {
  //             if (result.value) {
  //               sideBarService.getCalender(initialBaseDataLoad, 0).then(function (dataReload) {
  //                 addVS1Data("TPayrollCalendars", JSON.stringify(dataReload)).then(function (datareturn) {
  //                   $("#closemodel").trigger("click");
  //                   LoadingOverlay.show();
  //                   // window.open("/payrollrules?active_key=calender", "_self");
  //                   ui.loadCalendars();
  //                 }).catch(function (err) {
  //                   $("#closemodel").trigger("click");
  //                   LoadingOverlay.show();
  //                   // window.open("/payrollrules?active_key=calender", "_self");
  //                   ui.loadCalendars();
  //                 });
  //               }).catch(function (err) {
  //                 $("#closemodel").trigger("click");
  //                 LoadingOverlay.show();
  //                 // window.open("/payrollrules?active_key=calender", "_self");
  //                 ui.loadCalendars();
  //               });
  //             } else if (result.dismiss === "cancel") {}
  //           });
  //         }).catch(function (err) {
  //           LoadingOverlay.hide();
  //           swal({title: "Oooops...", text: err, type: "error", showCancelButton: false, confirmButtonText: "ok"}).then(result => {
  //             if (result.value) {} else if (result.dismiss === "cancel") {}
  //           });
  //         });
  //       }).catch(function (err) {
  //         objDetails = {
  //           type: "TPayrollCalendars",
  //           fields: {
  //             PayrollCalendarPayPeriod: payperiod,
  //             PayrollCalendarName: calender_name,
  //             PayrollCalendarStartDate: moment(startdate, "DD/MM/YYYY").format("YYYY-MM-DD"),
  //             PayrollCalendarFirstPaymentDate: moment(FirstPaymentDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
  //             PayrollCalendarActive: true
  //           }
  //         };

  //         taxRateService.saveCalender(objDetails).then(function (objDetails) {
  //           LoadingOverlay.hide();
  //           swal({title: "Success", text: "Pay Calendar saved successfully.", type: "success", showCancelButton: false, confirmButtonText: "Done"}).then(result => {
  //             if (result.value) {
  //               sideBarService.getCalender(initialBaseDataLoad, 0).then(function (dataReload) {
  //                 addVS1Data("TPayrollCalendars", JSON.stringify(dataReload)).then(function (datareturn) {
  //                   $("#closemodel").trigger("click");
  //                   LoadingOverlay.show();
  //                   // window.open("/payrollrules?active_key=calender", "_self");
  //                   ui.loadCalendars();
  //                 }).catch(function (err) {
  //                   $("#closemodel").trigger("click");
  //                   LoadingOverlay.show();
  //                   // window.open("/payrollrules?active_key=calender", "_self");
  //                   ui.loadCalendars();
  //                 });
  //               }).catch(function (err) {
  //                 $("#closemodel").trigger("click");
  //                 LoadingOverlay.show();
  //                 // window.open("/payrollrules?active_key=calender", "_self");
  //                 ui.loadCalendars();
  //               });
  //             } else if (result.dismiss === "cancel") {}
  //           });
  //         }).catch(function (err) {
  //           LoadingOverlay.hide();
  //           swal({title: "Oooops...", text: err, type: "error", showCancelButton: false, confirmButtonText: "ok"}).then(result => {
  //             if (result.value) {} else if (result.dismiss === "cancel") {}
  //           });
  //         });
  //       });
  //     }
  //   }

  //   $("#newPayCalendarModal").modal("show");
  // },

  // "click .colDeleteCalenders": (e, ui) => {
  //
  //   e.stopPropagation();
  //   let targetID = $(e.target).closest("tr").find(".colCalenderID").text() || 0;  table row ID

  //   let calenderName = $(this).closest("tr").find(".colPayCalendarName").text() || "";

  //   $("#selectColDeleteLineID").val(targetID);
  //   $("#selectCalenderName").val(targetID);
  //   $("#deleteCalenderLineModal").modal("toggle");
  // }

  // "click .btnDeleteCalender": (e, ui) => {
  //   playDeleteAudio();
  //   let taxRateService = new TaxRateService();
  //   setTimeout(function(){
  //   let calenderid = $("#selectColDeleteLineID").val() || 0;
  //   let calendername = $("#selectCalenderName").val() || 0;
  //   LoadingOverlay.show();

  //   let objDetails = {
  //     type: "TPayrollCalendars",
  //     fields: {
  //       Id: calendername,
  //       PayrollCalendarActive: false
  //     }
  //   };

  //   if (calendername != 0) {
  //     taxRateService.saveCalender(objDetails).then(function (objDetails) {
  //       LoadingOverlay.hide();
  //       swal({title: "Success", text: "Calender Removed Successfully", type: "success", showCancelButton: false, confirmButtonText: "Done"}).then(result => {
  //         if (result.value) {
  //           $("#hidedeleteca").trigger("click");
  //           sideBarService.getCalender(initialBaseDataLoad, 0).then(function (dataReload) {
  //             addVS1Data("TPayrollCalendars", JSON.stringify(dataReload)).then(function (datareturn) {
  //               // $("#hidedeleteca").trigger("click");

  //               // window.open("/payrollrules?active_key=calender", "_self");
  //               ui.loadCalendars();
  //             }).catch(function (err) {
  //               LoadingOverlay.show();
  //               // window.open("/payrollrules?active_key=calender", "_self");
  //               ui.loadCalendars();
  //             });
  //           }).catch(function (err) {
  //             $("#hidedeleteca").trigger("click");
  //             LoadingOverlay.show();
  //             // window.open("/payrollrules?active_key=calender", "_self");
  //             ui.loadCalendars();
  //           });
  //         } else if (result.dismiss === "cancel") {}
  //       });
  //     }).catch(function (err) {
  //       swal({title: "Oooops...", text: err, type: "error", showCancelButton: false, confirmButtonText: "ok"}).then(result => {
  //         if (result.value) {} else if (result.dismiss === "cancel") {}
  //       });
  //       LoadingOverlay.hide();
  //     });
  //   } else {
  //     LoadingOverlay.hide();
  //     swal({title: "Oooops...", text: "Calender ID missing", type: "error", showCancelButton: false, confirmButtonText: "Try Again"}).then(result => {
  //       if (result.value) {} else if (result.dismiss === "cancel") {}
  //     });
  //   }
  // }, delayTimeAfterSound);
  // }
});

Template.AddPayRunModal.helpers({
  getCalendar: () => {
    return Template.instance().calendarPeriods.get();
  },
  AppTableModalData: () => {
    return Template.instance().AppTableModalData.get();
  },
    tableheaderrecords: () => {
        return Template.instance().tableheaderrecords.get();
    },

    apiFunction:function() {
        let sideBarService = new SideBarService();
        return sideBarService.getCalender;
    },

    searchAPI: function() {
        return sideBarService.getNewCalenderByNameOrPayPeriod;
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
});
