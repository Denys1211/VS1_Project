import {ReactiveVar} from "meteor/reactive-var";
import moment from "moment";
import Datehandler from "../../../DateHandler";
import GlobalFunctions from "../../../GlobalFunctions";
import {SideBarService} from "../../../js/sidebar-service";
import CachedHttp from "../../../lib/global/CachedHttp";
import erpObject from "../../../lib/global/erp-objects";
import LoadingOverlay from "../../../LoadingOverlay";
import {TaxRateService} from "../../../settings/settings-service";

import { Template } from 'meteor/templating';
import './SelectPayPeriod.html';

let sideBarService = new SideBarService();

Template.SelectPayPeriod.onCreated(function () {
  const templateObject = Template.instance();
  templateObject.calendarPeriods = new ReactiveVar([]);

  templateObject.tableheaderrecords = new ReactiveVar([]);
  templateObject.getDataTableList = function(data) {
    let ID = data.fields.ID || '';
    var dataList = [
      ID,
      data.fields.PayPeriodName || '',
      data.fields.PayPeriodActive == true ? '' : 'In-Active',
    ];
    return dataList;
  }

  let headerStructure = [
    { index: 0, label: 'ID', class: 'colPayPeriodID', active: false, display: true, width: "10" },
    { index: 1, label: 'Name', class: 'colPayPeriodName', active: true, display: true, width: "200" },
    { index: 2, label: 'Status', class: 'colStatus', active: true, display: true, width: "120" },
  ];
  templateObject.tableheaderrecords.set(headerStructure);
});

Template.SelectPayPeriod.onRendered(() => {
  const templateObject = Template.instance();

  templateObject.loadCalendars = async (refresh = false) => {
    LoadingOverlay.show();
    let data = await CachedHttp.get(erpObject.TPayrollCalendars, async () => {
      return await sideBarService.getCalender(initialBaseDataLoad, 0);
    }, {
      forceOverride: refresh,
      validate: cachedResponse => {
        return true;
      }
    });
    data = data.response;

    let calendars = data.tpayrollcalendars.map(c => c.fields);
    await templateObject.calendarPeriods.set(calendars);

    setTimeout(() => {
      // $("#SelectPayRunModal #tblPayCalendars").DataTable({
      //   ...TableHandler.getDefaultTableConfiguration('tblPayCalendars', {
      //     showPlusButton: false,
      //     showSearchButton: false

      //   })
      // });
    }, 300)


    LoadingOverlay.hide();
  };

  // templateObject.loadCalendars();

  Datehandler.defaultDatePicker();
});

Template.SelectPayPeriod.events({
  "shown.bs.modal #SelectPayRunModal": (e, ui) => {
    ui.loadCalendars();
  },

  // "click .selectAPayRun": (e, ui) => {
  //   ui.loadCalendars();
  //   $('#AppTableModal').modal("show");
  // },
  "click .btnPayRunNext": event => {
    $(".modal-backdrop").css("display", "none");
    const id = $("#selectAPayRun").attr("calendar-id");
    // FlowRouter.go(`/payrundetails?cid=${id}`);
    window.location.href = `/payrundetails?cid=${id}`;
  },

  "click .btnAddNewPayPeriod": (e, ui) => {
    let id = $("#paycalendarId").val();
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, "0");
    var mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
    var yyyy = today.getFullYear();
    today = dd + "/" + mm + "/" + yyyy;
    $("#edtStartDate").val(today);
    $("#edtFirstPaymentDate").val(today);
    $("#paycalendarId").val(0);
    $("#calender_name").val("");
    $("#newPayCalendarLabel").text("Add New Pay Calender");
    $("#payperiod").val("");
  },

  "click .saveNewPayPeriod, click add-tblPayCalendars": (e, ui) => {
    LoadingOverlay.show();
    let taxRateService = new TaxRateService();
    let oldpaycalenderid = $("#paycalendarId").val() || 0;
    let payperiod = $("#payperiod").val() || "";
    let calender_name = $("#calender_name").val() || "";
    let startdate = $("#edtStartDate").val() || "";
    let FirstPaymentDate = $("#edtFirstPaymentDate").val() || "";

    if (payperiod === "") {
      LoadingOverlay.hide();
      swal("Pay period has not been selected!", "", "warning");
      e.preventDefault();
    } else if (calender_name === "") {
      LoadingOverlay.hide();
      swal("Calender Name Can not blank!", "", "warning");
      e.preventDefault();
    } else if (startdate === "") {
      LoadingOverlay.hide();
      swal("Start Date Has not been selected!", "", "warning");
      e.preventDefault();
    } else if (FirstPaymentDate === "") {
      LoadingOverlay.hide();
      swal("First Payment Date Has not been selected!", "", "warning");
      e.preventDefault();
    } else {
      if (oldpaycalenderid != 0) {
        LoadingOverlay.show();
        objDetails = {
          type: "TPayrollCalendars",
          fields: {
            ID: parseInt(oldpaycalenderid),
            PayrollCalendarPayPeriod: payperiod,
            PayrollCalendarName: calender_name,
            PayrollCalendarStartDate: moment(startdate, "DD/MM/YYYY").format("YYYY-MM-DD"),
            PayrollCalendarFirstPaymentDate: moment(FirstPaymentDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
            PayrollCalendarActive: true
          }
        };

        taxRateService.saveCalender(objDetails).then(function (objDetails) {
          LoadingOverlay.hide();
          swal({title: "Success", text: "Pay Calendar saved successfully.", type: "success", showCancelButton: false, confirmButtonText: "Done"}).then(result => {
            if (result.value) {
              sideBarService.getCalender(initialBaseDataLoad, 0).then(function (dataReload) {
                addVS1Data("TPayrollCalendars", JSON.stringify(dataReload)).then(function (datareturn) {
                  $("#closemodel").trigger("click");
                  LoadingOverlay.show();
                  // window.open("/payrollrules?active_key=calender", "_self");
                  ui.loadCalendars();
                }).catch(function (err) {
                  $("#closemodel").trigger("click");
                  LoadingOverlay.show();

                  // window.open("/payrollrules?active_key=calender", "_self");
                  ui.loadCalendars();
                });
              }).catch(function (err) {
                $("#closemodel").trigger("click");
                LoadingOverlay.show();

                // window.open("/payrollrules?active_key=calender", "_self");
                ui.loadCalendars();
              });
            } else if (result.dismiss === "cancel") {}
          });
        }).catch(function (err) {
          LoadingOverlay.hide();
          swal({title: "Oooops...", text: err, type: "error", showCancelButton: false, confirmButtonText: "ok"}).then(result => {
            if (result.value) {} else if (result.dismiss === "cancel") {}
          });
        });
      } else {
        LoadingOverlay.show();

        taxRateService.checkCalenderName(calender_name).then(function (data) {
          calenderID = data.tpayrollcalendars;
          var calender_id = calenderID[0];

          objDetails = {
            type: "TPayrollCalendars",
            fields: {
              ID: parseInt(calender_id.Id),
              PayrollCalendarPayPeriod: payperiod,
              PayrollCalendarName: calender_name,
              PayrollCalendarStartDate: moment(startdate, "DD/MM/YYYY").format("YYYY-MM-DD"),
              PayrollCalendarFirstPaymentDate: moment(FirstPaymentDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
              PayrollCalendarActive: true
            }
          };

          taxRateService.saveCalender(objDetails).then(function (objDetails) {
            LoadingOverlay.hide();
            swal({title: "Success", text: "Pay Calendar saved successfully.", type: "success", showCancelButton: false, confirmButtonText: "Done"}).then(result => {
              if (result.value) {
                sideBarService.getCalender(initialBaseDataLoad, 0).then(function (dataReload) {
                  addVS1Data("TPayrollCalendars", JSON.stringify(dataReload)).then(function (datareturn) {
                    $("#closemodel").trigger("click");
                    LoadingOverlay.show();
                    // window.open("/payrollrules?active_key=calender", "_self");
                    ui.loadCalendars();
                  }).catch(function (err) {
                    $("#closemodel").trigger("click");
                    LoadingOverlay.show();
                    // window.open("/payrollrules?active_key=calender", "_self");
                    ui.loadCalendars();
                  });
                }).catch(function (err) {
                  $("#closemodel").trigger("click");
                  LoadingOverlay.show();
                  // window.open("/payrollrules?active_key=calender", "_self");
                  ui.loadCalendars();
                });
              } else if (result.dismiss === "cancel") {}
            });
          }).catch(function (err) {
            LoadingOverlay.hide();
            swal({title: "Oooops...", text: err, type: "error", showCancelButton: false, confirmButtonText: "ok"}).then(result => {
              if (result.value) {} else if (result.dismiss === "cancel") {}
            });
          });
        }).catch(function (err) {
          objDetails = {
            type: "TPayrollCalendars",
            fields: {
              PayrollCalendarPayPeriod: payperiod,
              PayrollCalendarName: calender_name,
              PayrollCalendarStartDate: moment(startdate, "DD/MM/YYYY").format("YYYY-MM-DD"),
              PayrollCalendarFirstPaymentDate: moment(FirstPaymentDate, "DD/MM/YYYY").format("YYYY-MM-DD"),
              PayrollCalendarActive: true
            }
          };

          taxRateService.saveCalender(objDetails).then(function (objDetails) {
            LoadingOverlay.hide();
            swal({title: "Success", text: "Pay Calendar saved successfully.", type: "success", showCancelButton: false, confirmButtonText: "Done"}).then(result => {
              if (result.value) {
                sideBarService.getCalender(initialBaseDataLoad, 0).then(function (dataReload) {
                  addVS1Data("TPayrollCalendars", JSON.stringify(dataReload)).then(function (datareturn) {
                    $("#closemodel").trigger("click");
                    LoadingOverlay.show();
                    // window.open("/payrollrules?active_key=calender", "_self");
                    ui.loadCalendars();
                  }).catch(function (err) {
                    $("#closemodel").trigger("click");
                    LoadingOverlay.show();
                    // window.open("/payrollrules?active_key=calender", "_self");
                    ui.loadCalendars();
                  });
                }).catch(function (err) {
                  $("#closemodel").trigger("click");
                  LoadingOverlay.show();
                  // window.open("/payrollrules?active_key=calender", "_self");
                  ui.loadCalendars();
                });
              } else if (result.dismiss === "cancel") {}
            });
          }).catch(function (err) {
            LoadingOverlay.hide();
            swal({title: "Oooops...", text: err, type: "error", showCancelButton: false, confirmButtonText: "ok"}).then(result => {
              if (result.value) {} else if (result.dismiss === "cancel") {}
            });
          });
        });
      }
    }

    $("#newPayPeriodModal").modal("show");
  },

  // "click .colDeleteCalenders": (e, ui) => {
  //
  //   e.stopPropagation();
  //   let targetID = $(e.target).closest("tr").find(".colCalenderID").text() || 0;  table row ID

  //   let calenderName = $(this).closest("tr").find(".colPayCalendarName").text() || "";

  //   $("#selectColDeleteLineID").val(targetID);
  //   $("#selectCalenderName").val(targetID);
  //   $("#deleteCalenderLineModal").modal("toggle");
  // }

  "click .colDeleteCalenders button": (e, ui) => {
    let taxRateService = new TaxRateService();
    let calenderid = $(e.currentTarget).closest("tr").attr("calendar-id");
    let calendername = $("#selectCalenderName").val() || 0;
    LoadingOverlay.show();

    let objDetails = {
      type: "TPayrollCalendars",
      fields: {
        Id: calenderid,
        PayrollCalendarActive: false
      }
    };

    if (calenderid) {
      taxRateService.saveCalender(objDetails).then(objDetails => {
        LoadingOverlay.hide();
        swal({title: "Success", text: "Calender Removed Successfully", type: "success", showCancelButton: false, confirmButtonText: "Done"}).then(result => {
          if (result.value) {
            $("#hidedeleteca").trigger("click");
            sideBarService.getCalender(initialBaseDataLoad, 0).then(dataReload => {
              addVS1Data("TPayrollCalendars", JSON.stringify(dataReload)).then(datareturn => {
                // $("#hidedeleteca").trigger("click");

                // window.open("/payrollrules?active_key=calender", "_self");
                ui.loadCalendars();
              }).catch(err => {
                LoadingOverlay.show();
                // window.open("/payrollrules?active_key=calender", "_self");
                ui.loadCalendars();
              });
            }).catch(err => {
              $("#hidedeleteca").trigger("click");
              LoadingOverlay.show();
              // window.open("/payrollrules?active_key=calender", "_self");
              ui.loadCalendars();
            });
          } else if (result.dismiss === "cancel") {}
        });
      }).catch(err => {
        swal({title: "Oooops...", text: err, type: "error", showCancelButton: false, confirmButtonText: "ok"}).then(result => {
          if (result.value) {} else if (result.dismiss === "cancel") {}
        });
        LoadingOverlay.hide();
      });
    } else {
      LoadingOverlay.hide();
      swal({title: "Oooops...", text: "Calender ID missing", type: "error", showCancelButton: false, confirmButtonText: "Try Again"}).then(result => {
        if (result.value) {} else if (result.dismiss === "cancel") {}
      });
    }
  },

  "click #tblPayCalendars tbody tr": (e, ui) => {
    const tr = $(e.currentTarget);
    const periods = ui.calendarPeriods.get();
    const selectPeriod = periods.find(p => p.ID);

    $(".paste-selected-pay-period-name-js").attr("calendar-id", selectPeriod.ID);
    $(".paste-selected-pay-period-name-js").val(`${selectPeriod.PayrollCalendarName} (${selectPeriod.PayrollCalendarPayPeriod})`);

    $(".paste-selected-pay-period-js").attr("calendar-id", selectPeriod.ID);
    $(".paste-selected-pay-period-js").val(selectPeriod.PayrollCalendarPayPeriod);

    $("#SelectPayRunModal").modal("hide");
  }
});

Template.SelectPayPeriod.helpers({
  calendarPeriods: () => {
    return Template.instance().calendarPeriods.get();
  },
  formatDate: date => GlobalFunctions.formatDate(date),
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
