import { ReportService } from "../report-service";
import "jQuery.print/jQuery.print.js";
import { UtilityService } from "../../utility-service";
import { TaxRateService } from "../../settings/settings-service";
import LoadingOverlay from "../../LoadingOverlay";
import GlobalFunctions from "../../GlobalFunctions";
import CachedHttp from "../../lib/global/CachedHttp";
import erpObject from "../../lib/global/erp-objects";
import Datehandler from "../../DateHandler";
import FxGlobalFunctions from "../../packages/currency/FxGlobalFunctions";
import { template } from "lodash";
import {Session} from 'meteor/session';
import { Template } from 'meteor/templating';
import './trialbalance.html';

let _ = require('lodash');
let defaultCurrencyCode = CountryAbbr; // global variable "AUD"

let reportService = new ReportService();
let utilityService = new UtilityService();
let taxRateService = new TaxRateService();
const currentDate = new Date();

Template.trialbalance.inheritsHelpersFrom('vs1_report_template');
Template.trialbalance.onCreated(() => {
  const templateObject = Template.instance();
  templateObject.transactiondatatablerecords = new ReactiveVar([]);
  templateObject.grandrecords = new ReactiveVar();
  templateObject.dateAsAt = new ReactiveVar();
  templateObject.deptrecords = new ReactiveVar();
  templateObject.trialbalanceth = new ReactiveVar([]);

  FxGlobalFunctions.initVars(templateObject);
  templateObject.reportOptions = new ReactiveVar([]);
});

Template.trialbalance.onRendered(() => {
  const templateObject = Template.instance();
  LoadingOverlay.show();

  templateObject.init_reset_data = function () {
    let reset_data = [];
    reset_data = [
      // { index: 1, label: 'ID', class:'colID', active: false, display: true, width: "50" },
      { index: 1, label: 'Account Name', class:'colAccountName', active: true, display: true, width: "41" },
      { index: 2, label: 'Account No', class:'colAccountNo', active: true, display: true, width: "15" },
      { index: 3, label: 'Account', class:'colAccount', active: true, display: true, width: "15" },
      { index: 4, label: 'Credits (Ex)', class:'colCreditsEx text-center0', active: true, display: true, width: "15" },
      { index: 5, label: 'Debits (Ex)', class:'colDebitsEx text-center0', active: true, display: true, width: "14" },
      // { index: 4, label: 'Account Name Only', class:'colAccountNameOnly', active: false, display: true, width: "200" },
      // { index: 7, label: 'Credits (Inc)', class:'colCreditsInc', active: false, display: true, width: "120" },
      // { index: 9, label: 'Debits (Inc)', class:'colDebitsInc', active: false, display: true, width: "120" },
      // { index: 11, label: 'Sort Order', class:'colSortOrder', active: false, display: true, width: "80" },
      //   { index: 12, label: 'Trans ID', class:'colTransID', active: false, display: true, width: "80" },
      //   { index: 10, label: 'Sort ID', class:'colSortID', active: false, display: true, width: "80" },
    ];
    templateObject.trialbalanceth.set(reset_data);
  }
  templateObject.init_reset_data();

  // await reportService.getBalanceSheetReport(dateAOsf) :

  // --------------------------------------------------------------------------------------------------
  templateObject.initDate = () => {
    Datehandler.initOneMonth();
  };
  templateObject.setDateAs = (dateFrom = null) => {
    templateObject.dateAsAt.set((dateFrom) ? moment(dateFrom).format("DD/MM/YYYY") : moment().format("DD/MM/YYYY"))
  };
  templateObject.initDate();

  // let date = new Date();
  // templateObject.currentYear.set(date.getFullYear());
  // templateObject.nextYear.set(date.getFullYear() + 1);
  // let currentMonth = moment(date).format("DD/MM/YYYY");
  // templateObject.currentMonth.set(currentMonth);

  // templateObject.setDateAs(GlobalFunctions.convertYearMonthDay($('#dateFrom').val()));

  templateObject.getTrialBalanceData = async function (dateFrom, dateTo, ignoreDate) {

    templateObject.setDateAs(dateTo);
    getVS1Data('TTrialBalanceReport').then(function (dataObject) {
      if (dataObject.length == 0) {
        reportService.getTrialBalanceDetailsData(dateFrom, dateTo, ignoreDate).then(async function (data) {
          await addVS1Data('TTrialBalanceReport', JSON.stringify(data));
          templateObject.displayTrialBalanceData(data);
        }).catch(function (err) {
        });
      } else {
        let data = JSON.parse(dataObject[0].data);
        templateObject.displayTrialBalanceData(data);
      }
    }).catch(function (err) {
      reportService.getTrialBalanceDetailsData(dateFrom, dateTo, ignoreDate).then(async function (data) {
        await addVS1Data('TTrialBalanceReport', JSON.stringify(data));
        templateObject.displayTrialBalanceData(data);
      }).catch(function (err) {

      });
    });
  }

  templateObject.getTrialBalanceData(
      GlobalFunctions.convertYearMonthDay($('#dateFrom').val()),
      GlobalFunctions.convertYearMonthDay($('#dateTo').val()),
      false
  );
  templateObject.displayTrialBalanceData = async function (data) {
    var splashArrayTrialBalanceReport = new Array();
    let deleteFilter = false;
    if (data.Params.Search.replace(/\s/g, "") == "") {
      deleteFilter = true;
    } else {
      deleteFilter = false;
    };

    for (let i = 0; i < data.ttrialbalancereport.length; i++) {
      var dataList = [
        // data.ttrialbalancereport[i].ID || "",
        data.ttrialbalancereport[i].AccountName || "",
        data.ttrialbalancereport[i].AccountNumber || "",
        data.ttrialbalancereport[i].Account || "",
        // data.ttrialbalancereport[i].AccountNameOnly || "",
        data.ttrialbalancereport[i].CreditsEx || "",
        // data.ttrialbalancereport[i].CreditsInc || "",
        data.ttrialbalancereport[i].DebitsEx || "",
        // data.ttrialbalancereport[i].DebitsInc || "",
        // data.ttrialbalancereport[i].SortID || "",
        // data.ttrialbalancereport[i].SortOrder || "",
        // data.ttrialbalancereport[i].TransID || "",
      ];
      splashArrayTrialBalanceReport.push(dataList);
    }


    let start = splashArrayTrialBalanceReport[0][0], credit = 0, debit = 0, creditSum = 0, debitSum = 0;
    let T_AccountName = splashArrayTrialBalanceReport[0][0];
    let trialBalanceReport = [];
    let symDollar = '$';
    trialBalanceReport.push([
        GlobalFunctions.generateSpan(T_AccountName, "table-cells text-bold"),
      "",
      "",
      "",
      ""
    ]);

    for(let i = 0 ; i < splashArrayTrialBalanceReport.length ; i ++){
      if(start != splashArrayTrialBalanceReport[i][0]) {
        creditSum += (credit - 0), debitSum += (debit - 0);
        start = splashArrayTrialBalanceReport[i][0];
        credit = credit >= 0 ? GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(credit), "table-cells text-lbold", "text-right") : GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(credit), "table-danger text-bold", "text-right");
        debit = debit >= 0 ? GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(debit), "table-cells text-lbold", "text-right") : GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(debit), "table-danger text-bold", "text-right");
        trialBalanceReport.push([
          GlobalFunctions.generateSpan(`Total ${T_AccountName}`, "table-cells text-lbold"),
          "",
          "",
          credit,
          debit,
        ]);
        trialBalanceReport.push([
          GlobalFunctions.generateSpan(splashArrayTrialBalanceReport[i][0], "table-cells text-bold"),
          "",
          "",
          "",
          ""
        ]);
        credit = 0, debit = 0;
      }
      T_AccountName = splashArrayTrialBalanceReport[i][0];
      splashArrayTrialBalanceReport[i][0] = "";
      splashArrayTrialBalanceReport[i][1] = GlobalFunctions.generateSpan(splashArrayTrialBalanceReport[i][1], "text-primary");
      splashArrayTrialBalanceReport[i][2] = GlobalFunctions.generateSpan(splashArrayTrialBalanceReport[i][2], "text-primary");

      let tmp;
      tmp = splashArrayTrialBalanceReport[i][3] - 0;
      credit += tmp;
      splashArrayTrialBalanceReport[i][3] = (tmp >= 0) ? GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(tmp), "text-primary", "text-right") : GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(tmp), "text-danger", "text-right");

      tmp = splashArrayTrialBalanceReport[i][4] - 0;
      debit += tmp;
      splashArrayTrialBalanceReport[i][4] = (tmp >= 0) ? GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(tmp), "text-primary", "text-right") : GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(tmp), "text-danger", "text-right");
      trialBalanceReport.push(splashArrayTrialBalanceReport[i]);
    }
    trialBalanceReport.push([
      GlobalFunctions.generateSpan(`Total ${T_AccountName}`, "table-cells text-bold"),
      "",
      "",
      credit >= 0 ? GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(credit), "table-cells text-bold", "text-right") : GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(credit), "table-danger text-bold", "text-right"),
      debit >= 0 ? GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(debit), "table-cells text-bold", "text-right") : GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(debit), "table-danger text-bold", "text-right"),
    ]);
    creditSum += (credit - 0), debitSum += (debit - 0);
    trialBalanceReport.push([
      GlobalFunctions.generateSpan(`Grand Total`, "table-cells text-bold"),
      "",
      "",
      creditSum >= 0 ? GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(creditSum), "table-cells text-bold", "text-right") : GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(creditSum), "table-danger text-bold", "text-right"),
      debitSum >= 0 ? GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(debitSum), "table-cells text-bold", "text-right") : GlobalFunctions.generateSpan(GlobalFunctions.showCurrency(debitSum), "table-danger text-bold", "text-right"),
    ]);
    templateObject.transactiondatatablerecords.set(trialBalanceReport);
    setTimeout(function () {
      $('#trialbalance').DataTable({
        data: trialBalanceReport,
        searching: false,
        "bSort" : false,
        "sDom": "<'row'><'row'<'col-sm-12 col-md-6'f><'col-sm-12 col-md-6'l>r>t<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>B",
        columnDefs: [
          {
            targets: 0,
            className: "colAccountName",
          },
          {
            targets: 1,
            className: "colAccountNo",
          },
          {
            targets: 2,
            className: "colAccount"
          },
          {
            targets: 3,
            className: "colCreditsEx text-center0"
          },
          {
            targets: 4,
            className: "colDebitsEx text-center0",
          },
          // {
          //   targets: 5,
          //   className: "colCreditsEx",
          // },
          // {
          //   targets: 6,
          //   className: "colCreditsInc",
          // },
          // {
          //   targets: 7,
          //   className: "colDebitsEx",
          // },
          // {
          //   targets: 8,
          //   className: "colDebitsInc",
          // },
          // {
          //   targets: 9,
          //   className: "colSortID hiddenColumn",
          // },
          // {
          //   targets: 10,
          //   className: "colSortOrder hiddenColumn",
          // },
          // {
          //   targets: 11,
          //   className: "colTransID hiddenColumn",
          // },
        ],
        select: true,
        destroy: true,
        colReorder: true,
        pageLength: initialDatatableLoad,
        lengthMenu: [[initialDatatableLoad, -1], [initialDatatableLoad, "All"]],
        info: true,
        // responsive: true,
        // "order": [[1, "asc"]],
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
  // $("#tblgeneralledger tbody").on("click", "tr", function () {
  //   var listData = $(this).closest("tr").children('td').eq(8).text();
  //   var checkDeleted = $(this).closest("tr").find(".colStatus").text() || "";

  //   if (listData) {
  //     if (checkDeleted == "Deleted") {
  //       swal("You Cannot View This Transaction", "Because It Has Been Deleted", "info");
  //     } else {
  //       FlowRouter.go("/journalentrycard?id=" + listData);
  //     }
  //   }
  // });


  LoadingOverlay.hide();
});

// Template.trialbalance.onRendered(() => {
//   LoadingOverlay.show();
//   const templateObject = Template.instance();

//   let reset_data = [
//     { index: 1, label: 'Account Name', class:'colAccountName', active: true, display: true, width: "250" },
//     { index: 2, label: 'Account Number', class:'colAccountNo', active: true, display: true, width: "150" },
//     { index: 3, label: 'Account', class:'colAccount', active: true, display: true, width: "150" },
//     { index: 4, label: 'Credits (Ex)', class:'colCreditsEx', active: true, display: true, width: "120" },
//     { index: 5, label: 'Credits (Inc)', class:'colCreditsInc', active: true, display: true, width: "120" },
//     { index: 6, label: 'Debits (Ex)', class:'colDebitsEx', active: true, display: true, width: "120" },
//     { index: 7, label: 'Debits (Inc)', class:'colDebitsInc', active: true, display: true, width: "120" },
//     { index: 8, label: 'Account Name Only', class:'colAccountNameOnly', active: false, display: true, width: "150" },
//     { index: 9, label: 'TransID', class:'colTransID', active: false, display: true, width: "80" },
//   ]
//   templateObject.trialbalanceth.set(reset_data);
//   templateObject.initDate = () => {
//     Datehandler.initOneMonth();

//   };

//   templateObject.initDate();

//   templateObject.setDateAs = ( dateFrom = null ) => {
//     templateObject.dateAsAt.set( ( dateFrom )? moment(dateFrom).format("DD/MM/YYYY") : moment().format("DD/MM/YYYY") )
//   };


//   // let salesOrderTable;
//   // var splashArray = new Array();
//   // var today = moment().format("DD/MM/YYYY");
//   // var currentDate = new Date();
//   // var begunDate = moment(currentDate).format("DD/MM/YYYY");
//   // let fromDateMonth = currentDate.getMonth() + 1;
//   // let fromDateDay = currentDate.getDate();
//   // if (currentDate.getMonth() + 1 < 10) {
//   //   fromDateMonth = "0" + (currentDate.getMonth() + 1);
//   // }

//   // templateObject.initUploadedImage = () => {
//   //   let imageData = localStorage.getItem("Image");
//   //   if (imageData) {
//   //     $("#uploadedImage").attr("src", imageData);
//   //     $("#uploadedImage").attr("width", "50%");
//   //   }
//   // };
//   // let imageData = localStorage.getItem("Image");
//   // if (imageData) {
//   //   $("#uploadedImage").attr("src", imageData);
//   //   $("#uploadedImage").attr("width", "50%");
//   // }

//   // if (currentDate.getDate() < 10) {
//   //   fromDateDay = "0" + currentDate.getDate();
//   // }
//   // // let getDateFrom = currentDate2.getFullYear() + "-" + (currentDate2.getMonth()) + "-" + ;
//   // var fromDate =
//   //   fromDateDay + "/" + fromDateMonth + "/" + currentDate.getFullYear();
//   // templateObject.dateAsAt.set(begunDate);
//   // const dataTableList = [];
//   // const deptrecords = [];
//   // $("#date-input,#dateTo,#dateFrom").datepicker({
//   //   showOn: "button",
//   //   buttonText: "Show Date",
//   //   buttonImageOnly: true,
//   //   buttonImage: "/img/imgCal2.png",
//   //   dateFormat: "dd/mm/yy",
//   //   showOtherMonths: true,
//   //   selectOtherMonths: true,
//   //   changeMonth: true,
//   //   changeYear: true,
//   //   yearRange: "-90:+10",
//   //   onChangeMonthYear: function (year, month, inst) {
//   //     // Set date to picker
//   //     $(this).datepicker(
//   //       "setDate",
//   //       new Date(year, inst.selectedMonth, inst.selectedDay)
//   //     );
//   //     // Hide (close) the picker
//   //     // $(this).datepicker('hide');
//   //     // // Change ttrigger the on change function
//   //     // $(this).trigger('change');
//   //   },
//   // });

//   // $("#dateFrom").val(fromDate);
//   // $("#dateTo").val(begunDate);
//   templateObject.setReportOptions = async function ( ignoreDate = true, formatDateFrom = new Date(),  formatDateTo = new Date() ) {
//     let defaultOptions = templateObject.reportOptions.get();
//     if (defaultOptions) {
//       defaultOptions.fromDate = formatDateFrom;
//       defaultOptions.toDate = formatDateTo;
//       defaultOptions.ignoreDate = ignoreDate;
//     } else {
//       defaultOptions = {
//         fromDate: moment().subtract(1, "months").format("YYYY-MM-DD"),
//         toDate: moment().format("YYYY-MM-DD"),
//         ignoreDate: true
//       };
//     }
//     templateObject.dateAsAt.set(moment(defaultOptions.fromDate).format('DD/MM/YYYY'));
//     $('.edtReportDates').attr('disabled', false)
//     if( ignoreDate == true ){
//       $('.edtReportDates').attr('disabled', true);
//       templateObject.dateAsAt.set("Current Date");
//     }
//     $("#dateFrom").val(moment(defaultOptions.fromDate).format('DD/MM/YYYY'));
//     $("#dateTo").val(moment(defaultOptions.toDate).format('DD/MM/YYYY'));
//     await templateObject.reportOptions.set(defaultOptions);
//     await templateObject.getTrialBalanceReports(defaultOptions.fromDate, defaultOptions.toDate, defaultOptions.ignoreDate);
//   };
//   // templateObject.setReportOptions();


//   /**
//    * @deprecated since 23 september 2022
//    * use loadReport instead
//    */
//   templateObject.getTrialBalanceReports = function (
//     dateFrom,
//     dateTo,
//     ignoreDate
//   ) {
//     if (!localStorage.getItem("VS1TrialBalance_Report")) {
//       reportService
//         .getTrialBalanceDetailsData(dateFrom, dateTo, ignoreDate)
//         .then(function (data) {
//           let totalRecord = [];
//           let grandtotalRecord = [];

//           if (data.ttrialbalancereport.length) {
//             localStorage.setItem(
//               "VS1TrialBalance_Report",
//               JSON.stringify(data) || ""
//             );
//             let records = [];
//             let allRecords = [];
//             let current = [];

//             let totalNetAssets = 0;
//             let GrandTotalLiability = 0;
//             let GrandTotalAsset = 0;
//             let incArr = [];
//             let cogsArr = [];
//             let expArr = [];
//             let accountData = data.ttrialbalancereport;
//             let accountType = "";

//             for (let i = 0; i < accountData.length; i++) {
//               let recordObj = {};
//               recordObj.Id = data.ttrialbalancereport[i].TransID;
//               recordObj.type = data.ttrialbalancereport[i].Account;
//               recordObj.AccountName = data.ttrialbalancereport[i].AccountName;
//               recordObj.dataArr = [
//                 "",
//                 data.ttrialbalancereport[i].AccountNumber,
//                 data.ttrialbalancereport[i].Account,
//                 utilityService.modifynegativeCurrencyFormat(
//                   data.ttrialbalancereport[i].CreditsEx
//                 ) || "-",
//                 utilityService.modifynegativeCurrencyFormat(
//                   data.ttrialbalancereport[i].DebitsEx
//                 ) || "-",
//               ];

//               records.push(recordObj);
//             }
//             records = _.sortBy(records, "AccountName");
//             records = _.groupBy(records, "AccountName");

//             for (let key in records) {
//               let obj = [{ key: key }, { data: records[key] }];
//               allRecords.push(obj);
//             }

//             let iterator = 0;
//             for (let i = 0; i < allRecords.length; i++) {
//               let amountduetotal = 0;
//               let Currenttotal = 0;
//               let creditEx = 0;
//               let debitEx = 0;
//               let twoMonth = 0;
//               let threeMonth = 0;
//               let Older = 0;
//               const currencyLength = Currency.length;
//               for (let k = 0; k < allRecords[i][1].data.length; k++) {
//                 creditEx =
//                   creditEx +
//                   utilityService.convertSubstringParseFloat(
//                     allRecords[i][1].data[k].dataArr[3]
//                   );
//                 debitEx =
//                   debitEx +
//                   utilityService.convertSubstringParseFloat(
//                     allRecords[i][1].data[k].dataArr[4]
//                   );
//               }
//               let val = [
//                 "Total " + allRecords[i][0].key + "",
//                 "",
//                 "",

//                 utilityService.modifynegativeCurrencyFormat(creditEx),
//                 utilityService.modifynegativeCurrencyFormat(debitEx),
//               ];
//               current.push(val);
//             }

//             //grandtotalRecord
//             let grandamountduetotal = 0;
//             let grandCurrenttotal = 0;
//             let grandlessTnMonth = 0;
//             let grandCreditEx = 0;
//             let grandDebitEx = 0;
//             let grandthreeMonth = 0;
//             let grandOlder = 0;

//             for (let n = 0; n < current.length; n++) {
//               const grandcurrencyLength = Currency.length;

//               //for (let m = 0; m < current[n].data.length; m++) {

//               grandCreditEx =
//                 grandCreditEx +
//                 utilityService.convertSubstringParseFloat(current[n][3]);
//               grandDebitEx =
//                 grandDebitEx +
//                 utilityService.convertSubstringParseFloat(current[n][4]);
//             }

//             let grandval = [
//               "Grand Total " + "",
//               "",
//               "",
//               utilityService.modifynegativeCurrencyFormat(grandCreditEx),
//               utilityService.modifynegativeCurrencyFormat(grandDebitEx),
//             ];

//             for (let key in records) {
//               let dataArr = current[iterator];
//               let obj = [
//                 { key: key },
//                 { data: records[key] },
//                 { total: [{ dataArr: dataArr }] },
//               ];
//               totalRecord.push(obj);
//               iterator += 1;
//             }

//             templateObject.records.set(totalRecord);
//             templateObject.grandrecords.set(grandval);

//             if (templateObject.records.get()) {
//               setTimeout(function () {
//                 $("td a").each(function () {
//                   if (
//                     $(this)
//                       .text()
//                       .indexOf("-" + Currency) >= 0
//                   )
//                     $(this).addClass("text-danger");
//                 });
//                 $("td").each(function () {
//                   if (
//                     $(this)
//                       .text()
//                       .indexOf("-" + Currency) >= 0
//                   )
//                     $(this).addClass("text-danger");
//                 });

//                 $("td").each(function () {
//                   let lineValue = $(this).first().text()[0];
//                   if (lineValue != undefined) {
//                     if (lineValue.indexOf(Currency) >= 0)
//                       $(this).addClass("text-right");
//                   }
//                 });

//                 $("td").each(function () {
//                   if (
//                     $(this)
//                       .first()
//                       .text()
//                       .indexOf("-" + Currency) >= 0
//                   )
//                     $(this).addClass("text-right");
//                 });

//                 LoadingOverlay.hide();
//               }, 100);
//             }
//           } else {
//             let records = [];
//             let recordObj = {};
//             recordObj.Id = "";
//             recordObj.type = "";
//             recordObj.AccountName = " ";
//             recordObj.dataArr = [
//               "-",
//               "-",
//               "-",
//               "-",
//               "-",
//               "-",
//               "-",
//               "-",
//               "-",
//               "-",
//             ];

//             records.push(recordObj);
//             templateObject.records.set(records);
//             templateObject.grandrecords.set("");
//             LoadingOverlay.hide();
//           }
//         })
//         .catch(function (err) {
//           //Bert.alert('<strong>' + err + '</strong>!', 'danger');
//           LoadingOverlay.hide();
//         });
//     } else {
//       let data = JSON.parse(localStorage.getItem("VS1TrialBalance_Report"));
//       let totalRecord = [];
//       let grandtotalRecord = [];

//       if (data.ttrialbalancereport.length) {
//         let records = [];
//         let allRecords = [];
//         let current = [];

//         let totalNetAssets = 0;
//         let GrandTotalLiability = 0;
//         let GrandTotalAsset = 0;
//         let incArr = [];
//         let cogsArr = [];
//         let expArr = [];
//         let accountData = data.ttrialbalancereport;
//         let accountType = "";

//         for (let i = 0; i < accountData.length; i++) {
//           let recordObj = {};
//           recordObj.Id = data.ttrialbalancereport[i].TransID;
//           recordObj.type = data.ttrialbalancereport[i].Account;
//           recordObj.AccountName = data.ttrialbalancereport[i].AccountName;
//           recordObj.dataArr = [
//             "",
//             data.ttrialbalancereport[i].AccountNumber,
//             data.ttrialbalancereport[i].Account,
//             {
//               type: 'amount',
//               value: utilityService.modifynegativeCurrencyFormat(
//                 data.ttrialbalancereport[i].CreditsEx
//               ) || "-",
//             },
//             {
//               type: 'amount',
//               value: utilityService.modifynegativeCurrencyFormat(
//                 data.ttrialbalancereport[i].DebitsEx
//               ) || "-",
//             },

//           ];

//           records.push(recordObj);
//         }
//         records = _.sortBy(records, "AccountName");
//         records = _.groupBy(records, "AccountName");

//         for (let key in records) {
//           let obj = [{ key: key }, { data: records[key] }];
//           allRecords.push(obj);
//         }

//         let iterator = 0;
//         for (let i = 0; i < allRecords.length; i++) {
//           let amountduetotal = 0;
//           let Currenttotal = 0;
//           let creditEx = 0;
//           let debitEx = 0;
//           let twoMonth = 0;
//           let threeMonth = 0;
//           let Older = 0;
//           const currencyLength = Currency.length;
//           for (let k = 0; k < allRecords[i][1].data.length; k++) {
//             creditEx =
//               creditEx +
//               utilityService.convertSubstringParseFloat(
//                 allRecords[i][1].data[k].dataArr[3].value
//               );
//             debitEx =
//               debitEx +
//               utilityService.convertSubstringParseFloat(
//                 allRecords[i][1].data[k].dataArr[4].value
//               );
//           }
//           let val = [
//             "Total " + allRecords[i][0].key + "",
//             "",
//             "",
//             {
//               type: 'amount',
//               value: utilityService.modifynegativeCurrencyFormat(creditEx),
//             },
//             {
//               type: 'amount',
//               value: utilityService.modifynegativeCurrencyFormat(debitEx),
//             },
//           ];
//           current.push(val);
//         }

//         //grandtotalRecord
//         let grandamountduetotal = 0;
//         let grandCurrenttotal = 0;
//         let grandlessTnMonth = 0;
//         let grandCreditEx = 0;
//         let grandDebitEx = 0;
//         let grandthreeMonth = 0;
//         let grandOlder = 0;

//         for (let n = 0; n < current.length; n++) {
//           const grandcurrencyLength = Currency.length;

//           //for (let m = 0; m < current[n].data.length; m++) {

//           grandCreditEx =
//             grandCreditEx +
//             utilityService.convertSubstringParseFloat(current[n][3].value);
//           grandDebitEx =
//             grandDebitEx +
//             utilityService.convertSubstringParseFloat(current[n][4].value);
//         }

//         let grandval = [
//           "Grand Total " + "",
//           "",
//           "",
//           {
//             type: "amount",
//             value: utilityService.modifynegativeCurrencyFormat(grandCreditEx),
//           },
//           {
//             type: "amount",
//             value: utilityService.modifynegativeCurrencyFormat(grandDebitEx),
//           }
//         ];

//         for (let key in records) {
//           let dataArr = current[iterator];
//           let obj = [
//             { key: key },
//             { data: records[key] },
//             { total: [{ dataArr: dataArr }] },
//           ];
//           totalRecord.push(obj);
//           iterator += 1;
//         }

//         templateObject.records.set(totalRecord);
//         templateObject.grandrecords.set(grandval);

//         if (templateObject.records.get()) {
//           setTimeout(function () {
//             $("td a").each(function () {
//               if (
//                 $(this)
//                   .text()
//                   .indexOf("-" + Currency) >= 0
//               )
//                 $(this).addClass("text-danger");
//             });
//             $("td").each(function () {
//               if (
//                 $(this)
//                   .text()
//                   .indexOf("-" + Currency) >= 0
//               )
//                 $(this).addClass("text-danger");
//             });

//             $("td").each(function () {
//               let lineValue = $(this).first().text()[0];
//               if (lineValue != undefined) {
//                 if (lineValue.indexOf(Currency) >= 0)
//                   $(this).addClass("text-right");
//               }
//             });

//             $("td").each(function () {
//               if (
//                 $(this)
//                   .first()
//                   .text()
//                   .indexOf("-" + Currency) >= 0
//               )
//                 $(this).addClass("text-right");
//             });

//             LoadingOverlay.hide();
//           }, 100);
//         }
//       } else {
//         let records = [];
//         let recordObj = {};
//         recordObj.Id = "";
//         recordObj.type = "";
//         recordObj.AccountName = " ";
//         recordObj.dataArr = ["-", "-", "-", "-", "-", "-", "-", "-", "-", "-"];

//         records.push(recordObj);
//         templateObject.records.set(records);
//         templateObject.grandrecords.set("");
//         LoadingOverlay.hide();
//       }
//       $(".fullScreenSpin").css("display", "none");
//     }
//   };
//   /**
//    * This will be used
//    *
//    * @param {*} dateFrom
//    * @param {*} dateTo
//    * @param {*} ignoreDate
//    */
//   templateObject.loadReport = async (dateFrom, dateTo, ignoreDate) => {
//     LoadingOverlay.show();
//     templateObject.setDateAs( dateFrom );
//     let data = await CachedHttp.get(erpObject.TTrialBalanceReport, async () => {
//       return await reportService.getTrialBalanceDetailsData(dateFrom, dateTo, ignoreDate);
//     }, {
//       useIndexDb: true,
//       useLocalStorage: true,
//       validate: cachedResponse => {
//         return false;
//       }
//     });

//     data = data.response;
//     let accountData = data.ttrialbalancereport;

//     let records = accountData.map(account => {
//       return {
//         Id: account.TransID,
//         type: account.Account,
//         AccountName: account.AccountName,
//         ...account
//       };
//     });

//     records = _.sortBy(records, "AccountName");
//     records = _.groupBy(records, "AccountName");

//     let allRecords = [];

//     const calculateTotal = (entries = [], title = "Total ") => {
//       let amountduetotal = 0;
//       let Currenttotal = 0;
//       let creditEx = 0;
//       let debitEx = 0;
//       let twoMonth = 0;
//       let threeMonth = 0;
//       let Older = 0;
//       const currencyLength = Currency.length;

//       entries.forEach(entry => {
//         creditEx = creditEx + parseFloat(entry.CreditsEx);
//         debitEx = debitEx + parseFloat(entry.DebitsEx);
//       });

//       return {
//         title: "Total " + title,
//         CreditsEx: creditEx,
//         DebitsEx: debitEx
//       };
//     };

//     for (let key in records) {
//       allRecords.push({
//         title: key,
//         entries: records[key],
//         total: calculateTotal(records[key], key)
//       });
//     }

//     const calculateGrandTotal = (allRecords = []) => {
//       //grandtotalRecord
//       let grandamountduetotal = 0;
//       let grandCurrenttotal = 0;
//       let grandlessTnMonth = 0;
//       let grandCreditEx = 0;
//       let grandDebitEx = 0;
//       let grandthreeMonth = 0;
//       let grandOlder = 0;

//       allRecords.forEach(record => {
//         grandCreditEx = grandCreditEx + parseFloat(record.total.CreditsEx);
//         grandDebitEx = grandDebitEx + parseFloat(record.total.DebitsEx);
//       });

//       return {title: "Grand Total ", DebitsEx: grandDebitEx, CreditsEx: grandCreditEx};
//     };

//     const grandTotal = calculateGrandTotal(allRecords);

//     templateObject.records.set(allRecords);
//     templateObject.grandrecords.set(grandTotal);

//     if (templateObject.records.get()) {
//       setTimeout(function () {
//         $("td a").each(function () {
//           if ($(this).text().indexOf("-" + Currency) >= 0)
//             $(this).addClass("text-danger");
//           }
//         );
//         $("td").each(function () {
//           if ($(this).text().indexOf("-" + Currency) >= 0)
//             $(this).addClass("text-danger");
//           }
//         );

//         $("td").each(function () {
//           let lineValue = $(this).first().text()[0];
//           if (lineValue != undefined) {
//             if (lineValue.indexOf(Currency) >= 0)
//               $(this).addClass("text-right");
//             }
//           });

//         $("td").each(function () {
//           if ($(this).first().text().indexOf("-" + Currency) >= 0)
//             $(this).addClass("text-right");
//           }
//         );

//         LoadingOverlay.hide();
//       }, 100);
//     }

//     LoadingOverlay.hide();
//   };



//   // var currentDate2 = new Date();
//   // var getLoadDate = moment(currentDate2).format("YYYY-MM-DD");

//   // let getDateFrom =
//   //   currentDate2.getFullYear() +
//   //   "-" +
//   //   currentDate2.getMonth() +
//   //   "-" +
//   //   currentDate2.getDate();

//   //templateObject.getTrialBalanceReports(getDateFrom, getLoadDate, false);

//   templateObject.getDepartments = function () {
//     let deptrecords = [];
//     reportService.getDepartment().then(function (data) {
//       for (let i in data.tdeptclass) {
//         let deptrecordObj = {
//           id: data.tdeptclass[i].Id || " ",
//           department: data.tdeptclass[i].DeptClassName || " ",
//         };

//         deptrecords.push(deptrecordObj);
//         templateObject.deptrecords.set(deptrecords);
//       }
//     });
//   };
//   // templateObject.getAllProductData();
//   //templateObject.getDepartments();


//   templateObject.initDate();
//   templateObject.getDepartments();

//   templateObject.loadReport(
//     GlobalFunctions.convertYearMonthDay($('#dateFrom').val()),
//     GlobalFunctions.convertYearMonthDay($('#dateTo').val()),
//     false
//   );
//   templateObject.setDateAs( GlobalFunctions.convertYearMonthDay($('#dateFrom').val()) )
// });

Template.trialbalance.events({
  // "change input[type='checkbox']": (event) => {
  //   // This should be global
  //   $(event.currentTarget).attr(
  //     "checked",
  //     $(event.currentTarget).prop("checked")
  //   );
  // },
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
  'change .custom-range': async function(event) {
    //   const tableHandler = new TableHandler();
    let range = $(event.target).val()||0;
    let colClassName = $(event.target).attr("valueclass");
    await $('.' + colClassName).css('width', range);
    //   await $('.colAccountTree').css('width', range);
    $('.dataTable').resizable();
  },

  // 'click .btnOpenReportSettings': () => {
  //   let templateObject = Template.instance();
  //   // let currenttranstablename = templateObject.data.tablename||";
  //   $(`thead tr th`).each(function (index) {
  //     var $tblrow = $(this);
  //     var colWidth = $tblrow.width() || 0;
  //     var colthClass = $tblrow.attr('data-class') || "";
  //     $('.rngRange' + colthClass).val(colWidth);
  //   });
  // },
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
      let _currency = _currencyList.find(
          (c) => c.code == defaultCurrencyCode
      );
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
  "click td a": function (event) {
    let id = $(event.target).closest("tr").attr("id").split("item-value-");
    var accountName = $(event.target).closest("tr").attr("class");

    var fromDate = new Date($("#dateFrom").datepicker("getDate"));
    var toDate = new Date($("#dateTo").datepicker("getDate"));

    // let toDate = dateFrom.getFullYear() + "/" + (dateFrom.getMonth()+1) + "/" + dateFrom.getDate();
    // let fromDate = dateTo.getFullYear() + "-" + (dateTo.getMonth()+1) + "-" + dateTo.getDate();
    window.open(
        "/balancetransactionlist?accountName=" +
        accountName +
        "&toDate=" +
        toDate +
        "&fromDate=" +
        fromDate +
        "&isTabItem=" +
        false,
        "_self"
    );
  },

  "click .btnRefresh": function () {
    LoadingOverlay.show();
    localStorage.setItem("VS1TrialBalance_Report", "");
    Meteor._reload.reload();
  },
  "click .btnPrintReport": function (event) {
    $('.fullScreenSpin').css('display', 'inline-block')
    playPrintAudio();
    setTimeout(function () {
      $("a").attr("href", "/");
      document.title = "Trial Balance Report";
      $(".printReport").print({
        title: document.title + " | Trial  Balance Report | " + loggedCompany,
        noPrintSelector: ".addSummaryEditor",
        mediaPrint: false,
      });
      setTimeout(function () {
        $("a").attr("href", "#");
      }, 100);
    }, delayTimeAfterSound);
    $('.fullScreenSpin').css('display', 'none')

  },
  /*"click .btnSpreadSheetLink": function() {
    LoadingOverlay.show();
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

    // const filename = loggedCompany + "-Profit and Loss" + ".csv";

    var table = $("#tableExport").filter("table");
    var rows = table.find('tr').not(options.ignoreRows);

    var numCols = rows.first().find("td,th").not(options.ignoreColumns).length;
    var tables = [];
    var wsnames = [];

    var maintab = {
      rows: []
    };

    rows.each(function() {
      var cells = [];
      $(this).find("td,th").not(options.ignoreColumns)
          .each(function(i, col) {
              var column = $(col);

              // Strip whitespaces
              var content = options.trimContent ? $.trim(column.text()) : column.text();
              cells.push({
                "data-type": "String",
                "data-style": "",
                "data-value": content,
                "innerHTML": "",
                "data-formula": null,
                getAttribute: function (attr_val) {
                  if (attr_val) {
                    return this[attr_val];
                  }
                }
              });
          });
      maintab.rows.push({cells: cells});
    });

    tables.push(maintab);

    //raw data tab content

    tables.push([]);

    //----------------

    wsnames.push(loggedCompany + "-Trial Balance");
    wsnames.push("Raw data");


    utilityService.multipleTablesToExcel(tables, wsnames, loggedCompany + "-Trial Balance", "");
  },
  "click .btnSpreadSheetLink": function () {
    $(".fullScreenSpin").css("display", "inline-block");
    let utilityService = new UtilityService();
    const filename = "Balancesheet report result" + ".xlsx";
    utilityService.exportReportToSpreadSheet("tableExport", filename, "xlsx");
  },*/
  "click .btnExportReport": function () {
    LoadingOverlay.show();
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

    const filename = loggedCompany + "-Trial Balance" + ".csv";
    utilityService.exportReportToCsvTable("trialbalance", filename, "csv");
    LoadingOverlay.hide();
    let rows = [];
    // reportService.getTrialBalanceDetailsData(formatDateFrom,formatDateTo,false).then(function (data) {
    //     if(data.ttrialbalancereport){
    //         rows[0] = ['Account Name', 'Account No.', 'Account', 'Credit (Ex)', 'Debit (Ex)'];
    //         data.ttrialbalancereport.forEach(function (e, i) {
    //             rows.push([
    //               data.ttrialbalancereport[i].AccountName,
    //               data.ttrialbalancereport[i].AccountNumber,
    //               data.ttrialbalancereport[i].Account,
    //
    //               utilityService.modifynegativeCurrencyFormat(data.ttrialbalancereport[i].CreditsEx) || '0.00',
    //               utilityService.modifynegativeCurrencyFormat(data.ttrialbalancereport[i].DebitsEx) || '0.00']);
    //         });
    //         setTimeout(function () {
    //             utilityService.exportReportToCsv(rows, filename, 'xls');
    //             $('.fullScreenSpin').css('display','none');
    //         }, 1000);
    //     }
    //
    // });
  },

  // BEFORE REMOVING THIS, MAKE SURE IT IS NOT NEEDED
//   "change .edtReportDates": (e, templateObject) => {
//     $(".fullScreenSpin").css("display", "inline-block");
//     localStorage.setItem('VS1TrialBalance_Report', '');
//     let templateObject = Template.instance();
//     var dateFrom = new Date($("#dateFrom").datepicker("getDate"));
//     var dateTo = new Date($("#dateTo").datepicker("getDate"));
//     //await templateObject.setReportOptions(false, dateFrom, dateTo);
//     // $(".fullScreenSpin").css("display", "none");

//     templateObject.loadReport(
//       GlobalFunctions.convertYearMonthDay($('#dateFrom').val()),
//       GlobalFunctions.convertYearMonthDay($('#dateTo').val()),
//       false
//     );
//   },


  // BEFORE REMOVING THIS, MAKE SURE IT IS WORKING WELL ALREADY
// "click #lastMonth": (e, templateObject) => {
//     // $(".fullScreenSpin").css("display", "inline-block");
//     // localStorage.setItem('VS1TrialBalance_Report', '');
//     // let templateObject = Template.instance();
//     // let fromDate = moment().subtract(1, "months").startOf("month").format("YYYY-MM-DD");
//     // let endDate = moment().subtract(1, "months").endOf("month").format("YYYY-MM-DD");
//     // await templateObject.setReportOptions(false, fromDate, endDate);
//     // // $(".fullScreenSpin").css("display", "none");

//     Datehandler.lastMonth();

//     // templateObject.loadReport(
//     //   GlobalFunctions.convertYearMonthDay($('#dateFrom').val()),
//     //   GlobalFunctions.convertYearMonthDay($('#dateTo').val()),
//     //   false
//     // );
// },
// "click #lastQuarter":(e, templateObject) => {
//     // $(".fullScreenSpin").css("display", "inline-block");
//     // localStorage.setItem('VS1TrialBalance_Report', '');
//     // let templateObject = Template.instance();
//     // let fromDate = moment().subtract(1, "Q").startOf("Q").format("YYYY-MM-DD");
//     // let endDate = moment().subtract(1, "Q").endOf("Q").format("YYYY-MM-DD");
//     // await templateObject.setReportOptions(false, fromDate, endDate);
//     // // $(".fullScreenSpin").css("display", "none");

//     Datehandler.lastQuarter();

//     // templateObject.loadReport(
//     //   GlobalFunctions.convertYearMonthDay($('#dateFrom').val()),
//     //   GlobalFunctions.convertYearMonthDay($('#dateTo').val()),
//     //   false
//     // );
// },
// "click #last12Months": (e, templateObject) => {
//   Datehandler.last12Months();
//     // $(".fullScreenSpin").css("display", "inline-block");
//     // localStorage.setItem('VS1TrialBalance_Report', '');
//     // let templateObject = Template.instance();
//     // $("#dateFrom").attr("readonly", false);
//     // $("#dateTo").attr("readonly", false);
//     // var currentDate = new Date();
//     // var begunDate = moment(currentDate).format("DD/MM/YYYY");

//     // let fromDateMonth = Math.floor(currentDate.getMonth() + 1);
//     // let fromDateDay = currentDate.getDate();
//     // if (currentDate.getMonth() + 1 < 10) {
//     //   fromDateMonth = "0" + (currentDate.getMonth() + 1);
//     // }
//     // if (currentDate.getDate() < 10) {
//     //   fromDateDay = "0" + currentDate.getDate();
//     // }

//     // var fromDate = fromDateDay + "/" + fromDateMonth + "/" + Math.floor(currentDate.getFullYear() - 1);
//     // templateObject.dateAsAt.set(begunDate);
//     // $("#dateFrom").val(fromDate);
//     // $("#dateTo").val(begunDate);

//     // var currentDate2 = new Date();
//     // var getLoadDate = moment(currentDate2).format("YYYY-MM-DD");
//     // let getDateFrom = Math.floor(currentDate2.getFullYear() - 1) + "-" + Math.floor(currentDate2.getMonth() + 1) + "-" + currentDate2.getDate();
//     // await templateObject.setReportOptions(false, getDateFrom, getLoadDate);
//     // $(".fullScreenSpin").css("display", "none");
// },
  "click #ignoreDate":  (e, templateObject) => {
    // $(".fullScreenSpin").css("display", "inline-block");
    // localStorage.setItem('VS1TrialBalance_Report', '');
    // let templateObject = Template.instance();
    // templateObject.dateAsAt.set("Current Date");
    // await templateObject.setReportOptions(true);
    // // $(".fullScreenSpin").css("display", "none");
    $(".fullScreenSpin").css("display", "inline-block");
    clearData('TTrialBalanceReport').then(function(){

      templateObject.getTrialBalanceData(
          null,
          null,
          true
      );
    })

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
  ...FxGlobalFunctions.getEvents(),



  "click #dropdownDateRang": function (e) {
    let dateRangeID = e.target.id;
    $("#btnSltDateRange").addClass("selectedDateRangeBtnMod");
    $("#selectedDateRange").show();
    if (dateRangeID == "thisMonth") {
      document.getElementById("selectedDateRange").value = "This Month";
    } else if (dateRangeID == "thisQuarter") {
      document.getElementById("selectedDateRange").value = "This Quarter";
    } else if (dateRangeID == "thisFinYear") {
      document.getElementById("selectedDateRange").value =
          "This Financial Year";
    } else if (dateRangeID == "lastMonth") {
      document.getElementById("selectedDateRange").value = "Last Month";
    } else if (dateRangeID == "lastQuarter") {
      document.getElementById("selectedDateRange").value = "Last Quarter";
    } else if (dateRangeID == "lastFinYear") {
      document.getElementById("selectedDateRange").value =
          "Last Financial Year";
    } else if (dateRangeID == "monthToDate") {
      document.getElementById("selectedDateRange").value = "Month to Date";
    } else if (dateRangeID == "quarterToDate") {
      document.getElementById("selectedDateRange").value = "Quarter to Date";
    } else if (dateRangeID == "finYearToDate") {
      document.getElementById("selectedDateRange").value = "Year to Date";
    }
  },

  // BEFORE REMOVING THIS, MAKE SURE IT IS WORKING WELL ALREADY
  // "click #thisMonth": (e, templateObject) => {
  //   // $(".fullScreenSpin").css("display", "block");
  //   // let templateObject = Template.instance();
  //   // let fromDate = moment().startOf("month").format("YYYY-MM-DD");
  //   // let endDate = moment().endOf("month").format("YYYY-MM-DD");
  //   // localStorage.setItem('VS1TrialBalance_Report', '');
  //   // templateObject.setReportOptions(0, fromDate, endDate);
  //   Datehandler.thisMonth();
  //   // templateObject.loadReport(
  //   //   GlobalFunctions.convertYearMonthDay($('#dateFrom').val()),
  //   //   GlobalFunctions.convertYearMonthDay($('#dateTo').val()),
  //   //   false
  //   // );
  // },
  // "click #thisQuarter": (e, templateObject) => {
  //   // $(".fullScreenSpin").css("display", "block");
  //   // let templateObject = Template.instance();
  //   // let fromDate = moment().startOf("Q").format("YYYY-MM-DD");
  //   // let endDate = moment().endOf("Q").format("YYYY-MM-DD");
  //   // localStorage.setItem('VS1TrialBalance_Report', '');
  //   // templateObject.setReportOptions(0, fromDate, endDate);

  //   Datehandler.thisQuarter();
  // },
  // "click #thisFinYear": (e, templateObject) => {
  //   // $(".fullScreenSpin").css("display", "block");
  //   // let templateObject = Template.instance();
  //   // let fromDate = null;
  //   // let endDate = null;
  //   // if (moment().quarter() == 4) {
  //   //   fromDate = moment().month("July").startOf("month").format("YYYY-MM-DD");
  //   //   endDate = moment()
  //   //     .add(1, "year")
  //   //     .month("June")
  //   //     .endOf("month")
  //   //     .format("YYYY-MM-DD");
  //   // } else {
  //   //   fromDate = moment()
  //   //     .subtract(1, "year")
  //   //     .month("July")
  //   //     .startOf("month")
  //   //     .format("YYYY-MM-DD");
  //   //   endDate = moment().month("June").endOf("month").format("YYYY-MM-DD");
  //   // }
  //   // localStorage.setItem('VS1TrialBalance_Report', '');
  //   // templateObject.setReportOptions(0, fromDate, endDate);
  //   Datehandler.thisFinYear();
  //   // templateObject.loadReport(
  //   //   GlobalFunctions.convertYearMonthDay($('#dateFrom').val()),
  //   //   GlobalFunctions.convertYearMonthDay($('#dateTo').val()),
  //   //   false
  //   // );
  // },
  // "click #lastFinYear": (e, templateObject) => {
  //   // $(".fullScreenSpin").css("display", "block");
  //   // let templateObject = Template.instance();
  //   // let fromDate = null;
  //   // let endDate = null;
  //   // if (moment().quarter() == 4) {
  //   //   fromDate = moment()
  //   //     .subtract(1, "year")
  //   //     .month("July")
  //   //     .startOf("month")
  //   //     .format("YYYY-MM-DD");
  //   //   endDate = moment().month("June").endOf("month").format("YYYY-MM-DD");
  //   // } else {
  //   //   fromDate = moment()
  //   //     .subtract(2, "year")
  //   //     .month("July")
  //   //     .startOf("month")
  //   //     .format("YYYY-MM-DD");
  //   //   endDate = moment()
  //   //     .subtract(1, "year")
  //   //     .month("June")
  //   //     .endOf("month")
  //   //     .format("YYYY-MM-DD");
  //   // }
  //   // localStorage.setItem('VS1TrialBalance_Report', '');
  //   // templateObject.setReportOptions(0, fromDate, endDate);
  //   Datehandler.lastFinYear();
  //   // templateObject.loadReport(
  //   //   GlobalFunctions.convertYearMonthDay($('#dateFrom').val()),
  //   //   GlobalFunctions.convertYearMonthDay($('#dateTo').val()),
  //   //   false
  //   // );
  // },
  // "click #monthToDate": (e, templateObject) => {
  //   // $(".fullScreenSpin").css("display", "block");
  //   // let templateObject = Template.instance();
  //   // let fromDate = moment().startOf("M").format("YYYY-MM-DD");
  //   // let endDate = moment().format("YYYY-MM-DD");
  //   // localStorage.setItem('VS1TrialBalance_Report', '');
  //   // templateObject.setReportOptions(0, fromDate, endDate);
  //   Datehandler.monthToDate();
  // },
  // "click #quarterToDate": (e, templateObject) => {
  //   // $(".fullScreenSpin").css("display", "block");
  //   // let templateObject = Template.instance();
  //   // let fromDate = moment().startOf("Q").format("YYYY-MM-DD");
  //   // let endDate = moment().format("YYYY-MM-DD");
  //   // localStorage.setItem('VS1TrialBalance_Report', '');
  //   // templateObject.setReportOptions(0, fromDate, endDate);
  //   Datehandler.quaterToDate();
  // },
  // "click #finYearToDate": (e, templateObject) => {
  //   // $(".fullScreenSpin").css("display", "block");
  //   // let templateObject = Template.instance();
  //   // let fromDate = moment()
  //   //   .month("january")
  //   //   .startOf("month")
  //   //   .format("YYYY-MM-DD");
  //   // let endDate = moment().format("YYYY-MM-DD");
  //   // localStorage.setItem('VS1TrialBalance_Report', '');
  //   // templateObject.setReportOptions(0, fromDate, endDate);
  //   Datehandler.finYearToDate();
  // }


  /**
   * This is the new way to handle any modification on the date fields
   */
  "change #dateTo, change #dateFrom": (e, templateObject) => {
    $(".fullScreenSpin").css("display", "inline-block");
    clearData('TTrialBalanceReport').then(function(){
      templateObject.getTrialBalanceData(
          GlobalFunctions.convertYearMonthDay($('#dateFrom').val()),
          GlobalFunctions.convertYearMonthDay($('#dateTo').val()),
          false
      );
    })
  },
  ...Datehandler.getDateRangeEvents()
});

Template.trialbalance.helpers({
  isObject(variable) {
    return (typeof variable === 'object' && variable !== null);
  },
  transactiondatatablerecords: () => {
    return Template.instance().transactiondatatablerecords.get();
  },

  grandrecords: () => {
    return Template.instance().grandrecords.get();
  },
  dateAsAt: () => {
    return Template.instance().dateAsAt.get() || "-";
  },
  companyname: () => {
    return loggedCompany;
  },
  deptrecords: () => {
    return Template.instance()
        .deptrecords.get()
    // .sort(function (a, b) {
    //   if (a.department == "NA") {
    //     return 1;
    //   } else if (b.department == "NA") {
    //     return -1;
    //   }
    //   return a.department.toUpperCase() > b.department.toUpperCase() ? 1 : -1;
    // });
  },


  formatDate: (date)  => GlobalFunctions.formatDate(date),

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
            ? `- ${currencyData.symbol}${amount}`
            : `${currencyData.symbol}${amount}`;


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

  formatPrice( amount){

    let utilityService = new UtilityService();
    if( isNaN( amount ) ){
      amount = ( amount === undefined || amount === null || amount.length === 0 ) ? 0 : amount;
      amount = ( amount )? Number(amount.replace(/[^0-9.-]+/g,"")): 0;
    }
    return utilityService.modifynegativeCurrencyFormat(amount)|| 0.00;
  },
  formatTax( amount){

    if( isNaN( amount ) ){
      amount = ( amount === undefined || amount === null || amount.length === 0 ) ? 0 : amount;
      amount = ( amount )? Number(amount.replace(/[^0-9.-]+/g,"")): 0;
    }
    return amount + "%" || "0.00 %";
  },
  trialbalanceth: () => {
    return Template.instance().trialbalanceth.get();
  }
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