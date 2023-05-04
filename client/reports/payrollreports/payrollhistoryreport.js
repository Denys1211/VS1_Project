import { ReportService } from "../report-service";
import "jQuery.print/jQuery.print.js";
import { UtilityService } from "../../utility-service";
import LoadingOverlay from "../../LoadingOverlay";
import { TaxRateService } from "../../settings/settings-service";
import GlobalFunctions from "../../GlobalFunctions";
import CachedHttp from "../../lib/global/CachedHttp";
import erpObject from "../../lib/global/erp-objects";
import FxGlobalFunctions from "../../packages/currency/FxGlobalFunctions";
import Datehandler from "../../DateHandler";
import { Template } from 'meteor/templating';
import "./payrollhistoryreport.html";

let reportService = new ReportService();
let utilityService = new UtilityService();
let taxRateService = new TaxRateService();
let defaultCurrencyCode = CountryAbbr;

const currentDate = new Date();

Template.payrollhistoryreport.onCreated(() => {
  const templateObject = Template.instance();
  templateObject.dateAsAt = new ReactiveVar();
  templateObject.reportOptions = new ReactiveVar([]);
  templateObject.records = new ReactiveVar([]);
  templateObject.payrollhistoryth = new ReactiveVar([]);

  FxGlobalFunctions.initVars(templateObject);
});

Template.payrollhistoryreport.onRendered(() => {
  const templateObject = Template.instance();
  LoadingOverlay.show();

  let reset_data = [
    { index: 1, label: 'Employee', class: 'colLastName', active: true, display: true, width: "150" },
    { index: 2, label: 'Date', class: 'colFirstName', active: true, display: true, width: "150" },
    { index: 3, label: 'Wages', class: 'colGL text-right', active: true, display: true, width: "150" },
    { index: 4, label: 'Tax', class: 'colDatePaid text-right', active: true, display: true, width: "150" },
    { index: 5, label: 'Super', class: 'colGross text-right', active: true, display: true, width: "150" },
    { index: 6, label: 'Gross', class: 'colTax text-right', active: true, display: true, width: "150" },
    { index: 7, label: 'Net Pay', class: 'colWages text-right', active: true, display: true, width: "150" },
    // { index: 8, label: 'Commission', class: 'colCommission', active: true, display: true, width: "100" },
    // { index: 9, label: 'Deductions', class: 'colDeductions', active: true, display: true, width: "100" },
    // { index: 10, label: 'Allowances', class: 'colAllowances', active: true, display: true, width: "80" },
    // { index: 11, label: 'CDEP', class: 'colCDEP', active: true, display: true, width: "50" },
    // { index: 11, label: 'Sundries', class: 'colSundries', active: true, display: true, width: "80" },
    // { index: 12, label: 'Superannuation', class: 'colSuperannuation', active: true, display: true, width: "100" },
    // { index: 12, label: 'ClassName', class: 'colClassName', active: true, display: true, width: "80" },
    // { index: 13, label: 'PayPeriod', class: 'colPayPeriod', active: true, display: true, width: "80" },
    // { index: 14, label: 'PayNo', class: 'colPayNo', active: true, display: true, width: "50" },
    // { index: 15, label: 'Splits', class: 'colSplits', active: true, display: true, width: "50" },
    // { index: 16, label: 'Deleted', class: 'colDeleted', active: true, display: true, width: "60" },
    // { index: 17, label: 'Global Ref', class: 'colGlobalRef', active: false, display: true, width: "100" },
    // { index: 18, label: 'Employee Name', class: 'colEmployeeName', active: false, display: true, width: "100" },
    // { index: 19, label: 'Pay Date', class: 'PayDate', active: false, display: true, width: "80" },
    // { index: 20, label: 'Pay Periods', class: 'colPayPeriods', active: false, display: true, width: "100" },
    // { index: 21, label: 'Salary Sacrifice', class: 'colSalarySacrifice', active: false, display: true, width: "120" },
    // { index: 22, label: 'Workplacegiving', class: 'colWorkplacegiving', active: false, display: true, width: "120" },
    // { index: 23, label: 'Net Comb', class: 'colNetComb', active: false, display: true, width: "60" },
    // { index: 24, label: 'Net Only', class: 'colNetOnly', active: false, display: true, width: "60" },
    // { index: 25, label: 'Paid', class: 'colPaid', active: false, display: true, width: "50" },
    // { index: 26, label: 'Pay', class: 'colPay', active: false, display: true, width: "50" },
    // { index: 27, label: 'Test staff', class: 'colTeststaff', active: false, display: true, width: "70" },
    // { index: 28, label: 'Customer ID Tax', class: 'colCustomerIDTax', active: false, display: true, width: "120" },
    // { index: 29, label: 'PAYG Tax', class: 'colPaygTax', active: false, display: true, width: "100" },
    // { index: 30, label: 'BSB', class: 'colBSB', active: false, display: true, width: "50" },
    // { index: 31, label: 'BankAccNo', class: 'colBankAccNo', active: false, display: true, width: "80" },
    // { index: 32, label: 'Employee ID', class: 'colEmployeeID', active: false, display: true, width: "100" },
  ]
  templateObject.payrollhistoryth.set(reset_data);

  templateObject.initDate = () => {
    Datehandler.initOneMonth();
  };

  templateObject.setDateAs = ( dateFrom = null ) => {
    templateObject.dateAsAt.set( ( dateFrom )? moment(dateFrom).format("DD/MM/YYYY") : moment().format("DD/MM/YYYY") )
  };

  templateObject.initUploadedImage = () => {
    // let imageData = localStorage.getItem("Image");
    // let imageData;
    // getVS1Data("TVS1Image").then(function (dataObject) {
    //   imageData =JSON.parse(dataObject[0]).data;
    // });
    // if (imageData) {
    //   $("#uploadedImage").attr("src", imageData);
    //   $("#uploadedImage").attr("width", "50%");
    // }
  };
  // templateObject.setReportOptions = async function ( ignoreDate = false, formatDateFrom = new Date(),  formatDateTo = new Date() ) {
  //   let defaultOptions = templateObject.reportOptions.get();
  //   if (defaultOptions) {
  //     defaultOptions.fromDate = formatDateFrom;
  //     defaultOptions.toDate = formatDateTo;
  //     defaultOptions.ignoreDate = ignoreDate;
  //   } else {
  //     defaultOptions = {
  //       fromDate: moment().subtract(1, "months").format("YYYY-MM-DD"),
  //       toDate: moment().format("YYYY-MM-DD"),
  //       ignoreDate: true
  //     };
  //   }
  //   templateObject.dateAsAt.set(moment(defaultOptions.fromDate).format('DD/MM/YYYY'));
  //   $('.edtReportDates').attr('disabled', false)
  //   if( ignoreDate == true ){
  //     $('.edtReportDates').attr('disabled', true);
  //     templateObject.dateAsAt.set(moment().format('DD/MM/YYYY'));
  //   }
  //   $("#dateFrom").val(moment(defaultOptions.fromDate).format('DD/MM/YYYY'));
  //   $("#dateTo").val(moment(defaultOptions.toDate).format('DD/MM/YYYY'));
  //   await templateObject.reportOptions.set(defaultOptions);
  //   await templateObject.getPayHistory( defaultOptions.fromDate, defaultOptions.toDate, defaultOptions.ignoreDate );
  // };

  templateObject.getPayHistoryData= async (dateFrom, dateTo, ignoreDate = false) => {
    getVS1Data('TPayHistory').then(function (dataObject) {
      if (dataObject.length == 0) {
        templateObject.getPayHistory(dateFrom, dateTo, ignoreDate).then(async function (data) {
          await addVS1Data('TPayHistory', JSON.stringify(data));
          templateObject.displayPayHistoryData(data);
        }).catch(function (err) {

        });
      } else {
        let data = JSON.parse(dataObject[0].data);
        templateObject.displayPayHistoryData(data);
      }
    }).catch(function (err) {
      templateObject.getPayHistory(dateFrom, dateTo, ignoreDate).then(async function (data) {
        await addVS1Data('TPayHistory', JSON.stringify(data));
        templateObject.displayPayHistoryData(data);
      }).catch(function (err) {

      });
    });
  }
  templateObject.getPayHistory = async (dateFrom, dateTo, ignoreDate = false) => {
    LoadingOverlay.show();
    templateObject.setDateAs(dateFrom);
    let data = await CachedHttp.get(erpObject.TPayHistory, async () => {
      return await reportService.getPayHistory(dateFrom, dateTo, ignoreDate);
    }, {
      requestParams: {
        DateFrom: dateFrom,
        DateTo: dateTo,
        IgnoreDates: ignoreDate
      },
      useIndexDb: true,
      useLocalStorage: false,
      validate: (cachedResponse) => {
        if (cachedResponse.response.Params) {
          if (GlobalFunctions.isSameDay(cachedResponse.response.Params.DateFrom, dateFrom)
              && GlobalFunctions.isSameDay(cachedResponse.response.Params.DateTo, dateTo)
              && cachedResponse.response.Params.IgnoreDates == ignoreDate) {
            return true;
          }
          return false;
        }
        return false;
      }
    })
    return data.response;
  };
  templateObject.displayPayHistoryData = function(data){
    let paySlipReport = [];

    if( data.tpayhistory.length > 0 ){
      let employeeGroups = [];
      // employeeGroups = await objectGrouping(data.tpayhistory, "Employeeid");
      for (const item of data.tpayhistory) {

          let employeeExist = employeeGroups.filter((subitem) => {
              if( subitem.ID == item.fields.Employeeid ){
                subitem.SubAccounts.push(item)
                return subitem
              }
          });

          if( employeeExist.length == 0 ){

              employeeGroups.push({
                ID: item.fields.Employeeid,
                EmpName: item.fields.Empname,
                TotalWages: item.fields.Wages,
                TotalTax: item.fields.Tax,
                TotalSuperannuation: item.fields.Superannuation,
                TotalGross: item.fields.Gross,
                TotalNet: item.fields.Net,
                SubAccounts: [item]
              });
            }
      }

      paySlipReport = employeeGroups.filter((item) => {
          let TotalWages = 0;
          let TotalTax = 0;
          let TotalSuperannuation = 0;
          let TotalGross = 0;
          let TotalNet = 0;
          item.SubAccounts.map((subitem) => {
              TotalWages += subitem.fields.Wages,
              TotalTax += subitem.fields.Tax,
              TotalSuperannuation += subitem.fields.Superannuation,
              TotalGross += subitem.fields.Gross,
              TotalNet += subitem.fields.Net
          });
          item.TotalWages += TotalWages;
          item.TotalTax = TotalTax;
          item.TotalSuperannuation += TotalSuperannuation;
          item.TotalGross += TotalGross;
          item.TotalNet += TotalNet;
          return item;
      });

    }

    templateObject.records.set(paySlipReport);
    LoadingOverlay.hide();
  };


  templateObject.initDate();
  templateObject.initUploadedImage();
  templateObject.getPayHistoryData(
    GlobalFunctions.convertYearMonthDay($('#dateFrom').val()),
    GlobalFunctions.convertYearMonthDay($('#dateTo').val()),
    false
  );
  templateObject.setDateAs( GlobalFunctions.convertYearMonthDay($('#dateFrom').val()) )
  LoadingOverlay.hide();
});

Template.payrollhistoryreport.events({
  'click .chkDatatable': function(event) {
    let columnDataValue = $(event.target).closest("div").find(".divcolumn").attr('valueupdate');
    if ($(event.target).is(':checked')) {
      $('.'+columnDataValue).addClass('showColumn');
      $('.'+columnDataValue).removeClass('hiddenColumn');
    } else {
      $('.'+columnDataValue).addClass('hiddenColumn');
      $('.'+columnDataValue).removeClass('showColumn');
    }
},

  'click .btnOpenReportSettings': () => {
    let templateObject = Template.instance();
    // let currenttranstablename = templateObject.data.tablename||";
    $(`thead tr th`).each(function (index) {
      var $tblrow = $(this);
      var colWidth = $tblrow.width() || 0;
      var colthClass = $tblrow.attr('data-class') || "";
      $('.rngRange' + colthClass).val(colWidth);
    });
    $('.' + templateObject.data.tablename + '_Modal').modal('toggle');
  },
  'change .custom-range': async function (event) {
    //   const tableHandler = new TableHandler();
    let range = $(event.target).val() || 0;
    let colClassName = $(event.target).attr("valueclass");
    await $('.' + colClassName).css('width', range);
    //   await $('.colAccountTree').css('width', range);
    $('.dataTable').resizable();
  },
  "click .btnRefresh": function () {
    LoadingOverlay.hide();
    localStorage.setItem("VS1PayrollHistory_Report", "");
    Meteor._reload.reload();
  },
  "click .btnExportReport": function () {
    LoadingOverlay.hide();
    let utilityService = new UtilityService();
    let templateObject = Template.instance();
    var dateFrom = new Date($("#dateFrom").datepicker("getDate"));
    var dateTo = new Date($("#dateTo").datepicker("getDate"));

    let formatDateFrom =
      dateFrom.getFullYear() +
      "-" +
      (dateFrom.getMonth() + 1) +
      "-" +
      dateFrom.getDate();
    let formatDateTo =
      dateTo.getFullYear() +
      "-" +
      (dateTo.getMonth() + 1) +
      "-" +
      dateTo.getDate();

    const filename = loggedCompany + "- Payroll History Report" + ".csv";
    utilityService.exportReportToCsvTable("tableExport", filename, "csv");
    let rows = [];
  },
  "click .btnPrintReport": function (event) {
    playPrintAudio();
    setTimeout(function(){
    let values = [];
    let basedOnTypeStorages = Object.keys(localStorage);
    basedOnTypeStorages = basedOnTypeStorages.filter((storage) => {
      let employeeId = storage.split("_")[2];
      return (
        storage.includes("BasedOnType_") &&
        employeeId == localStorage.getItem("mySessionEmployeeLoggedID")
      );
    });
    let i = basedOnTypeStorages.length;
    if (i > 0) {
      while (i--) {
        values.push(localStorage.getItem(basedOnTypeStorages[i]));
      }
    }
    values.forEach((value) => {
      let reportData = JSON.parse(value);
      reportData.HostURL = $(location).attr("protocal")
        ? $(location).attr("protocal") + "://" + $(location).attr("hostname")
        : "http://" + $(location).attr("hostname");
      if (reportData.BasedOnType.includes("P")) {
        if (reportData.FormID == 1) {
          let formIds = reportData.FormIDs.split(",");
          if (formIds.includes("225")) {
            reportData.FormID = 225;
            Meteor.call("sendNormalEmail", reportData);
          }
        } else {
          if (reportData.FormID == 225)
            Meteor.call("sendNormalEmail", reportData);
        }
      }
    });

    document.title = "Payroll History Report";
    $(".printReport").print({
      title: "Payroll History Report | " + loggedCompany,
      noPrintSelector: ".addSummaryEditor",
    });
  }, delayTimeAfterSound);
  },
  "keyup #myInputSearch": function (event) {
    $(".table tbody tr").show();
    let searchItem = $(event.target).val();
    if (searchItem != "") {
      var value = searchItem.toLowerCase();
      $(".table tbody tr").each(function () {
        var found = "false";
        $(this).each(function () {
          if ($(this).text().toLowerCase().indexOf(value.toLowerCase()) >= 0) {
            found = "true";
          }
        });
        if (found == "true") {
          $(this).show();
        } else {
          $(this).hide();
        }
      });
    } else {
      $(".table tbody tr").show();
    }
  },
  "blur #myInputSearch": function (event) {
    $(".table tbody tr").show();
    let searchItem = $(event.target).val();
    if (searchItem != "") {
      var value = searchItem.toLowerCase();
      $(".table tbody tr").each(function () {
        var found = "false";
        $(this).each(function () {
          if ($(this).text().toLowerCase().indexOf(value.toLowerCase()) >= 0) {
            found = "true";
          }
        });
        if (found == "true") {
          $(this).show();
        } else {
          $(this).hide();
        }
      });
    } else {
      $(".table tbody tr").show();
    }
  },
  "click #ignoreDate":  (e, templateObject) => {
    $("#dateFrom").attr("readonly", true);
    $("#dateTo").attr("readonly", true);
    clearData("TPayHistory").then(function () {
      templateObject.getPayHistoryData(
          null,
          null,
          true
      )
    })
  },
  "change #dateTo, change #dateFrom": (e) => {
    let templateObject = Template.instance();
    localStorage.setItem("VS1PayrollHistory_Report", "");
    clearData("TPayHistory").then(function () {
      templateObject.getPayHistoryData(
          GlobalFunctions.convertYearMonthDay($('#dateFrom').val()),
          GlobalFunctions.convertYearMonthDay($('#dateTo').val()),
          false
      )
    })

  },
  ...Datehandler.getDateRangeEvents(),
    // CURRENCY MODULE //
    ...FxGlobalFunctions.getEvents(),
    "click .currency-modal-save": (e) => {
      //$(e.currentTarget).parentsUntil(".modal").modal("hide");
      LoadingOverlay.show();

      let templateObject = Template.instance();

      // Get all currency list
      let _currencyList = templateObject.currencyList.get();

      // Get all selected currencies
      const currencySelected = $(".currency-selector-js:checked");
      let _currencySelectedList = [];
      if (currencySelected.length > 0) {
        $.each(currencySelected, (index, e) => {
          const sellRate = $(e).attr("sell-rate");
          const buyRate = $(e).attr("buy-rate");
          const currencyCode = $(e).attr("currency");
          const currencyId = $(e).attr("currency-id");
          let _currency = _currencyList.find((c) => c.id == currencyId);
          _currency.active = true;
          _currencySelectedList.push(_currency);
        });
      } else {
        let _currency = _currencyList.find((c) => c.code == defaultCurrencyCode);
        _currency.active = true;
        _currencySelectedList.push(_currency);
      }

      _currencyList.forEach((value, index) => {
        if (_currencySelectedList.some((c) => c.id == _currencyList[index].id)) {
          _currencyList[index].active = _currencySelectedList.find(
            (c) => c.id == _currencyList[index].id
          ).active;
        } else {
          _currencyList[index].active = false;
        }
      });

      _currencyList = _currencyList.sort((a, b) => {
        if (a.code == defaultCurrencyCode) {
          return -1;
        }
        return 1;
      });

      // templateObject.activeCurrencyList.set(_activeCurrencyList);
      templateObject.currencyList.set(_currencyList);

      LoadingOverlay.hide();
    },
    "click [href='#noInfoFound']": function () {
      swal({
          title: 'Information',
          text: "No further information available on this column",
          type: 'warning',
          confirmButtonText: 'Ok'
        })
    }
});

Template.payrollhistoryreport.helpers({
  payrollhistoryth: () => {
    return Template.instance().payrollhistoryth.get();
  },
  dateAsAt: () => {
    return Template.instance().dateAsAt.get() || "-";
  },
  records: () => {
    return Template.instance().records.get();
  },
  redirectionType(item) {
      return '/employeescard?id=' + item.fields.Employeeid + '&tab-3';
  },
    formatPrice( amount ){
        let utilityService = new UtilityService();
        if( isNaN( amount ) ){
            amount = ( amount === undefined || amount === null || amount.length === 0 ) ? 0 : amount;
            amount = ( amount )? Number(amount.replace(/[^0-9.-]+/g,"")): 0;
        }
        return utilityService.modifynegativeCurrencyFormat(amount)|| 0.00;
    },
    formatDate: ( date ) => {
        return ( date )? moment(date).format("DD/MM/YYYY") : '';
    },

  // FX Module //
  convertAmount: (amount, currencyData) => {
    let currencyList = Template.instance().tcurrencyratehistory.get(); // Get tCurrencyHistory

    if(isNaN(amount)) {
      if (!amount || amount.trim() == "") {
        return "";
      }
      amount = utilityService.convertSubstringParseFloat(amount); // This will remove all currency symbol
    }
    // if (currencyData.code == defaultCurrencyCode) {
    //   // default currency
    //   return amount;
    // }


    // Lets remove the minus character
    const isMinus = amount < 0;
    if (isMinus == true) amount = amount * -1; // make it positive for now

    // // get default currency symbol
    // let _defaultCurrency = currencyList.filter(
    //   (a) => a.Code == defaultCurrencyCode
    // )[0];

    // amount = amount.replace(_defaultCurrency.symbol, "");


    // amount =
    //   isNaN(amount) == true
    //     ? parseFloat(amount.substring(1))
    //     : parseFloat(amount);



    // Get the selected date
    let dateTo = $("#dateTo").val();
    const day = dateTo.split("/")[0];
    const m = dateTo.split("/")[1];
    const y = dateTo.split("/")[2];
    dateTo = new Date(y, m, day);
    dateTo.setMonth(dateTo.getMonth() - 1); // remove one month (because we added one before)


    // Filter by currency code
    currencyList = currencyList.filter((a) => a.Code == currencyData.code);

    // Sort by the closest date
    currencyList = currencyList.sort((a, b) => {
      a = GlobalFunctions.timestampToDate(a.MsTimeStamp);
      a.setHours(0);
      a.setMinutes(0);
      a.setSeconds(0);

      b = GlobalFunctions.timestampToDate(b.MsTimeStamp);
      b.setHours(0);
      b.setMinutes(0);
      b.setSeconds(0);

      var distancea = Math.abs(dateTo - a);
      var distanceb = Math.abs(dateTo - b);
      return distancea - distanceb; // sort a before b when the distance is smaller

      // const adate= new Date(a.MsTimeStamp);
      // const bdate = new Date(b.MsTimeStamp);

      // if(adate < bdate) {
      //   return 1;
      // }
      // return -1;
    });

    const [firstElem] = currencyList; // Get the firest element of the array which is the closest to that date



    let rate = currencyData.code == defaultCurrencyCode ? 1 : firstElem.BuyRate; // Must used from tcurrecyhistory




    amount = parseFloat(amount * rate); // Multiply by the rate
    amount = Number(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }); // Add commas

    let convertedAmount =
      isMinus == true
        ? `- ${currencyData.symbol} ${amount}`
        : `${currencyData.symbol} ${amount}`;


    return convertedAmount;
  },
  count: (array) => {
    return array.length;
  },
  countActive: (array) => {
    if (array.length == 0) {
      return 0;
    }
    let activeArray = array.filter((c) => c.active == true);
    return activeArray.length;
  },
  currencyList: () => {
    return Template.instance().currencyList.get();
  },
  isNegativeAmount(amount) {
    if (Math.sign(amount) === -1) {

      return true;
    }
    return false;
  },
  isOnlyDefaultActive() {
    const array = Template.instance().currencyList.get();
    if (array.length == 0) {
      return false;
    }
    let activeArray = array.filter((c) => c.active == true);

    if (activeArray.length == 1) {

      if (activeArray[0].code == defaultCurrencyCode) {
        return !true;
      } else {
        return !false;
      }
    } else {
      return !false;
    }
  },
  isCurrencyListActive() {
    const array = Template.instance().currencyList.get();
    let activeArray = array.filter((c) => c.active == true);

    return activeArray.length > 0;
  },
  isObject(variable) {
    return typeof variable === "object" && variable !== null;
  },
  currency: () => {
    return Currency;
  },
});

Template.registerHelper("equals", function (a, b) {
  return a === b;
});

Template.registerHelper("notEquals", function (a, b) {
  return a != b;
});

Template.registerHelper("containsequals", function (a, b) {
  return a.indexOf(b) >= 0;
});
