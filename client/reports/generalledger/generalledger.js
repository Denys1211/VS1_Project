import { ReportService } from "../report-service";
import "jQuery.print/jQuery.print.js";
import { UtilityService } from "../../utility-service";
import LoadingOverlay from "../../LoadingOverlay";
import { TaxRateService } from "../../settings/settings-service";
import GlobalFunctions from "../../GlobalFunctions";
import moment from "moment";
import FxGlobalFunctions from "../../packages/currency/FxGlobalFunctions";
import Datehandler from "../../DateHandler";
import {Session} from 'meteor/session';
import { Template } from 'meteor/templating';
import './generalledger.html';

let defaultCurrencyCode = CountryAbbr; // global variable "AUD"


let reportService = new ReportService();
let utilityService = new UtilityService();
let taxRateService = new TaxRateService();

// Template.generalledger.inheritsHelpersFrom('vs1_report_template');
// Template.generalledger.inheritsEventsFrom('vs1_report_template');
// Template.generalledger.inheritsHooksFrom('vs1_report_template');

Template.generalledger.onCreated(() => {
  const templateObject = Template.instance();
  templateObject.displaysettings = new ReactiveVar([]);

  FxGlobalFunctions.initVars(templateObject);
  let reset_data = [
    { index: 0, label: '#', class:'colLineId', active: false, display: true, width: "10", calc: false},
    { index: 1, label: 'Account Name', class: 'colAccountName', active: true, display: true, width: "245", calc: false},
    { index: 2, label: 'Account No', class: 'colAccountNo', active: true, display: true, width: "105", calc: false},
    { index: 3, label: 'Date', class: 'colDate', active: true, display: true, width: "120", calc: false},
    { index: 4, label: 'Client Name', class: 'colClientName', active: true, display: true, width: "220", calc: false},
    { index: 5, label: 'Type', class: 'colType', active: true, display: true, width: "120", calc: false},
    { index: 6, label: 'Debits', class: 'colDebitsEx text-right', active: true, display: true, width: "130", calc: true},
    { index: 7, label: 'Credits', class: 'colCreditEx text-right', active: true, display: true, width: "130", calc: true},
    { index: 8, label: 'Amount', class: 'colAmountEx text-right', active: true, display: true, width: "130", calc: true},
  ]
  templateObject.displaysettings.set(reset_data);
  templateObject.getReportDataRecord = function(data) {
    console.log(data);
    var dataList = [];
    if(data!='') {
      dataList =  [
        data.ACCOUNTNAME || "",
        data.ACCOUNTNUMBER || "",
        moment(data.DATE).format('DD/MM/YYYY') || "",
        data["CLIENT NAME"] || "",
        data.TYPE || "",
        data.DEBITSEX || 0,
        data.CREDITSEX || 0,
        data.AMOUNTEX || 0,
      ];
    }else {
      dataList = [
        "", "", "",  "", "", 0, 0, 0,
      ]
    }
    return dataList;
  }
});
Template.generalledger.onRendered(() => {});
/*
Template.generalledger.onRendered(() => {
  const templateObject = Template.instance();
  LoadingOverlay.show();

  // await reportService.getBalanceSheetReport(dateAOsf) :

  // --------------------------------------------------------------------------------------------------
  templateObject.initDate = () => {
    Datehandler.initOneMonth();
  };
  templateObject.setDateAs = (dateTo = null) => {
    templateObject.dateAsAt.set((dateTo) ? moment(dateTo).format("DD/MM/YYYY") : moment().format("DD/MM/YYYY"))
  };
  templateObject.initDate();

  // let date = new Date();
  // templateObject.currentYear.set(date.getFullYear());
  // templateObject.nextYear.set(date.getFullYear() + 1);
  // let currentMonth = moment(date).format("DD/MM/YYYY");
  // templateObject.currentMonth.set(currentMonth);

  // templateObject.setDateAs(GlobalFunctions.convertYearMonthDay($('#dateFrom').val()));

  templateObject.getGeneralLedgerData = async function (dateFrom, dateTo, ignoreDate) {

    templateObject.setDateAs(dateTo);
    getVS1Data('TGeneralLedgerReport').then(function (dataObject) {
      if (dataObject.length == 0) {
        reportService.getGeneralLedgerDetailsData(dateFrom, dateTo, ignoreDate).then(async function (data) {
          await addVS1Data('TGeneralLedgerReport', JSON.stringify(data));
          templateObject.displayGeneralLedgerData(data);
        }).catch(function (err) {
        });
      } else {
        let data = JSON.parse(dataObject[0].data);
        templateObject.displayGeneralLedgerData(data);
      }
    }).catch(function (err) {
      reportService.getGeneralLedgerDetailsData(dateFrom, dateTo, ignoreDate).then(async function (data) {
        await addVS1Data('TGeneralLedgerReport', JSON.stringify(data));
        templateObject.displayGeneralLedgerData(data);
      }).catch(function (err) {

      });
    });
  }

  templateObject.getGeneralLedgerData(
      GlobalFunctions.convertYearMonthDay($('#dateFrom').val()),
      GlobalFunctions.convertYearMonthDay($('#dateTo').val()),
      false
  );
  templateObject.generateReportData = function(splashArrayBalanceSheetReport){
    //Xiao Jang fixed
    splashArrayBalanceSheetReport.sort(GlobalFunctions.sortFunction);

    let start = splashArrayBalanceSheetReport[0][0], credit = 0, debit = 0, total = 0, creditSum = 0, debitSum = 0, totalSum = 0;
    let T_AccountName = splashArrayBalanceSheetReport[0][0];
    let balanceSheetReport = [];
    let symDollar = '$';
    balanceSheetReport.push([
      GlobalFunctions.generateSpan(T_AccountName, "table-cells text-bold"),
      "",
      "",
      "",
      "",
      "",
      "",
      ""
    ]);
    for(let i = 0 ; i < splashArrayBalanceSheetReport.length ; i ++){
      if(start != splashArrayBalanceSheetReport[i][0]) {
        creditSum += (credit - 0), debitSum += (debit - 0), totalSum += (total - 0);
        start = splashArrayBalanceSheetReport[i][0];
        credit = credit >= 0 ? GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(credit), "table-cells text-bold", "text-right") : GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(credit), "text-danger text-bold", "text-right");
        debit = debit >= 0 ? GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(debit), "table-cells text-bold", "text-right") : GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(debit), "text-danger text-bold", "text-right");
        total = total >= 0 ? GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(total), "table-cells text-bold", "text-right") : GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(total), "text-danger text-bold", "text-right");
        balanceSheetReport.push([
          GlobalFunctions.generateSpan('Total' + T_AccountName, "table-cells text-bold"),
          "",
          "",
          "",
          "",
          credit,
          debit,
          total,
        ]);
        balanceSheetReport.push([
          GlobalFunctions.generateSpan(splashArrayBalanceSheetReport[i][0], "table-cells text-bold"),
          "",
          "",
          "",
          "",
          "",
          "",
          ""
        ]);

        credit = 0, debit = 0, total = 0;
      }
      T_AccountName = splashArrayBalanceSheetReport[i][0];
      splashArrayBalanceSheetReport[i][0] = "";
      let tmpDate = new Date(splashArrayBalanceSheetReport[i][2]);
      splashArrayBalanceSheetReport[i][2] = `${GlobalFunctions.convert2Digit(tmpDate.getDate())}/${GlobalFunctions.convert2Digit(tmpDate.getMonth() + 1)}/${tmpDate.getFullYear()}`;
      let redirectionItem = {Id: splashArrayBalanceSheetReport[i][8], type: splashArrayBalanceSheetReport[i][4]};
      splashArrayBalanceSheetReport[i][1] = GlobalFunctions.generateSpan(splashArrayBalanceSheetReport[i][1], "text-primary", GlobalFunctions.redirectionType(redirectionItem));
      splashArrayBalanceSheetReport[i][2] = GlobalFunctions.generateSpan(splashArrayBalanceSheetReport[i][2], "text-primary", GlobalFunctions.redirectionType(redirectionItem));
      splashArrayBalanceSheetReport[i][3] = GlobalFunctions.generateSpan(splashArrayBalanceSheetReport[i][3], "text-primary", GlobalFunctions.redirectionType(redirectionItem));
      splashArrayBalanceSheetReport[i][4] = GlobalFunctions.generateSpan(splashArrayBalanceSheetReport[i][4], "text-primary", GlobalFunctions.redirectionType(redirectionItem));
      let tmp;
      tmp = splashArrayBalanceSheetReport[i][5] - 0;
      credit += tmp; //credit
      splashArrayBalanceSheetReport[i][5] = (tmp >= 0) ? GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(tmp), "text-primary",  GlobalFunctions.redirectionType(redirectionItem)) : GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(tmp), "text-danger", GlobalFunctions.redirectionType(redirectionItem));

      tmp = splashArrayBalanceSheetReport[i][6] - 0;
      debit += tmp; //debit
      splashArrayBalanceSheetReport[i][6] = (tmp >= 0) ? GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(tmp), "text-primary", GlobalFunctions.redirectionType(redirectionItem)) : GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(tmp), "text-danger", GlobalFunctions.redirectionType(redirectionItem));

      tmp = splashArrayBalanceSheetReport[i][7] - 0;
      total += tmp; //total
      splashArrayBalanceSheetReport[i][7] = (tmp >= 0) ? GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(tmp), "text-primary", GlobalFunctions.redirectionType(redirectionItem)) : GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(tmp), "text-danger", GlobalFunctions.redirectionType(redirectionItem));
      splashArrayBalanceSheetReport[i].splice(8, 1);
      balanceSheetReport.push(splashArrayBalanceSheetReport[i]);
    }
    balanceSheetReport.push([
      GlobalFunctions.generateSpan(`Total ${T_AccountName}`, "table-cells text-bold"),
      "",
      "",
      "",
      "",
      credit >= 0 ? GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(credit), "table-cells text-bold", "text-right") : GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(credit), "text-danger text-bold", "text-right"),
      debit >= 0 ? GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(debit), "table-cells text-bold", "text-right") : GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(debit), "text-danger text-bold", "text-right"),
      total >= 0 ? GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(total), "table-cells text-bold", "text-right") : GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(total), "text-danger text-bold", "text-right"),
    ]);
    creditSum += (credit - 0), debitSum += (debit - 0);
    totalSum = 0;
    balanceSheetReport.push([
      GlobalFunctions.generateSpan(`Grand Total`, "table-cells text-bold"),
      "",
      "",
      "",
      "",
      creditSum >= 0 ? GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(creditSum), "table-cells text-bold", "text-right") : GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(creditSum), "text-danger text-bold", "text-right"),
      debitSum >= 0 ? GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(debitSum), "table-cells text-bold", "text-right") : GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(debitSum), "text-danger text-bold", "text-right"),
      totalSum >= 0 ? GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(totalSum), "table-cells text-bold", "text-right") : GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(totalSum), "text-danger text-bold", "text-right"),
    ]);
    return balanceSheetReport;
  }
  templateObject.displayGeneralLedgerData = async function (data) {
    var splashArrayBalanceSheetReport = new Array();
    let deleteFilter = false;
    if (data.Params.Search.replace(/\s/g, "") == "") {
      deleteFilter = true;
    } else {
      deleteFilter = false;
    };
    if(data.tgeneralledgerreport == undefined)  data.tgeneralledgerreport = [];
    for (let i = 0; i < data.tgeneralledgerreport.length; i++) {
      var dataList = [
        data.tgeneralledgerreport[i].ACCOUNTNAME || "",
        data.tgeneralledgerreport[i].ACCOUNTNUMBER || "",
        data.tgeneralledgerreport[i].DATE || "",
        data.tgeneralledgerreport[i]["CLIENT NAME"] || "",
        data.tgeneralledgerreport[i].TYPE || "",
        data.tgeneralledgerreport[i].DEBITSEX || "",
        data.tgeneralledgerreport[i].CREDITSEX || "",
        data.tgeneralledgerreport[i].AMOUNTEX || "",
        data.tgeneralledgerreport[i].PURCHASEORDERID || "",
      ];
      splashArrayBalanceSheetReport.push(dataList);
      // templateObject.transactiondatatablerecords.set(splashArrayBalanceSheetReport);
    }
    let balanceSheetReport = templateObject.generateReportData(splashArrayBalanceSheetReport);
    templateObject.transactiondatatablerecords.set(balanceSheetReport);
    if (templateObject.transactiondatatablerecords.get()) {
      setTimeout(function () {
        // MakeNegative();
      }, 100);
    }
    setTimeout(function () {
      $('#tblgeneralledger').DataTable({
        data: balanceSheetReport,
        searching: false,
        "bSort" : false,
        "sDom": "<'row'><'row'<'col-sm-12 col-md-6'f><'col-sm-12 col-md-6'l>r>t<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>B",
        columnDefs: [
          // {
          //   targets: 0,
          //   className: "colAccountID",
          // },
          {
            targets: 0,
            className: "colAccountName"
          },
          {
            targets: 1,
            className: "colAccountNo"
          },
          {
            targets: 2,
            className: "colDate",
          },
          {
            targets: 3,
            className: "colProductDescription",
          },
          {
            targets: 4,
            className: "colType",
          },
          {
            targets: 5,
            className: "colDebitsEx text-center0",
          },
          {
            targets: 6,
            className: "colCreditEx text-center0",
          },
          {
            targets: 7,
            className: "colAmountEx text-center0",
          },
        ],
        select: true,
        destroy: true,
        colReorder: true,
        pageLength: initialDatatableLoad,
        lengthMenu: [[initialDatatableLoad, -1], [initialDatatableLoad, "All"]],
        info: true,
        fixedColumns:   {
          heightMatch: 'none'
        },
        //responsive: true,
        "order": [],
        action: function () {
          $('#' + currenttablename).DataTable().ajax.reload();
        },
      }).on('page', function () {
        setTimeout(function () {
          // MakeNegative();
        }, 100);
      }).on('column-reorder', function () {

      }).on('length.dt', function (e, settings, len) {

        $(".fullScreenSpin").css("display", "inline-block");
        let dataLenght = settings._iDisplayLength;
        if (dataLenght == -1) {
          if (settings.fnRecordsDisplay() > initialDatatableLoad) {
            $(".fullScreenSpin").css("display", "none");
          } else {
            $(".fullScreenSpin").css("display", "none");
          }
        } else {
          $(".fullScreenSpin").css("display", "none");
        }
        setTimeout(function () {
          MakeNegative();
        }, 100);
      });
      $(".fullScreenSpin").css("display", "none");
    }, 0);

    $('div.dataTables_filter input').addClass('form-control form-control-sm');
  }


  // ------------------------------------------------------------------------------------------------------
  $("#tblgeneralledger tbody").on("click", "tr", function () {
    var listData = $(this).closest("tr").children('td').eq(8).text();
    var checkDeleted = $(this).closest("tr").find(".colStatus").text() || "";

    if (listData) {
      if (checkDeleted == "Deleted") {
        swal("You Cannot View This Transaction", "Because It Has Been Deleted", "info");
      } else {
        FlowRouter.go("/journalentrycard?id=" + listData);
      }
    }
  });


  LoadingOverlay.hide();
});
*/

Template.generalledger.events({
  "click td a": function (event) {
    let redirectid = $(event.target).closest("tr").attr("id");

    let transactiontype = $(event.target).closest("tr").attr("class");

    if (redirectid && transactiontype) {
      if (transactiontype === "Bill") {
        window.open("/billcard?id=" + redirectid, "_self");
      } else if (transactiontype === "PO") {
        window.open("/purchaseordercard?id=" + redirectid, "_self");
      } else if (transactiontype === "Credit") {
        window.open("/creditcard?id=" + redirectid, "_self");
      } else if (transactiontype === "Supplier Payment") {
        window.open("/supplierpaymentcard?id=" + redirectid, "_self");
      }
    }
  },
  "click [href='#noInfoFound']": function () {
    swal({
      title: 'Information',
      text: "No further information available on this column",
      type: 'warning',
      confirmButtonText: 'Ok'
    })
  },
});

Template.generalledger.helpers({
  displaysettings: ()=> {
    return Template.instance().displaysettings.get()
  },

  datahandler: () => {
    let templateObject = Template.instance();
    return function (data) {
      let returnvalue = templateObject.getReportDataRecord(data);
      return returnvalue
    }
  },

  apiFunction: function() {
    return reportService.getGeneralLedgerDetailsData;
  },

  listParams: function() {
    return ['limitCount', 'limitFrom', 'dateFrom', 'dateTo', 'ignoreDate']
  },

  service: function () {
    return reportService
  },

  searchFunction: function () {
    return reportService.getGeneralLedgerDataByKeyword;
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
