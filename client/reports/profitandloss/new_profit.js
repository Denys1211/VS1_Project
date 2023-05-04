import { ReportService } from "../report-service";
import { UtilityService } from "../../utility-service";
import layoutEditor from "./layoutEditor";
import ApiService from "../../js/Api/Module/ApiService";
import { ProductService } from "../../product/product-service";
import ProfitLossLayout from "../../js/Api/Model/ProfitLossLayout";
import ProfitLossLayoutFields from "../../js/Api/Model/ProfitLossLayoutFields";
import ProfitLossLayoutApi from "../../js/Api/ProfitLossLayoutApi";
import { TaxRateService } from "../../settings/settings-service";
import LoadingOverlay from "../../LoadingOverlay";
import GlobalFunctions from "../../GlobalFunctions";
import moment from "moment";
import FxGlobalFunctions from "../../packages/currency/FxGlobalFunctions";
import CachedHttp from "../../lib/global/CachedHttp";
import erpObject from "../../lib/global/erp-objects";
import TemplateInjector from "../../TemplateInjector";
import 'jquery-ui-dist/external/jquery/jquery';
import 'jquery-ui-dist/jquery-ui';
import "jQuery.print/jQuery.print.js";
import { jsPDF } from "jspdf";
import Datehandler from "../../DateHandler";
import {Session} from 'meteor/session';
import { Template } from 'meteor/templating';
import './new_profit.html';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

let utilityService = new UtilityService();
let reportService = new ReportService();
let taxRateService = new TaxRateService();

const templateObject = Template.instance();
const productService = new ProductService();
const defaultPeriod = 3;
const employeeId = localStorage.getItem("mySessionEmployeeLoggedID");
let defaultCurrencyCode = CountryAbbr; // global variable "AUD"

const months = [];
months["January"] = "01";
months["February"] = "02";
months["March"] = "03";
months["April"] = "04";
months["May"] = "05";
months["June"] = "06";
months["July"] = "07";
months["August"] = "08";
months["September"] = "09";
months["October"] = "10";
months["November"] = "11";
months["December"] = "12";

Template.newprofitandloss.onCreated(function () {
  const templateObject = Template.instance();
  templateObject.records = new ReactiveVar([]);
  templateObject.dateAsAt = new ReactiveVar();
  templateObject.departments = new ReactiveVar([]);
  templateObject.reportOptions = new ReactiveVar();
  templateObject.recordslayout = new ReactiveVar([]);
  templateObject.profitlosslayoutrecords = new ReactiveVar([]);
  templateObject.profitlosslayoutfields = new ReactiveVar([]);
  templateObject.daterange = new ReactiveVar();
  templateObject.layoutgroupid = new ReactiveVar();
  templateObject.tableheaderrecords = new ReactiveVar([]);
  FxGlobalFunctions.initVars(templateObject);

  let headerStructure = [
      { index: 0, label: "ID", class: "colID", width: "80", active: true, display: true },
      { index: 1, label: "Layout Name", class: "colLayoutName", width: "250", active: true, display: true },
      { index: 2, label: "Layout Description", class: "colLayoutDescription", width: "400", active: true, display: true },      
      { index: 3, label: "Current Layout", class: "colCurrentLayout hiddenColumn", width: "100", active: false, display: false },
  ];
  
  templateObject.tableheaderrecords.set(headerStructure);

  templateObject.getDataTableList = function(data) {
      var dataList;
      {
          dataList = [
              data.Id || 0,
              data.LName || '',
              data.Description || '',
              data.IsCurrentLayout || false,
          ];
      }
      return dataList;
  }
});


Template.newprofitandloss.onRendered(function () {
  const templateObject = Template.instance();
  const deptrecords = [];
  localStorage.setItem("colnames_", "");
  templateObject.setReportOptions = async function (compPeriod = 0, formatDateFrom = new Date(), formatDateTo = new Date() ) {
    LoadingOverlay.show();
    $(".pnlTable").hide();
    // New Code Start here
    let fromYear = moment(formatDateFrom).format("YYYY");
    let toYear = moment(formatDateTo).format("YYYY");
    let dateRange = [];
    if (toYear === fromYear) {
      dateRange.push(moment(formatDateFrom).format("DD MMM") + "-" + moment(formatDateTo).format("DD MMM") + " " + toYear );
    } else {
      dateRange.push( moment(formatDateFrom).format("DD MMM YYYY") + "-" + moment(formatDateTo).format("DD MMM YYYY") );
    }
    let defaultOptions = templateObject.reportOptions.get();
    if (defaultOptions) {
      defaultOptions.fromDate = formatDateFrom;
      defaultOptions.toDate = formatDateTo;
      defaultOptions.threcords = dateRange;
      defaultOptions.compPeriod = compPeriod;
    } else {
      defaultOptions = {
        compPeriod: compPeriod,
        fromDate: formatDateFrom,
        toDate: formatDateTo,
        threcords: dateRange,
        departments: [],
        showDecimal: true,
        showtotal: true,
        showPercentage:true
      };
    }
    templateObject.dateAsAt.set(moment(defaultOptions.toDate).format('DD/MM/YYYY'));
    setTimeout(function () {
      $("#dateFrom").val(moment(defaultOptions.fromDate).format('DD/MM/YYYY'));
      $("#dateTo").val(moment(defaultOptions.toDate).format('DD/MM/YYYY'));
    }, 100);

    await templateObject.reportOptions.set(defaultOptions);
    await templateObject.getProfitandLossReports();
  };

  $(document).on("click", ".saveProfitLossLayouts", function(e) {
    if($("#npldefaultSettting").prop('checked') == true){
      var dateFrom = new Date($("#dateFrom").datepicker("getDate"));
      var dateTo = new Date($("#dateTo").datepicker("getDate"));
      templateObject.setReportOptions(3, dateFrom, dateTo);
    }
  });

  $(document).on("change", "#dateFrom, #dateTo", function(e) {
    // let defaultOptions = templateObject.reportOptions.get();
    setTimeout(function () {
      var dateFrom = new Date($("#dateFrom").datepicker("getDate"));
      var dateTo = new Date($("#dateTo").datepicker("getDate"));
      templateObject.setReportOptions(0, dateFrom, dateTo);
    }, 100);
  });

  $(document).on("focusout", ".editRowGroup #editGroupName", function(e) {
    let layoutID = parseInt($("#nplLayoutID").val());
    let groupName = $("#editGroupName").val();
    
    if(templateObject.layoutgroupid.get() && groupName != ""){
      $('.fullScreenSpin').css('display', 'inline-block');
      let jsonObj = {
        "Name": "VS1_PNLRenameGroup",
        "Params":{
          "LayoutID": layoutID,
          "Selected": parseInt(templateObject.layoutgroupid.get()),
          "NewName": groupName
        }
      }
      reportService.editPNLGroup(jsonObj).then(function(res){
        templateObject.getProfitLossLayout();
        setTimeout(function () {
          $('.fullScreenSpin').css('display', 'none');
        }, 2000);
        // var dateFrom = new Date($("#dateFrom").datepicker("getDate"));
        // var dateTo = new Date($("#dateTo").datepicker("getDate"));
        // templateObject.setReportOptions(3, dateFrom, dateTo);
      }).catch(function(err) {
          swal({
              title: 'Oooops...',
              text: err,
              type: 'error',
              showCancelButton: false,
              confirmButtonText: 'Try Again'
          }).then((result) => {
              if (result.value) {
                  // Meteor._reload.reload();
              } else if (result.dismiss === 'cancel') {}
          });
          $('.fullScreenSpin').css('display', 'none');
      });
    }
  });

  let utilityService = new UtilityService();
  let salesOrderTable;
  var splashArray = new Array();
  var today = moment().format("DD/MM/YYYY");
  var currentDate = new Date();
  var begunDate = moment(currentDate).format("DD/MM/YYYY");
  let fromDateMonth = currentDate.getMonth() + 1;
  let fromDateDay = currentDate.getDate();
  if (currentDate.getMonth() + 1 < 10) {
    fromDateMonth = "0" + (currentDate.getMonth() + 1);
  }

  let imageData = localStorage.getItem("Image");
  if (imageData) {
    $("#uploadedImage").attr("src", imageData);
    $("#uploadedImage").attr("width", "50%");
  }

  if (currentDate.getDate() < 10) {
    fromDateDay = "0" + currentDate.getDate();
  }
  var fromDate =
    fromDateDay + "/" + fromDateMonth + "/" + currentDate.getFullYear();
  var url = FlowRouter.current().path;
  //hiding Group selected accounts button
  $(".btnGroupAccounts").hide();

  // templateObject.dateAsAt.set(begunDate);
  //    date picker initializer
  $("#date-input,#dateTo,#dateFrom").datepicker({
    showOn: "button",
    buttonText: "Show Date",
    buttonImageOnly: true,
    buttonImage: "/img/imgCal2.png",
    dateFormat: "dd/mm/yy",
    showOtherMonths: true,
    selectOtherMonths: true,
    changeMonth: true,
    changeYear: true,
    yearRange: "-90:+10",
  });
  // end of date picker
  // $("#dateFrom").val(fromDate);
  // $("#dateTo").val(begunDate);
  // let formatDateFrom = new Date();
  // let formatDateTo = new Date();
  // let fromYear = moment(formatDateFrom).format('YYYY');
  // let toYear = moment(formatDateTo).format('YYYY');
  // let dateRange = [];
  // if( toYear === fromYear ){
  //   dateRange.push( moment(formatDateFrom).format('DD MMM') + '-' + moment(formatDateTo).format('DD MMM') + ' '+ toYear );
  // }else{
  //   dateRange.push( moment(formatDateFrom).format('DD MMM YYYY') + '-' + moment(formatDateTo).format('DD MMM YYYY') );
  // }
  // templateObject.threcords.set( dateRange );

  // get 'this month' to appear in date range selector dropdown
  //    const monSml = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sepr","Oct","Nov","Dec"];
  //    var currMonth = monSml[currentDate.getMonth()] + " " + currentDate.getFullYear();

  let currMonth = moment().format("MMM") + " " + moment().format("YYYY");
  $("#dispCurrMonth").append(currMonth);

  // get 'this month' to appear in date range selector dropdown end

  // get 'last quarter' to appear in date range selector dropdown
  let lastQStartDispaly = moment()
    .subtract(1, "Q")
    .startOf("Q")
    .format("D" + " " + "MMM" + " " + "YYYY");
  let lastQEndDispaly = moment()
    .subtract(1, "Q")
    .endOf("Q")
    .format("D" + " " + "MMM" + " " + "YYYY");
  $("#dispLastQuarter").append(lastQStartDispaly + " - " + lastQEndDispaly);

  // get 'last quarter' to appear in date range selector dropdown end

  // get 'this quarter' to appear in date range selector dropdown

  let thisQStartDispaly = moment()
    .startOf("Q")
    .format("D" + " " + "MMM" + " " + "YYYY");
  let thisQEndDispaly = moment()
    .endOf("Q")
    .format("D" + " " + "MMM" + " " + "YYYY");
  $("#dispCurrQuarter").append(thisQStartDispaly + " - " + thisQEndDispaly);

  // get 'this quarter' to appear in date range selector dropdown end

  // get 'last month' to appear in date range selector dropdown

  let prevMonth = moment()
    .subtract(1, "M")
    .format("MMM" + " " + "YYYY");
  $("#dispPrevMonth").append(prevMonth);

  // get 'last month' to appear in date range selector dropdown end

  // get 'month to date' to appear in date range selector dropdown

  let monthStart = moment()
    .startOf("M")
    .format("D" + " " + "MMM");
  let monthCurr = moment().format("D" + " " + "MMM" + " " + "YYYY");
  $("#monthStartDisp").append(monthStart + " - " + monthCurr);

  // get 'month to date' to appear in date range selector dropdown end

  // get 'quarter to date' to appear in date range selector dropdown

  let currQStartDispaly = moment()
    .startOf("Q")
    .format("D" + " " + "MMM");
  $("#quarterToDateDisp").append(currQStartDispaly + " - " + monthCurr);

  // get 'quarter to date' to appear in date range selector dropdown
  // get 'financial year' to appear
  if (moment().quarter() == 4) {
    var current_fiscal_year_start = moment()
      .month("July")
      .startOf("month")
      .format("D" + " " + "MMM" + " " + "YYYY");
    var current_fiscal_year_end = moment()
      .add(1, "year")
      .month("June")
      .endOf("month")
      .format("D" + " " + "MMM" + " " + "YYYY");
    var last_fiscal_year_start = moment()
      .subtract(1, "year")
      .month("July")
      .startOf("month")
      .format("D" + " " + "MMM" + " " + "YYYY");
    var last_fiscal_year_end = moment()
      .month("June")
      .endOf("month")
      .format("D" + " " + "MMM" + " " + "YYYY");
  } else {
    var current_fiscal_year_start = moment()
      .subtract(1, "year")
      .month("July")
      .startOf("month")
      .format("D" + " " + "MMM" + " " + "YYYY");
    var current_fiscal_year_end = moment()
      .month("June")
      .endOf("month")
      .format("D" + " " + "MMM" + " " + "YYYY");

    var last_fiscal_year_start = moment()
      .subtract(2, "year")
      .month("July")
      .startOf("month")
      .format("D" + " " + "MMM" + " " + "YYYY");
    var last_fiscal_year_end = moment()
      .subtract(1, "year")
      .month("June")
      .endOf("month")
      .format("D" + " " + "MMM" + " " + "YYYY");
  }
  //display current financial year
  $("#dispCurrFiscYear").append(
    current_fiscal_year_start + " - " + current_fiscal_year_end
  );
  //display last financial year
  $("#dispPrevFiscYear").append(
    last_fiscal_year_start + " - " + last_fiscal_year_end
  );
  //display current financial year to current date;
  let yeartodate = moment()
    .month("january")
    .startOf("month")
    .format("D" + " " + "MMM" + " " + "YYYY");
  $("#dispCurrFiscYearToDate").append(yeartodate + " - " + monthCurr);
  // get 'financial year' to appear end

  shareFunctionByName.initTable(localStorage.getItem("ERPDefaultDepartment"), "tblDepartmentCheckbox");

  templateObject.getProfitandLossReports = async () => {
    // if (!localStorage.getItem('VS1ProfitAndLoss_Report')) {
      templateObject.getProfitLossLayout();
      const options = await templateObject.reportOptions.get();
      let dateFrom = moment(options.fromDate).format("YYYY-MM-DD") || moment().format("YYYY-MM-DD");
      let dateTo = moment(options.toDate).format("YYYY-MM-DD") || moment().format("YYYY-MM-DD");
      // Compare period
      setTimeout(function () {
        if (options.compPeriod) {
          try {
            let periodMonths = `${options.compPeriod} Month`;

            reportService.getProfitandLossCompare( dateFrom, dateTo, false, periodMonths ).then(function(data) {
              let records = [];
              options.threcords = [];
              if (data.tprofitandlossperiodcomparereport) {
                let accountData = data.tprofitandlossperiodcomparereport;

                let accountType = "";
                var dataList = "";
                let profitandlosslayout = templateObject.profitlosslayoutrecords.get();
                for (let m = 0; m < profitandlosslayout.length; m++) {
                  for (let i = 0; i < accountData.length; i++) {
                    if(profitandlosslayout[m].AccountName == accountData[i].AccountTypeDesc){
                      if (accountData[i]["AccountTypeDesc"].replace(/\s/g, "") == "") {
                        accountType = "";
                      } else {
                        accountType = accountData[i]["AccountTypeDesc"];
                      }
                      let compPeriod = options.compPeriod + 1;
                      let periodAmounts = [];
                      let totalAmount = 0;
                      for (let counter = 1; counter <= compPeriod; counter++) {
                        if (options.threcords.length < compPeriod) {
                          options.threcords.push(accountData[i]["DateDesc_" + counter]);
                        }
                        totalAmount += accountData[i]["Amount_" + counter];
                        let AmountEx = utilityService.modifynegativeCurrencyFormat( accountData[i]["Amount_" + counter] ) || 0.0;
                        let RoundAmount = Math.round(accountData[i]["Amount_" + counter]) || 0;
                        let Percentage = accountData[i]["Percentage_" + counter];
                        periodAmounts.push({
                          decimalAmt: AmountEx,
                          roundAmt: RoundAmount,
                          percentage: Percentage,
                        });
                      }
                      let totalAmountEx = utilityService.modifynegativeCurrencyFormat( totalAmount ) || 0.0;
                      let totalRoundAmount = Math.round(totalAmount) || 0;

                      if ( accountData[i]["AccountHeaderOrder"].replace(/\s/g, "") == "" &&  accountType != "" ) {
                        dataList = {
                          id: accountData[i]["AccountID"] || "",
                          accounttype: accountType || "",
                          accounttypeshort: accountData[i]["AccountType"] || "",
                          accountname: accountData[i]["AccountName"] || "",
                          accountheaderorder: accountData[i]["AccountHeaderOrder"] || "",
                          accountno: accountData[i]["AccountNo"] || "",
                          totalamountex: "",
                          totalroundamountex: "",
                          periodAmounts: "",
                          name: $.trim(accountData[i]["AccountName"])
                            .split(" ")
                            .join("_"),
                        };
                      }
                      else{
                        dataList = {
                          id: accountData[i]["AccountID"] || "",
                          accounttype: accountType || "",
                          accounttypeshort: accountData[i]["AccountType"] || "",
                          accountname: accountData[i]["AccountName"] || "",
                          accountheaderorder: accountData[i]["AccountHeaderOrder"] || "",
                          accountno: accountData[i]["AccountNo"] || "",
                          totalamountex: totalAmountEx || 0.0,
                          periodAmounts: periodAmounts,
                          totalroundamountex: totalRoundAmount,
                          name: $.trim(accountData[i]["AccountName"])
                            .split(" ")
                            .join("_"),
                          // totaltax: totalTax || 0.00
                        };
                      }
                      

                      if( dataList.totalroundamountex !== 0 ) {
                        records.push(dataList);
                      }
                    }
                  }

                  let totalGroupPeriodAmounts = [];
                  let totalGroupAmount = 0;
                  let compPeriod = options.compPeriod + 1;
                  for (let n = 0; n < profitandlosslayout[m].subAccounts.length; n++) {
                    for (let i = 0; i < accountData.length; i++) {
                      if(profitandlosslayout[m].subAccounts[n].AccountName === $.trim(accountData[i].AccountName)){
                        if (accountData[i]["AccountTypeDesc"].replace(/\s/g, "") == "") {
                          accountType = "";
                        } else {
                          accountType = accountData[i]["AccountTypeDesc"];
                        }
                        let periodAmounts = [];
                        let totalAmount = 0;
                        for (let counter = 1; counter <= compPeriod; counter++) {
                          totalAmount += accountData[i]["Amount_" + counter];
                          let AmountEx = utilityService.modifynegativeCurrencyFormat( accountData[i]["Amount_" + counter] ) || 0.0;
                          let RoundAmount = Math.round(accountData[i]["Amount_" + counter]) || 0;
                          let Percentage = accountData[i]["Percentage_" + counter];

                          periodAmounts.push({
                            decimalAmt: AmountEx,
                            roundAmt: RoundAmount,
                            percentage: Percentage,
                          });

                          if(totalGroupPeriodAmounts.length < compPeriod){
                            totalGroupPeriodAmounts.push({
                              decimalAmt: "",
                              roundAmt: accountData[i]["Amount_" + counter],
                              percentage: parseFloat(Percentage.slice(0, -1) || 0.0)
                            });
                          }
                          else{
                            totalGroupPeriodAmounts[counter-1].roundAmt += accountData[i]["Amount_" + counter];
                            totalGroupPeriodAmounts[counter-1].percentage += parseFloat(Percentage.slice(0, -1) || 0.0);
                          }
                        }
                        let totalAmountEx = utilityService.modifynegativeCurrencyFormat( totalAmount ) || 0.0;
                        let totalRoundAmount = Math.round(totalAmount) || 0;

                        dataList = {
                          id: accountData[i]["AccountID"] || "",
                          accounttype: accountType || "",
                          accounttypeshort: accountData[i]["AccountType"] || "",
                          accountname: accountData[i]["AccountName"] || "",
                          accountheaderorder: accountData[i]["AccountHeaderOrder"] || "",
                          accountno: accountData[i]["AccountNo"] || "",
                          totalamountex: totalAmountEx || 0.0,
                          periodAmounts: periodAmounts,
                          totalroundamountex: totalRoundAmount,
                          name: $.trim(accountData[i]["AccountName"])
                            .split(" ")
                            .join("_"),
                          // totaltax: totalTax || 0.00
                        };
    
                        if( dataList.totalroundamountex !== 0 ) {
                          records.push(dataList);
                        }

                        totalGroupAmount += totalAmount;
                      }
                    }
                  }

                  if(profitandlosslayout[m].subAccounts.length > 0 && totalGroupPeriodAmounts.length > 0){
                    for (let counter = 1; counter <= compPeriod; counter++) {
                      totalGroupPeriodAmounts[counter-1].decimalAmt = utilityService.modifynegativeCurrencyFormat( totalGroupPeriodAmounts[counter-1].roundAmt ) || 0.0;
                      totalGroupPeriodAmounts[counter-1].percentage = totalGroupPeriodAmounts[counter-1].percentage.toFixed(1) + "%";
                    }

                    let totalAmountEx = utilityService.modifynegativeCurrencyFormat( totalGroupAmount ) || 0.0;
                    let totalRoundAmount = Math.round(totalGroupAmount) || 0;

                    dataList = {
                      id: 0,
                      accounttype: "Total "+profitandlosslayout[m].AccountName || "",
                      accounttypeshort: profitandlosslayout[m].AccountName || "",
                      accountname: "",
                      accountheaderorder: profitandlosslayout[m].AccountName || "",
                      accountno: "",
                      totalamountex: totalAmountEx || 0.0,
                      totalroundamountex: totalRoundAmount,
                      periodAmounts: totalGroupPeriodAmounts,
                      name: "",
                    };
    
                    if( dataList.totalroundamountex !== 0 ) {
                      records.push(dataList);
                    }
                  }
                }
                // for (let i = 0; i < accountData.length; i++) {
                //   if (accountData[i]["AccountTypeDesc"].replace(/\s/g, "") == "") {
                //     accountType = "";
                //   } else {
                //     accountType = accountData[i]["AccountTypeDesc"];
                //   }
                //   let compPeriod = options.compPeriod + 1;
                //   let periodAmounts = [];
                //   let totalAmount = 0;
                //   for (let counter = 1; counter <= compPeriod; counter++) {
                //     if (i == 0) {
                //       options.threcords.push(accountData[i]["DateDesc_" + counter]);
                //     }
                //     totalAmount += accountData[i]["Amount_" + counter];
                //     let AmountEx = utilityService.modifynegativeCurrencyFormat( accountData[i]["Amount_" + counter] ) || 0.0;
                //     let RoundAmount = Math.round(accountData[i]["Amount_" + counter]) || 0;
                //     let Percentage = accountData[i]["Percentage_" + counter];
                //     periodAmounts.push({
                //       decimalAmt: AmountEx,
                //       roundAmt: RoundAmount,
                //       percentage: Percentage,
                //     });
                //   }
                //     let totalAmountEx = utilityService.modifynegativeCurrencyFormat( totalAmount ) || 0.0;
                //     let totalRoundAmount = Math.round(totalAmount) || 0;
                //     if ( accountData[i]["AccountHeaderOrder"].replace(/\s/g, "") == "" &&  accountType != "" ) {
                //       dataList = {
                //         id: accountData[i]["AccountID"] || "",
                //         accounttype: accountType || "",
                //         accounttypeshort: accountData[i]["AccountType"] || "",
                //         accountname: accountData[i]["AccountName"] || "",
                //         accountheaderorder: accountData[i]["AccountHeaderOrder"] || "",
                //         accountno: accountData[i]["AccountNo"] || "",
                //         totalamountex: "",
                //         totalroundamountex: "",
                //         periodAmounts: "",
                //         name: $.trim(accountData[i]["AccountName"])
                //           .split(" ")
                //           .join("_"),
                //       };
                //     } else {
                //       dataList = {
                //         id: accountData[i]["AccountID"] || "",
                //         accounttype: accountType || "",
                //         accounttypeshort: accountData[i]["AccountType"] || "",
                //         accountname: accountData[i]["AccountName"] || "",
                //         accountheaderorder: accountData[i]["AccountHeaderOrder"] || "",
                //         accountno: accountData[i]["AccountNo"] || "",
                //         totalamountex: totalAmountEx || 0.0,
                //         periodAmounts: periodAmounts,
                //         totalroundamountex: totalRoundAmount,
                //         name: $.trim(accountData[i]["AccountName"])
                //           .split(" ")
                //           .join("_"),
                //         // totaltax: totalTax || 0.00
                //       };
                //     }

                //     if ( accountData[i]["AccountType"].replace(/\s/g, "") == "" && accountType == "" ) {
                //     } else {
                //         if( dataList.totalroundamountex !== 0 ) {
                //           records.push(dataList);
                //         }
                //     }
                // }

                // Set Table Data
                options.showPercentage = true;
                templateObject.reportOptions.set(options);
                templateObject.records.set(records);
                // localStorage.setItem('VS1ProfitAndLoss_Report_Options', JSON.stringify(options) || '');
                // localStorage.setItem('VS1ProfitAndLoss_Report', JSON.stringify(records) || '');
                if (templateObject.records.get()) {
                  setTimeout(function () {
                    $("td a").each(function () {
                      if ( $(this).text().indexOf("-" + Currency) >= 0 ) {
                        $(this).addClass("text-danger");
                        $(this).removeClass("fgrblue");
                      }
                    });
                    $("td").each(function () {
                      if ( $(this).text().indexOf("-" + Currency) >= 0 ) {
                        $(this).addClass("text-danger");
                        $(this).removeClass("fgrblue");
                      }
                    });
                  }, 50);
                }
                setTimeout(function () {
                  $(".pnlTable").show();
                  $(".fullScreenSpin").css("display", "none");
                }, 100);
              }
            });
            // data = data.response;

            //let data = await reportService.getProfitandLossCompare( dateFrom, dateTo, false, periodMonths );

          } catch (err) {
            $(".fullScreenSpin").css("display", "none");
          }
        } else {
          try {
            options.threcords = [];
            let fromYear = moment(dateFrom).format("YYYY");
            let toYear = moment(dateTo).format("YYYY");
            let dateRange = [];
            if (toYear === fromYear) {
              dateRange.push(moment(dateFrom).format("DD MMM") + "-" + moment(dateTo).format("DD MMM") + " " + toYear );
            } else {
              dateRange.push( moment(dateFrom).format("DD MMM YYYY") + "-" + moment(dateTo).format("DD MMM YYYY") );
            }
            options.threcords = dateRange;
            let departments = options.departments.length ? options.departments.join(",") : "";

            reportService.getProfitandLoss( dateFrom, dateTo, false, departments ).then(function(data) {
              let records = [];
              if (data.profitandlossreport) {
                let accountData = data.profitandlossreport;
                let accountType = "";
                var dataList = "";
                for (let i = 0; i < accountData.length; i++) {
                  if (accountData[i]["Account Type"].replace(/\s/g, "") == "") {
                    accountType = "";
                  } else {
                    accountType = accountData[i]["Account Type"];
                  }
                  let periodAmounts = []
                  var totalAmount = accountData[i]["TotalAmountEx"];
                  let totalAmountEx = utilityService.modifynegativeCurrencyFormat( accountData[i]["TotalAmountEx"] ) || 0.0;
                  let totalRoundAmount = Math.round(accountData[i]["TotalAmountEx"]) || 0;
                  // let Percentage = accountData[i]["Percentage_" + counter];
                  periodAmounts.push({
                    decimalAmt: totalAmountEx,
                    roundAmt: totalRoundAmount,
                    // percentage: Percentage,
                  });
                  
                  if( options.departments.length ){
                    options.departments.forEach(dept => {
                      totalAmount += accountData[i][dept+"_AmountColumnEx"];
                      let deptAmountEx = utilityService.modifynegativeCurrencyFormat( accountData[i][dept+"_AmountColumnEx"] ) || 0.0;
                      let deptRoundAmount = Math.round(accountData[i][dept+"_AmountColumnEx"]) || 0;
                      if( i == 0 ){
                        options.threcords.push( dept );
                      }
                      periodAmounts.push({
                        decimalAmt: deptAmountEx,
                        roundAmt: deptRoundAmount,
                      });
                    });
                  }

                  if (
                    accountData[i]["AccountHeaderOrder"].replace(/\s/g, "") == "" &&
                    accountType != "" &&
                    accountData[i]["TotalAmountEx"] == ""
                  ) {
                    dataList = {
                      id: accountData[i]["AccountID"] || "",
                      accounttype: accountType || "",
                      accounttypeshort: accountData[i]["AccountType"] || "",
                      accountname: accountData[i]["AccountName"] || "",
                      accountheaderorder: accountData[i]["AccountHeaderOrder"] || "",
                      accountno: accountData[i]["AccountNo"] || "",
                      totalamountex: "",
                      periodAmounts: "",
                      totalroundamountex: "",
                      name: $.trim(accountData[i]["AccountName"])
                        .split(" ")
                        .join("_"),
                    };
                  } else {
                    dataList = {
                      id: accountData[i]["AccountID"] || "",
                      accounttype: accountType || "",
                      accounttypeshort: accountData[i]["AccountType"] || "",
                      accountname: accountData[i]["AccountName"] || "",
                      accountheaderorder: accountData[i]["AccountHeaderOrder"] || "",
                      accountno: accountData[i]["AccountNo"] || "",
                      totalamountex: totalAmountEx || 0.0,
                      totalroundamountex: totalRoundAmount,
                      periodAmounts: periodAmounts,
                      name: $.trim(accountData[i]["AccountName"])
                        .split(" ")
                        .join("_"),
                      // totaltax: totalTax || 0.00
                    };
                  }

                  if ( accountData[i]["AccountType"].replace(/\s/g, "") == "" && accountType == "" ) {
                  } else {
                    if( dataList.totalroundamountex !== 0 ) {
                      records.push(dataList);
                    }
                  }
                }

                // Set Table Data
                options.showPercentage = false;
                templateObject.reportOptions.set(options);
                templateObject.records.set(records);
                // localStorage.setItem('VS1ProfitAndLoss_Report_Options', JSON.stringify(options) || '');
                // localStorage.setItem('VS1ProfitAndLoss_Report', JSON.stringify(records) || '');
                if (templateObject.records.get()) {
                  setTimeout(function () {
                    $("td a").each(function () {
                      if ( $(this).text().indexOf("-" + Currency) >= 0 ) {
                        $(this).addClass("text-danger");
                        $(this).removeClass("fgrblue");
                      }
                    });
                    $("td").each(function () {
                      if ($(this).text().indexOf("-" + Currency) >= 0) {
                        $(this).addClass("text-danger");
                        $(this).removeClass("fgrblue");
                      }
                    });
                  }, 50);
                }
                setTimeout(function () {
                  $(".pnlTable").show();
                  $(".fullScreenSpin").css("display", "none");
                }, 100);
              }
            });

            // data = data.response;
            //let data = await reportService.getProfitandLoss( dateFrom, dateTo, false, departments );
          } catch (error) {
            $(".fullScreenSpin").css("display", "none");
          }
        }
      }, 500);
    // }else{
    //   let options = JSON.parse(localStorage.getItem('VS1ProfitAndLoss_Report_Options'));
    //   let records = JSON.parse(localStorage.getItem('VS1ProfitAndLoss_Report'));
    //   templateObject.reportOptions.set(options);
    //   templateObject.records.set(records);
    //   if (templateObject.records.get()) {
    //     setTimeout(function () {
    //       $("td a").each(function () {
    //         if ( $(this).text().indexOf("-" + Currency) >= 0 ) {
    //           $(this).addClass("text-danger");
    //           $(this).removeClass("fgrblue");
    //         }
    //       });
    //       $("td").each(function () {
    //         if ($(this).text().indexOf("-" + Currency) >= 0) {
    //           $(this).addClass("text-danger");
    //           $(this).removeClass("fgrblue");
    //         }
    //       });
    //       $(".fullScreenSpin").css("display", "none");
    //     }, 500);
    //   }
    // }
  };

  if (url.indexOf("?dateFrom") > 0) {
    localStorage.setItem("VS1ProfitandLoss_ReportCompare", "");
    url = new URL(window.location.href);
    var getDateFrom = url.searchParams.get("dateFrom");
    var getLoadDate = url.searchParams.get("dateTo");
    if( typeof getDateFrom === undefined || getDateFrom == "" || getDateFrom === null){
      let currentUrl = FlowRouter.current().queryParams;
      getDateFrom = currentUrl.dateFrom
      getLoadDate = currentUrl.dateTo
    }
    setTimeout(function () {
      $("#dateFrom").val(moment(getDateFrom).format('DD/MM/YYYY'));
      $("#dateTo").val(moment(getLoadDate).format('DD/MM/YYYY'));
    }, 1000);    
    localStorage.setItem('VS1ProfitAndLoss_Report', '');
    getVS1Data("TPNLLayout")
      .then(function (dataObject) {
        if (dataObject.length == 0) {
          reportService.getPNLLayout().then(function(data) {
            addVS1Data("TPNLLayout", JSON.stringify(data));
            if(data.tpnllayout.length > 0){
              for(var i=0; i<data.tpnllayout.length; i++){
                if(data.tpnllayout[i].IsCurrentLayout == true){                
                  $("#nplLayoutID").val(data.tpnllayout[i].Id);
                  $("#sltLaybout").val(data.tpnllayout[i].LName);
                  $("#nplLayoutName").val(data.tpnllayout[i].LName);
                  $("#nplLayoutDescr").val(data.tpnllayout[i].Description);
                  $("#npldefaultSettting").prop('checked', data.tpnllayout[i].IsCurrentLayout);
                  templateObject.setReportOptions(0, getDateFrom, getLoadDate);
                  break;
                }
              }
            }
          });          
        } else {
          let data = JSON.parse(dataObject[0].data);
          if(data.tpnllayout.length > 0){
            for(var i=0; i<data.tpnllayout.length; i++){
              if(data.tpnllayout[i].IsCurrentLayout == true){                
                $("#nplLayoutID").val(data.tpnllayout[i].Id);
                $("#sltLaybout").val(data.tpnllayout[i].LName);
                $("#nplLayoutName").val(data.tpnllayout[i].LName);
                $("#nplLayoutDescr").val(data.tpnllayout[i].Description);
                $("#npldefaultSettting").prop('checked', data.tpnllayout[i].IsCurrentLayout);
                templateObject.setReportOptions(0, getDateFrom, getLoadDate);
                break;
              }
            }
          }
        }
      })
      .catch(function (err) {
        reportService.getPNLLayout().then(function(data) {
          addVS1Data("TPNLLayout", JSON.stringify(data));
          if(data.tpnllayout.length > 0){
            for(var i=0; i<data.tpnllayout.length; i++){
              if(data.tpnllayout[i].IsCurrentLayout == true){                
                $("#nplLayoutID").val(data.tpnllayout[i].Id);
                $("#sltLaybout").val(data.tpnllayout[i].LName);
                $("#nplLayoutName").val(data.tpnllayout[i].LName);
                $("#nplLayoutDescr").val(data.tpnllayout[i].Description);
                $("#npldefaultSettting").prop('checked', data.tpnllayout[i].IsCurrentLayout);
                templateObject.setReportOptions(0, getDateFrom, getLoadDate);
                break;
              }
            }
          }
        });
      });
  } else if (url.indexOf("?daterange") > 0) {
    let currentDate2 = new Date();
    let fromDate = moment(currentDate2).subtract(3, "months").format("YYYY-MM-DD");
    let endDate = moment(currentDate2).format("YYYY-MM-DD");
    if (url.indexOf("?daterange=monthly") > 0) {
      fromDate = moment().startOf("month").format("YYYY-MM-DD");
      endDate = moment().endOf("month").format("YYYY-MM-DD");
      templateObject.daterange.set("- Monthly");
    }
    if (url.indexOf("?daterange=quarterly") > 0) {
      fromDate = moment().startOf("Q").format("YYYY-MM-DD");
      endDate = moment().endOf("Q").format("YYYY-MM-DD");
      templateObject.daterange.set("- Quarterly");
    }
    if (url.indexOf("?daterange=yearly") > 0) {
      if (moment().quarter() == 4) {
        fromDate = moment().month("July").startOf("month").format("YYYY-MM-DD");
        endDate = moment().add(1, "year").month("June").endOf("month").format("YYYY-MM-DD");
      } else {
        fromDate = moment().subtract(1, "year").month("July").startOf("month").format("YYYY-MM-DD");
        endDate = moment().month("June").endOf("month").format("YYYY-MM-DD");
      }
      templateObject.daterange.set("- Yearly");
    }
    if (url.indexOf("?daterange=ytd") > 0) {
      fromDate = moment().month("january").startOf("month").format("YYYY-MM-DD");
      endDate = moment().format("YYYY-MM-DD");
      templateObject.daterange.set("- YTD");
    }
    localStorage.setItem('VS1ProfitAndLoss_Report', '');
    getVS1Data("TPNLLayout")
      .then(function (dataObject) {
        if (dataObject.length == 0) {
          reportService.getPNLLayout().then(function(data) {
            addVS1Data("TPNLLayout", JSON.stringify(data));
            if(data.tpnllayout.length > 0){
              for(var i=0; i<data.tpnllayout.length; i++){
                if(data.tpnllayout[i].IsCurrentLayout == true){                
                  $("#nplLayoutID").val(data.tpnllayout[i].Id);
                  $("#sltLaybout").val(data.tpnllayout[i].LName);
                  $("#nplLayoutName").val(data.tpnllayout[i].LName);
                  $("#nplLayoutDescr").val(data.tpnllayout[i].Description);
                  $("#npldefaultSettting").prop('checked', data.tpnllayout[i].IsCurrentLayout);
                  templateObject.setReportOptions(0, fromDate, endDate);
                  break;
                }
              }
            }
          });          
        } else {
          let data = JSON.parse(dataObject[0].data);
          if(data.tpnllayout.length > 0){
            for(var i=0; i<data.tpnllayout.length; i++){
              if(data.tpnllayout[i].IsCurrentLayout == true){                
                $("#nplLayoutID").val(data.tpnllayout[i].Id);
                $("#sltLaybout").val(data.tpnllayout[i].LName);
                $("#nplLayoutName").val(data.tpnllayout[i].LName);
                $("#nplLayoutDescr").val(data.tpnllayout[i].Description);
                $("#npldefaultSettting").prop('checked', data.tpnllayout[i].IsCurrentLayout);
                templateObject.setReportOptions(0, fromDate, endDate);
                break;
              }
            }
          }
        }
      })
      .catch(function (err) {
        reportService.getPNLLayout().then(function(data) {
          addVS1Data("TPNLLayout", JSON.stringify(data));
          if(data.tpnllayout.length > 0){
            for(var i=0; i<data.tpnllayout.length; i++){
              if(data.tpnllayout[i].IsCurrentLayout == true){                
                $("#nplLayoutID").val(data.tpnllayout[i].Id);
                $("#sltLaybout").val(data.tpnllayout[i].LName);
                $("#nplLayoutName").val(data.tpnllayout[i].LName);
                $("#nplLayoutDescr").val(data.tpnllayout[i].Description);
                $("#npldefaultSettting").prop('checked', data.tpnllayout[i].IsCurrentLayout);
                templateObject.setReportOptions(0, fromDate, endDate);
                break;
              }
            }
          }
        });
      });
  } else {
    var currentDate2 = new Date();
    var getLoadDate = moment(currentDate2).format("YYYY-MM-DD");
    let getDateFrom = moment(currentDate2).subtract(3, "months").format("YYYY-MM-DD");
    getVS1Data("TPNLLayout")
      .then(function (dataObject) {
        if (dataObject.length == 0) {
          reportService.getPNLLayout().then(function(data) {
            addVS1Data("TPNLLayout", JSON.stringify(data));
            if(data.tpnllayout.length > 0){
              for(var i=0; i<data.tpnllayout.length; i++){
                if(data.tpnllayout[i].IsCurrentLayout == true){                
                  $("#nplLayoutID").val(data.tpnllayout[i].Id);
                  $("#sltLaybout").val(data.tpnllayout[i].LName);
                  $("#nplLayoutName").val(data.tpnllayout[i].LName);
                  $("#nplLayoutDescr").val(data.tpnllayout[i].Description);
                  $("#npldefaultSettting").prop('checked', data.tpnllayout[i].IsCurrentLayout);
                  templateObject.setReportOptions(defaultPeriod, getDateFrom, getLoadDate);
                  break;
                }
              }
            }
          });          
        } else {
          let data = JSON.parse(dataObject[0].data);
          if(data.tpnllayout.length > 0){
            for(var i=0; i<data.tpnllayout.length; i++){
              if(data.tpnllayout[i].IsCurrentLayout == true){                
                $("#nplLayoutID").val(data.tpnllayout[i].Id);
                $("#sltLaybout").val(data.tpnllayout[i].LName);
                $("#nplLayoutName").val(data.tpnllayout[i].LName);
                $("#nplLayoutDescr").val(data.tpnllayout[i].Description);
                $("#npldefaultSettting").prop('checked', data.tpnllayout[i].IsCurrentLayout);
                templateObject.setReportOptions(defaultPeriod, getDateFrom, getLoadDate);
                break;
              }
            }
          }
        }
      })
      .catch(function (err) {
        reportService.getPNLLayout().then(function(data) {
          addVS1Data("TPNLLayout", JSON.stringify(data));
          if(data.tpnllayout.length > 0){
            for(var i=0; i<data.tpnllayout.length; i++){
              if(data.tpnllayout[i].IsCurrentLayout == true){                
                $("#nplLayoutID").val(data.tpnllayout[i].Id);
                $("#sltLaybout").val(data.tpnllayout[i].LName);
                $("#nplLayoutName").val(data.tpnllayout[i].LName);
                $("#nplLayoutDescr").val(data.tpnllayout[i].Description);
                $("#npldefaultSettting").prop('checked', data.tpnllayout[i].IsCurrentLayout);
                templateObject.setReportOptions(defaultPeriod, getDateFrom, getLoadDate);
                break;
              }
            }
          }
        });
      });
  }

  templateObject.initDate = () => {
    Datehandler.initOneMonth();
  };

  templateObject.initDate();

  templateObject.getDepartments = function () {
    getVS1Data("TDeptClass")
      .then(function (dataObject) {
        if (dataObject.length == 0) {
          productService.getDepartment().then(function (data) {
            //let deptArr = [];
            for (let i in data.tdeptclass) {
              let deptrecordObj = {
                id: data.tdeptclass[i].Id || " ",
                department: data.tdeptclass[i].DeptClassName || " ",
              };
              deptrecords.push(deptrecordObj);
              templateObject.departments.set(deptrecords);
            }
          });
        } else {
          let data = JSON.parse(dataObject[0].data);
          let useData = data.tdeptclass;
          for (let i in useData) {
            let deptrecordObj = {
              id: useData[i].Id || " ",
              department: useData[i].DeptClassName || " ",
            };
            //deptArr.push(data.tdeptclass[i].DeptClassName);
            deptrecords.push(deptrecordObj);
            templateObject.departments.set(deptrecords);
          }
        }
      })
      .catch(function (err) {
        productService.getDepartment().then(function (data) {
          //let deptArr = [];
          for (let i in data.tdeptclass) {
            let deptrecordObj = {
              id: data.tdeptclass[i].Id || " ",
              department: data.tdeptclass[i].DeptClassName || " ",
            };
            //deptArr.push(data.tdeptclass[i].DeptClassName);
            deptrecords.push(deptrecordObj);
            templateObject.departments.set(deptrecords);
          }
        });
      });
  };
  // templateObject.getAllProductData();
  //templateObject.getDepartments();

  TemplateInjector.addDepartments(templateObject);
/*
  templateObject.getProfitLossLayout = async function () {
    // const profitLossLayoutApi = new ProfitLossLayoutApi();

    // const profitLossLayoutEndpoint = profitLossLayoutApi.collection.findByName(
    //   profitLossLayoutApi.collectionNames.TProfitLossLayout
    // );

    // Fetch a default layout
    let id = parseInt($("#nplLayoutID").val());
    reportService.getProfitLossLayout(id).then(function(data){
      let newprofitLossLayouts = [];
      if(data.ProcessLog.PNLLayout.Lines != undefined){
        for(var i=0; i<data.ProcessLog.PNLLayout.Lines.length; i++){
          if(data.ProcessLog.PNLLayout.Lines[i].Parent == 0){
            let subAccounts = [];
            for(var j=0; j<data.ProcessLog.PNLLayout.Lines.length; j++){
              if(data.ProcessLog.PNLLayout.Lines[i].ID == data.ProcessLog.PNLLayout.Lines[j].Parent){
                let subAccounts1 = [];
                for(var k=0; k<data.ProcessLog.PNLLayout.Lines.length; k++){
                  if(data.ProcessLog.PNLLayout.Lines[j].ID == data.ProcessLog.PNLLayout.Lines[k].Parent){
                    let subAccounts2 = [];
                    for(var m=0; m<data.ProcessLog.PNLLayout.Lines.length; m++){
                      if(data.ProcessLog.PNLLayout.Lines[k].ID == data.ProcessLog.PNLLayout.Lines[m].Parent){
                        let jsonObj3 = {
                          ID: data.ProcessLog.PNLLayout.Lines[m].ID,
                          AccountName: data.ProcessLog.PNLLayout.Lines[m].Level4,
                          Pos: data.ProcessLog.PNLLayout.Lines[m].Pos,
                        }
                        subAccounts2.push(jsonObj3);
                      }
                    }
                    let jsonObj2 = {
                      ID: data.ProcessLog.PNLLayout.Lines[k].ID,
                      AccountName: data.ProcessLog.PNLLayout.Lines[k].Level3,
                      Pos: data.ProcessLog.PNLLayout.Lines[k].Pos,
                      subAccounts: subAccounts2
                    }
                    subAccounts1.push(jsonObj2);
                  }
                }
                let jsonObj1 = {
                  ID: data.ProcessLog.PNLLayout.Lines[j].ID,
                  AccountName: data.ProcessLog.PNLLayout.Lines[j].Level2,
                  Pos: data.ProcessLog.PNLLayout.Lines[j].Pos,
                  subAccounts: subAccounts1
                }
                subAccounts.push(jsonObj1);
              }
            }
            let jsonObj = {
              ID: data.ProcessLog.PNLLayout.Lines[i].ID,
              AccountName: data.ProcessLog.PNLLayout.Lines[i].Level1,
              Pos: data.ProcessLog.PNLLayout.Lines[i].Pos,
              subAccounts: subAccounts,
            }
            newprofitLossLayouts.push(jsonObj);
          }
        }
      }
      templateObject.profitlosslayoutrecords.set(newprofitLossLayouts);

      // handle Dragging and sorting
      setTimeout(function () {
        $("ol.nested_with_switch").empty();
        let sortablelisthtml = "";
        for(var i=0; i<newprofitLossLayouts.length; i++){       //{#each item in profitlosslayoutrecords }}
            sortablelisthtml += `<li key="layoutFields-${newprofitLossLayouts[i].ID}" plid="${newprofitLossLayouts[i].ID}" data-group="${newprofitLossLayouts[i].AccountName}" position="${newprofitLossLayouts[i].Level0Order}" class="mainList pSortItems">
              <div class="mainHeadingDiv">
                  <h1 class="mainHeading"><span class="collepsDiv fas"></span>${newprofitLossLayouts[i].AccountName}</h1>
              </div>
              <ol class="groupedListNew" parent="${newprofitLossLayouts[i].Level0Order}">`;
              for(var j=0; j<newprofitLossLayouts[i].subAccounts.length; j++){
                  if(newprofitLossLayouts[i].subAccounts[j].subAccounts.length < 1){
                    sortablelisthtml += `<li class="subChild cSortItems" data-group="${newprofitLossLayouts[i].subAccounts[j].AccountName}" plid="${newprofitLossLayouts[i].subAccounts[j].ID}" key="layoutFields-${newprofitLossLayouts[i].subAccounts[j].ID}" position="${newprofitLossLayouts[i].subAccounts[j].Level1Order}">
                        <span class="childInner">
                            <span class="collepsDiv fas"></span>${newprofitLossLayouts[i].subAccounts[j].AccountName}
                        </span>
                    </li>`;
                  }
                  else{
                    sortablelisthtml += `<li class="subChild noDrag cSortItems" plid="${newprofitLossLayouts[i].subAccounts[j].ID}" data-group="${newprofitLossLayouts[i].subAccounts[j].AccountName}" key="layoutFields-${newprofitLossLayouts[i].subAccounts[j].ID}" position="${newprofitLossLayouts[i].subAccounts[j].Level1Order}">
                      <span class="childInner">
                          <span class="collepsDiv fas"></span><strong>${newprofitLossLayouts[i].subAccounts[j].AccountName}</strong>
                      </span>
                      <ol class="ddllkk" parent="${newprofitLossLayouts[i].subAccounts[j].Level1Order}">`;
                      for(var k=0; k<newprofitLossLayouts[i].subAccounts[j].subAccounts.length; k++){
                        if(newprofitLossLayouts[i].subAccounts[j].subAccounts[k].subAccounts.length < 1){
                          sortablelisthtml += `<li class="subChild scSortItems" plid="${newprofitLossLayouts[i].subAccounts[j].subAccounts[k].ID}" data-group="${newprofitLossLayouts[i].subAccounts[j].subAccounts[k].AccountName}" key="layoutFields-${newprofitLossLayouts[i].subAccounts[j].subAccounts[k].ID}" position="${newprofitLossLayouts[i].subAccounts[j].subAccounts[k].Level2Order}">
                              <span class="childInner">
                                  <span class="collepsDiv fas"></span>${newprofitLossLayouts[i].subAccounts[j].subAccounts[k].AccountName}
                              </span>
                          </li>`;
                        }
                        else{
                          sortablelisthtml += `<li class="subChild noDrag scSortItems" plid="${newprofitLossLayouts[i].subAccounts[j].subAccounts[k].ID}" data-group="${newprofitLossLayouts[i].subAccounts[j].subAccounts[k].AccountName}" key="layoutFields-${newprofitLossLayouts[i].subAccounts[j].subAccounts[k].ID}" position="${newprofitLossLayouts[i].subAccounts[j].subAccounts[k].Level2Order}">
                              <span class="childInner">
                                  <span class="collepsDiv fas"></span><strong>{{ subacItem.AccountName }}</strong>
                              </span>
                              <ol class="ddllkk"></ol>
                          </li>`;
                        }
                      }
                    sortablelisthtml += `</ol>
                    </li>`;
                  }
              }
            sortablelisthtml += `</ol></li>`;
        }
        $("ol.nested_with_switch").html(sortablelisthtml);

        // jquery-sortable js minified vversion v0.9.13
        !function($,f,c,g){var d,h={drag:!0,drop:!0,exclude:"",nested:!0,vertical:!0},i={afterMove:function(a,b,c){},containerPath:"",containerSelector:"ol, ul",distance:0,delay:0,handle:"",itemPath:"",itemSelector:"li",bodyClass:"dragging",draggedClass:"dragged",isValidTarget:function(a,b){return!0},onCancel:function(a,b,c,d){},onDrag:function(a,b,c,d){a.css(b)},onDragStart:function(a,b,c,d){a.css({height:a.outerHeight(),width:a.outerWidth()}),a.addClass(b.group.options.draggedClass),$("body").addClass(b.group.options.bodyClass)},onDrop:function(b,a,c,d){b.removeClass(a.group.options.draggedClass).removeAttr("style"),$("body").removeClass(a.group.options.bodyClass)},onMousedown:function(b,c,a){if(!a.target.nodeName.match(/^(input|select|textarea)$/i))return a.preventDefault(),!0},placeholderClass:"placeholder",placeholder:'<li class="placeholder"></li>',pullPlaceholder:!0,serialize:function(c,b,d){var a=$.extend({},c.data());return d?[b]:(b[0]&&(a.children=b),delete a.subContainers,delete a.sortable,a)},tolerance:0},j={},k=0,l={left:0,top:0,bottom:0,right:0},d={start:"touchstart.sortable mousedown.sortable",drop:"touchend.sortable touchcancel.sortable mouseup.sortable",drag:"touchmove.sortable mousemove.sortable",scroll:"scroll.sortable"},m="subContainers";function n(a,b){var c=Math.max(0,a[0]-b[0],b[0]-a[1]),d=Math.max(0,a[2]-b[1],b[1]-a[3]);return c+d}function o(e,f,a,g){var c=e.length,h=g?"offset":"position";for(a=a||0;c--;){var d=e[c].el?e[c].el:$(e[c]),b=d[h]();b.left+=parseInt(d.css("margin-left"),10),b.top+=parseInt(d.css("margin-top"),10),f[c]=[b.left-a,b.left+d.outerWidth()+a,b.top-a,b.top+d.outerHeight()+a]}}function p(a,c){var b=c.offset();return{left:a.left-b.left,top:a.top-b.top}}function q(e,b,a){b=[b.left,b.top],a=a&&[a.left,a.top];for(var d,c=e.length,f=[];c--;)d=e[c],f[c]=[c,n(d,b),a&&n(d,a)];return f.sort(function(a,b){return b[1]-a[1]||b[2]-a[2]||b[0]-a[0]})}function a(a){this.options=$.extend({},i,a),this.containers=[],this.options.rootGroup||(this.scrollProxy=$.proxy(this.scroll,this),this.dragProxy=$.proxy(this.drag,this),this.dropProxy=$.proxy(this.drop,this),this.placeholder=$(this.options.placeholder),a.isValidTarget||(this.options.isValidTarget=g))}function b(c,e){this.el=c,this.options=$.extend({},h,e),this.group=a.get(this.options),this.rootGroup=this.options.rootGroup||this.group,this.handle=this.rootGroup.options.handle||this.rootGroup.options.itemSelector;var b=this.rootGroup.options.itemPath;this.target=b?this.el.find(b):this.el,this.target.on(d.start,this.handle,$.proxy(this.dragInit,this)),this.options.drop&&this.group.containers.push(this)}a.get=function(b){return j[b.group]||(g===b.group&&(b.group=k++),j[b.group]=new a(b)),j[b.group]},a.prototype={dragInit:function(a,b){this.$document=$(b.el[0].ownerDocument);var c=$(a.target).closest(this.options.itemSelector);if(c.length){if(this.item=c,this.itemContainer=b,this.item.is(this.options.exclude)||!this.options.onMousedown(this.item,i.onMousedown,a))return;this.setPointer(a),this.toggleListeners("on"),this.setupDelayTimer(),this.dragInitDone=!0}},drag:function(a){if(!this.dragging){if(!this.distanceMet(a)||!this.delayMet)return;this.options.onDragStart(this.item,this.itemContainer,i.onDragStart,a),this.item.before(this.placeholder),this.dragging=!0}this.setPointer(a),this.options.onDrag(this.item,p(this.pointer,this.item.offsetParent()),i.onDrag,a);var c=this.getPointer(a),b=this.sameResultBox,d=this.options.tolerance;(!b||b.top-d>c.top||b.bottom+d<c.top||b.left-d>c.left||b.right+d<c.left)&&(this.searchValidTarget()||(this.placeholder.detach(),this.lastAppendedItem=g))},drop:function(a){this.toggleListeners("off"),this.dragInitDone=!1,this.dragging&&(this.placeholder.closest("html")[0]?this.placeholder.before(this.item).detach():this.options.onCancel(this.item,this.itemContainer,i.onCancel,a),this.options.onDrop(this.item,this.getContainer(this.item),i.onDrop,a),this.clearDimensions(),this.clearOffsetParent(),this.lastAppendedItem=this.sameResultBox=g,this.dragging=!1)},searchValidTarget:function(a,b){a||(a=this.relativePointer||this.pointer,b=this.lastRelativePointer||this.lastPointer);for(var c=q(this.getContainerDimensions(),a,b),d=c.length;d--;){var h=c[d][0],i=c[d][1];if(!i||this.options.pullPlaceholder){var e=this.containers[h];if(!e.disabled){if(!this.$getOffsetParent()){var f=e.getItemOffsetParent();a=p(a,f),b=p(b,f)}if(e.searchValidTarget(a,b))return!0}}}this.sameResultBox&&(this.sameResultBox=g)},movePlaceholder:function(d,a,e,b){var c=this.lastAppendedItem;(b||!c||c[0]!==a[0])&&(a[e](this.placeholder),this.lastAppendedItem=a,this.sameResultBox=b,this.options.afterMove(this.placeholder,d,a))},getContainerDimensions:function(){return this.containerDimensions||o(this.containers,this.containerDimensions=[],this.options.tolerance,!this.$getOffsetParent()),this.containerDimensions},getContainer:function(a){return a.closest(this.options.containerSelector).data(c)},$getOffsetParent:function(){if(g===this.offsetParent){var a=this.containers.length-1,b=this.containers[a].getItemOffsetParent();if(!this.options.rootGroup){for(;a--;)if(b[0]!=this.containers[a].getItemOffsetParent()[0]){b=!1;break}}this.offsetParent=b}return this.offsetParent},setPointer:function(b){var a=this.getPointer(b);if(this.$getOffsetParent()){var c=p(a,this.$getOffsetParent());this.lastRelativePointer=this.relativePointer,this.relativePointer=c}this.lastPointer=this.pointer,this.pointer=a},distanceMet:function(b){var a=this.getPointer(b);return Math.max(Math.abs(this.pointer.left-a.left),Math.abs(this.pointer.top-a.top))>=this.options.distance},getPointer:function(a){var b=a.originalEvent||a.originalEvent.touches&&a.originalEvent.touches[0];return{left:a.pageX||b.pageX,top:a.pageY||b.pageY}},setupDelayTimer:function(){var a=this;this.delayMet=!this.options.delay,this.delayMet||(clearTimeout(this._mouseDelayTimer),this._mouseDelayTimer=setTimeout(function(){a.delayMet=!0},this.options.delay))},scroll:function(a){this.clearDimensions(),this.clearOffsetParent()},toggleListeners:function(a){var b=this;$.each(["drag","drop","scroll"],function(e,c){b.$document[a](d[c],b[c+"Proxy"])})},clearOffsetParent:function(){this.offsetParent=g},clearDimensions:function(){this.traverse(function(a){a._clearDimensions()})},traverse:function(a){a(this);for(var b=this.containers.length;b--;)this.containers[b].traverse(a)},_clearDimensions:function(){this.containerDimensions=g},_destroy:function(){j[this.options.group]=g}},b.prototype={dragInit:function(a){var b=this.rootGroup;!this.disabled&&!b.dragInitDone&&this.options.drag&&this.isValidDrag(a)&&b.dragInit(a,this)},isValidDrag:function(a){return 1==a.which||"touchstart"==a.type&&1==a.originalEvent.touches.length},searchValidTarget:function(c,f){var d=q(this.getItemDimensions(),c,f),a=d.length,b=this.rootGroup,g=!b.options.isValidTarget||b.options.isValidTarget(b.item,this);if(!a&&g)return b.movePlaceholder(this,this.target,"append"),!0;for(;a--;){var e=d[a][0];if(!d[a][1]&&this.hasChildGroup(e)){if(this.getContainerGroup(e).searchValidTarget(c,f))return!0}else if(g)return this.movePlaceholder(e,c),!0}},movePlaceholder:function(e,i){var b=$(this.items[e]),c=this.itemDimensions[e],f="after",g=b.outerWidth(),h=b.outerHeight(),d=b.offset(),a={left:d.left,right:d.left+g,top:d.top,bottom:d.top+h};if(this.options.vertical){var j=(c[2]+c[3])/2;i.top<=j?(f="before",a.bottom-=h/2):a.top+=h/2}else{var k=(c[0]+c[1])/2;i.left<=k?(f="before",a.right-=g/2):a.left+=g/2}this.hasChildGroup(e)&&(a=l),this.rootGroup.movePlaceholder(this,b,f,a)},getItemDimensions:function(){return this.itemDimensions||(this.items=this.$getChildren(this.el,"item").filter(":not(."+this.group.options.placeholderClass+", ."+this.group.options.draggedClass+")").get(),o(this.items,this.itemDimensions=[],this.options.tolerance)),this.itemDimensions},getItemOffsetParent:function(){var a=this.el;return"relative"===a.css("position")||"absolute"===a.css("position")||"fixed"===a.css("position")?a:a.offsetParent()},hasChildGroup:function(a){return this.options.nested&&this.getContainerGroup(a)},getContainerGroup:function(b){var a=$.data(this.items[b],m);if(a===g){var d=this.$getChildren(this.items[b],"container");if(a=!1,d[0]){var e=$.extend({},this.options,{rootGroup:this.rootGroup,group:k++});a=d[c](e).data(c).group}$.data(this.items[b],m,a)}return a},$getChildren:function(a,b){var c=this.rootGroup.options,d=c[b+"Path"],e=c[b+"Selector"];return a=$(a),d&&(a=a.find(d)),a.children(e)},_serialize:function(a,b){var d=this,c=this.$getChildren(a,b?"item":"container").not(this.options.exclude).map(function(){return d._serialize($(this),!b)}).get();return this.rootGroup.options.serialize(a,c,b)},traverse:function(a){$.each(this.items||[],function(c){var b=$.data(this,m);b&&b.traverse(a)}),a(this)},_clearDimensions:function(){this.itemDimensions=g},_destroy:function(){var a=this;this.target.off(d.start,this.handle),this.el.removeData(c),this.options.drop&&(this.group.containers=$.grep(this.group.containers,function(b){return b!=a})),$.each(this.items||[],function(){$.removeData(this,m)})}};var e={enable:function(){this.traverse(function(a){a.disabled=!1})},disable:function(){this.traverse(function(a){a.disabled=!0})},serialize:function(){return this._serialize(this.el,!0)},refresh:function(){this.traverse(function(a){a._clearDimensions()})},destroy:function(){this.traverse(function(a){a._destroy()})}};$.extend(b.prototype,e),$.fn[c]=function(a){var d=Array.prototype.slice.call(arguments,1);return this.map(function(){var f=$(this),h=f.data(c);return h&&e[a]?e[a].apply(h,d)||this:(h||a!==g&&"object"!=typeof a||f.data(c,new b(f,a)),this)})}}(jQuery,window,"sortable")
        var oldContainer;
        var group = $("ol.nested_with_switch").sortable({
          group: "customSortableDiv",
          exclude: ".noDrag",
          afterMove: function (placeholder, container) {
            if (oldContainer != container) {
              if (oldContainer) oldContainer.el.removeClass("active");
              container.el.addClass("active");
              oldContainer = container;
            }
          },
          onDrop: function ($item, container, _super) {
            // On drag removing the dragged classs and colleps
            // if ($item.parents().hasClass("groupedListNew")) {
            // } else {
            //   $item.find(".mainHeadingDiv").removeClass("collapsTogls");
            // }
            container.el.removeClass("active");
            _super($item, container);
            let siblingClass = $item.siblings().attr("class");
            $item.removeClass("cSortItems");
            $item.removeClass("scSortItems");
            $item.addClass(siblingClass);
            $item.addClass("selected");

            let layoutID = parseInt($("#nplLayoutID").val());
            let groupID = parseInt($item.attr("plid"));
            let containerID = parseInt(container.el.parent().attr("plid")) || 0;
            let containerName = container.el.parent().attr("data-group") || "";

            $('.fullScreenSpin').css('display', 'inline-block');
            let jsonObj = {
              "Name": "VS1_PNLMoveAccount",
              "Params":{
                "LayoutID": layoutID,
                "Selected": groupID,
                "Destination": containerID,
              }
            }
            reportService.movePNLGroup(jsonObj).then(function(res){
              // var dateFrom = new Date($("#dateFrom").datepicker("getDate"));
              // var dateTo = new Date($("#dateTo").datepicker("getDate"));
              // templateObject.setReportOptions(3, dateFrom, dateTo);
              $('.fullScreenSpin').css('display', 'none');
            }).catch(function(err) {
                swal({
                    title: 'Oooops...',
                    text: err,
                    type: 'error',
                    showCancelButton: false,
                    confirmButtonText: 'Try Again'
                }).then((result) => {
                    if (result.value) {
                        // Meteor._reload.reload();
                    } else if (result.dismiss === 'cancel') {}
                });
                $('.fullScreenSpin').css('display', 'none');
            });
          }
        });

        $(".collepsDiv").click(function () {
          $(this).parents(".mainHeadingDiv").toggleClass("collapsTogls");
        });
        $(".childInner, .mainHeadingDiv").mousedown(function (e) {
          if (e.ctrlKey || e.metaKey) {
            let layoutgroupid = templateObject.layoutgroupid.get();
            layoutgroupid += (layoutgroupid == "") ? $(this).parent().attr("plid") : ","+$(this).parent().attr("plid")
            templateObject.layoutgroupid.set(layoutgroupid);
            $(".groupSection1").hide();
            $(".groupSection2").show();
          }
          else{
            $(this)
            .parents(".vertical")
            .find(".selected")
            .removeClass("selected");
            templateObject.layoutgroupid.set($(this).parent().attr("plid"));
            $(".groupSection1").show();
            $(".groupSection2").hide();
          }
          $(this).parents(".vertical").find(".selected").removeClass("dragged");
          $(this).parent().addClass("selected");
        });
        // $('.fullScreenSpin').css('display', 'none');
      }, 1000);
      // $('.fullScreenSpin').css('display', 'none');
    });
    // return false

    // profitLossLayoutEndpoint.url.searchParams.append("ListType", "'Detail'");

    // const profitLossLayoutEndResponse = await profitLossLayoutEndpoint.fetch();
    // if (profitLossLayoutEndResponse.ok == true) {
    //   let profitLossLayouts = [];
    //   let jsonResponse = await profitLossLayoutEndResponse.json();
    //   const profitLossLists = ProfitLossLayout.fromList(
    //     jsonResponse.tprofitandlossreport
    //   );

    //   // Save default list
    //   templateObject.profitlosslayoutfields.set(profitLossLists);

    //   profitLossLists.filter((item) => {
    //     if (
    //       item.fields.Level0Order != 0 &&
    //       item.fields.Level1Order == 0 &&
    //       item.fields.Level2Order == 0 &&
    //       item.fields.Level3Order == 0
    //     ) {
    //       profitLossLayouts.push(item.fields);
    //     }
    //   });

    //   let newprofitLossLayouts = [];
    //   // Fetch Subchilds According to the Above grouping
    //   profitLossLayouts.forEach(function (item) {
    //     let subAccounts = [];
    //     let childAccounts = [];
    //     let Level0Order = item.Level0Order;
    //     let ID = item.ID;
    //     profitLossLists.filter((subitem) => {
    //       let subLevel0Order = subitem.fields.Level0Order;
    //       let subID = subitem.fields.ID;
    //       if (subLevel0Order == Level0Order && ID != subID) {
    //         subitem.subAccounts = [];
    //         subAccounts.push(subitem.fields);
    //       }
    //     });

    //     childAccounts = subAccounts.filter((item) => {
    //       let sLevel0Order = item.Level0Order;
    //       let sLevel1Order = item.Level1Order;
    //       let sLevel2Order = item.Level2Order;
    //       let sID = item.ID;
    //       if (
    //         sLevel1Order != 0 &&
    //         sLevel0Order == Level0Order &&
    //         sLevel2Order == 0 &&
    //         sID != ID
    //       ) {
    //         let subSubAccounts = subAccounts.filter((subitem) => {
    //           let subID = subitem.ID;
    //           let subLevel0Order = subitem.Level0Order;
    //           let subLevel1Order = subitem.Level1Order;
    //           let subLevel2Order = subitem.Level2Order;
    //           if (
    //             sLevel1Order === subLevel1Order &&
    //             subLevel0Order == sLevel0Order &&
    //             sID != subID &&
    //             subLevel2Order != 0
    //           ) {
    //             return subitem;
    //           }
    //         });
    //         item.subAccounts = subSubAccounts;
    //         return item;
    //       }
    //     });

    //     newprofitLossLayouts.push({
    //       ...item,
    //       subAccounts: childAccounts,
    //     });
    //   });
    //   templateObject.profitlosslayoutrecords.set(newprofitLossLayouts);

    //   // handle Dragging and sorting
    //   // setTimeout(function () {
    //   //   // jquery-sortable js minified vversion v0.9.13
    //   //   !function($,f,c,g){var d,h={drag:!0,drop:!0,exclude:"",nested:!0,vertical:!0},i={afterMove:function(a,b,c){},containerPath:"",containerSelector:"ol, ul",distance:0,delay:0,handle:"",itemPath:"",itemSelector:"li",bodyClass:"dragging",draggedClass:"dragged",isValidTarget:function(a,b){return!0},onCancel:function(a,b,c,d){},onDrag:function(a,b,c,d){a.css(b)},onDragStart:function(a,b,c,d){a.css({height:a.outerHeight(),width:a.outerWidth()}),a.addClass(b.group.options.draggedClass),$("body").addClass(b.group.options.bodyClass)},onDrop:function(b,a,c,d){b.removeClass(a.group.options.draggedClass).removeAttr("style"),$("body").removeClass(a.group.options.bodyClass)},onMousedown:function(b,c,a){if(!a.target.nodeName.match(/^(input|select|textarea)$/i))return a.preventDefault(),!0},placeholderClass:"placeholder",placeholder:'<li class="placeholder"></li>',pullPlaceholder:!0,serialize:function(c,b,d){var a=$.extend({},c.data());return d?[b]:(b[0]&&(a.children=b),delete a.subContainers,delete a.sortable,a)},tolerance:0},j={},k=0,l={left:0,top:0,bottom:0,right:0},d={start:"touchstart.sortable mousedown.sortable",drop:"touchend.sortable touchcancel.sortable mouseup.sortable",drag:"touchmove.sortable mousemove.sortable",scroll:"scroll.sortable"},m="subContainers";function n(a,b){var c=Math.max(0,a[0]-b[0],b[0]-a[1]),d=Math.max(0,a[2]-b[1],b[1]-a[3]);return c+d}function o(e,f,a,g){var c=e.length,h=g?"offset":"position";for(a=a||0;c--;){var d=e[c].el?e[c].el:$(e[c]),b=d[h]();b.left+=parseInt(d.css("margin-left"),10),b.top+=parseInt(d.css("margin-top"),10),f[c]=[b.left-a,b.left+d.outerWidth()+a,b.top-a,b.top+d.outerHeight()+a]}}function p(a,c){var b=c.offset();return{left:a.left-b.left,top:a.top-b.top}}function q(e,b,a){b=[b.left,b.top],a=a&&[a.left,a.top];for(var d,c=e.length,f=[];c--;)d=e[c],f[c]=[c,n(d,b),a&&n(d,a)];return f.sort(function(a,b){return b[1]-a[1]||b[2]-a[2]||b[0]-a[0]})}function a(a){this.options=$.extend({},i,a),this.containers=[],this.options.rootGroup||(this.scrollProxy=$.proxy(this.scroll,this),this.dragProxy=$.proxy(this.drag,this),this.dropProxy=$.proxy(this.drop,this),this.placeholder=$(this.options.placeholder),a.isValidTarget||(this.options.isValidTarget=g))}function b(c,e){this.el=c,this.options=$.extend({},h,e),this.group=a.get(this.options),this.rootGroup=this.options.rootGroup||this.group,this.handle=this.rootGroup.options.handle||this.rootGroup.options.itemSelector;var b=this.rootGroup.options.itemPath;this.target=b?this.el.find(b):this.el,this.target.on(d.start,this.handle,$.proxy(this.dragInit,this)),this.options.drop&&this.group.containers.push(this)}a.get=function(b){return j[b.group]||(g===b.group&&(b.group=k++),j[b.group]=new a(b)),j[b.group]},a.prototype={dragInit:function(a,b){this.$document=$(b.el[0].ownerDocument);var c=$(a.target).closest(this.options.itemSelector);if(c.length){if(this.item=c,this.itemContainer=b,this.item.is(this.options.exclude)||!this.options.onMousedown(this.item,i.onMousedown,a))return;this.setPointer(a),this.toggleListeners("on"),this.setupDelayTimer(),this.dragInitDone=!0}},drag:function(a){if(!this.dragging){if(!this.distanceMet(a)||!this.delayMet)return;this.options.onDragStart(this.item,this.itemContainer,i.onDragStart,a),this.item.before(this.placeholder),this.dragging=!0}this.setPointer(a),this.options.onDrag(this.item,p(this.pointer,this.item.offsetParent()),i.onDrag,a);var c=this.getPointer(a),b=this.sameResultBox,d=this.options.tolerance;(!b||b.top-d>c.top||b.bottom+d<c.top||b.left-d>c.left||b.right+d<c.left)&&(this.searchValidTarget()||(this.placeholder.detach(),this.lastAppendedItem=g))},drop:function(a){this.toggleListeners("off"),this.dragInitDone=!1,this.dragging&&(this.placeholder.closest("html")[0]?this.placeholder.before(this.item).detach():this.options.onCancel(this.item,this.itemContainer,i.onCancel,a),this.options.onDrop(this.item,this.getContainer(this.item),i.onDrop,a),this.clearDimensions(),this.clearOffsetParent(),this.lastAppendedItem=this.sameResultBox=g,this.dragging=!1)},searchValidTarget:function(a,b){a||(a=this.relativePointer||this.pointer,b=this.lastRelativePointer||this.lastPointer);for(var c=q(this.getContainerDimensions(),a,b),d=c.length;d--;){var h=c[d][0],i=c[d][1];if(!i||this.options.pullPlaceholder){var e=this.containers[h];if(!e.disabled){if(!this.$getOffsetParent()){var f=e.getItemOffsetParent();a=p(a,f),b=p(b,f)}if(e.searchValidTarget(a,b))return!0}}}this.sameResultBox&&(this.sameResultBox=g)},movePlaceholder:function(d,a,e,b){var c=this.lastAppendedItem;(b||!c||c[0]!==a[0])&&(a[e](this.placeholder),this.lastAppendedItem=a,this.sameResultBox=b,this.options.afterMove(this.placeholder,d,a))},getContainerDimensions:function(){return this.containerDimensions||o(this.containers,this.containerDimensions=[],this.options.tolerance,!this.$getOffsetParent()),this.containerDimensions},getContainer:function(a){return a.closest(this.options.containerSelector).data(c)},$getOffsetParent:function(){if(g===this.offsetParent){var a=this.containers.length-1,b=this.containers[a].getItemOffsetParent();if(!this.options.rootGroup){for(;a--;)if(b[0]!=this.containers[a].getItemOffsetParent()[0]){b=!1;break}}this.offsetParent=b}return this.offsetParent},setPointer:function(b){var a=this.getPointer(b);if(this.$getOffsetParent()){var c=p(a,this.$getOffsetParent());this.lastRelativePointer=this.relativePointer,this.relativePointer=c}this.lastPointer=this.pointer,this.pointer=a},distanceMet:function(b){var a=this.getPointer(b);return Math.max(Math.abs(this.pointer.left-a.left),Math.abs(this.pointer.top-a.top))>=this.options.distance},getPointer:function(a){var b=a.originalEvent||a.originalEvent.touches&&a.originalEvent.touches[0];return{left:a.pageX||b.pageX,top:a.pageY||b.pageY}},setupDelayTimer:function(){var a=this;this.delayMet=!this.options.delay,this.delayMet||(clearTimeout(this._mouseDelayTimer),this._mouseDelayTimer=setTimeout(function(){a.delayMet=!0},this.options.delay))},scroll:function(a){this.clearDimensions(),this.clearOffsetParent()},toggleListeners:function(a){var b=this;$.each(["drag","drop","scroll"],function(e,c){b.$document[a](d[c],b[c+"Proxy"])})},clearOffsetParent:function(){this.offsetParent=g},clearDimensions:function(){this.traverse(function(a){a._clearDimensions()})},traverse:function(a){a(this);for(var b=this.containers.length;b--;)this.containers[b].traverse(a)},_clearDimensions:function(){this.containerDimensions=g},_destroy:function(){j[this.options.group]=g}},b.prototype={dragInit:function(a){var b=this.rootGroup;!this.disabled&&!b.dragInitDone&&this.options.drag&&this.isValidDrag(a)&&b.dragInit(a,this)},isValidDrag:function(a){return 1==a.which||"touchstart"==a.type&&1==a.originalEvent.touches.length},searchValidTarget:function(c,f){var d=q(this.getItemDimensions(),c,f),a=d.length,b=this.rootGroup,g=!b.options.isValidTarget||b.options.isValidTarget(b.item,this);if(!a&&g)return b.movePlaceholder(this,this.target,"append"),!0;for(;a--;){var e=d[a][0];if(!d[a][1]&&this.hasChildGroup(e)){if(this.getContainerGroup(e).searchValidTarget(c,f))return!0}else if(g)return this.movePlaceholder(e,c),!0}},movePlaceholder:function(e,i){var b=$(this.items[e]),c=this.itemDimensions[e],f="after",g=b.outerWidth(),h=b.outerHeight(),d=b.offset(),a={left:d.left,right:d.left+g,top:d.top,bottom:d.top+h};if(this.options.vertical){var j=(c[2]+c[3])/2;i.top<=j?(f="before",a.bottom-=h/2):a.top+=h/2}else{var k=(c[0]+c[1])/2;i.left<=k?(f="before",a.right-=g/2):a.left+=g/2}this.hasChildGroup(e)&&(a=l),this.rootGroup.movePlaceholder(this,b,f,a)},getItemDimensions:function(){return this.itemDimensions||(this.items=this.$getChildren(this.el,"item").filter(":not(."+this.group.options.placeholderClass+", ."+this.group.options.draggedClass+")").get(),o(this.items,this.itemDimensions=[],this.options.tolerance)),this.itemDimensions},getItemOffsetParent:function(){var a=this.el;return"relative"===a.css("position")||"absolute"===a.css("position")||"fixed"===a.css("position")?a:a.offsetParent()},hasChildGroup:function(a){return this.options.nested&&this.getContainerGroup(a)},getContainerGroup:function(b){var a=$.data(this.items[b],m);if(a===g){var d=this.$getChildren(this.items[b],"container");if(a=!1,d[0]){var e=$.extend({},this.options,{rootGroup:this.rootGroup,group:k++});a=d[c](e).data(c).group}$.data(this.items[b],m,a)}return a},$getChildren:function(a,b){var c=this.rootGroup.options,d=c[b+"Path"],e=c[b+"Selector"];return a=$(a),d&&(a=a.find(d)),a.children(e)},_serialize:function(a,b){var d=this,c=this.$getChildren(a,b?"item":"container").not(this.options.exclude).map(function(){return d._serialize($(this),!b)}).get();return this.rootGroup.options.serialize(a,c,b)},traverse:function(a){$.each(this.items||[],function(c){var b=$.data(this,m);b&&b.traverse(a)}),a(this)},_clearDimensions:function(){this.itemDimensions=g},_destroy:function(){var a=this;this.target.off(d.start,this.handle),this.el.removeData(c),this.options.drop&&(this.group.containers=$.grep(this.group.containers,function(b){return b!=a})),$.each(this.items||[],function(){$.removeData(this,m)})}};var e={enable:function(){this.traverse(function(a){a.disabled=!1})},disable:function(){this.traverse(function(a){a.disabled=!0})},serialize:function(){return this._serialize(this.el,!0)},refresh:function(){this.traverse(function(a){a._clearDimensions()})},destroy:function(){this.traverse(function(a){a._destroy()})}};$.extend(b.prototype,e),$.fn[c]=function(a){var d=Array.prototype.slice.call(arguments,1);return this.map(function(){var f=$(this),h=f.data(c);return h&&e[a]?e[a].apply(h,d)||this:(h||a!==g&&"object"!=typeof a||f.data(c,new b(f,a)),this)})}}(jQuery,window,"sortable")
    //   //   var oldContainer;
    //   //   var group = $("ol.nested_with_switch").sortable({
    //   //     group: "customSortableDiv",
    //   //     exclude: ".noDrag",

    //   //     afterMove: function (placeholder, container) {
    //   //       if (oldContainer != container) {
    //   //         if (oldContainer) oldContainer.el.removeClass("active");
    //   //         container.el.addClass("active");
    //   //         oldContainer = container;
    //   //       }
    //   //     },
    //   //     onDrop: function ($item, container, _super) {
    //   //       // On drag removing the dragged classs and colleps
    //   //       if ($item.parents().hasClass("groupedListNew")) {
    //   //       } else {
    //   //         $item.find(".mainHeadingDiv").removeClass("collapsTogls");
    //   //       }
    //   //       container.el.removeClass("active");
    //   //       _super($item, container);
    //   //       let siblingClass = $item.siblings().attr("class");
    //   //       $item.removeClass();
    //   //       $item.addClass(siblingClass);
    //   //       $item.addClass("selected");

    //   //     },
    //   //   });

    //   //   $(".collepsDiv").click(function () {
    //   //     $(this).parents(".mainHeadingDiv").toggleClass("collapsTogls");
    //   //   });
    //   //   $(".childInner, .mainHeadingDiv").mousedown(function () {
    //   //     $(this)
    //   //       .parents(".vertical")
    //   //       .find(".selected")
    //   //       .removeClass("selected");
    //   //     $(this).parents(".vertical").find(".selected").removeClass("dragged");
    //   //     $(this).parent().addClass("selected");
    //   //   });
    //   // }, 1000);
    // }
  };
  */
  // templateObject.getAllProductData();
  //templateObject.getDepartments();

  //Dragable items in edit layout screen
  //This works now: break at your own peril
  // setTimeout(function () {
  //   new layoutEditor(document.querySelector("#nplEditLayoutScreen"));
  // }, 1000);
  /*
  setTimeout(function(){

  $(".dragTable").sortable({
      revert: true,
       // cancel: ".tblAvoid"
  });
  $(".tblGroupAcc").sortable({
      revert: true,
     handle: ".tblAvoid"
  });
  $(".tblIndIvAcc").draggable({
      connectToSortable: ".tblGroupAcc",
      helper: "none",
      revert: "true"
  });
$('.tblAvoid').each(function(){
  $('.dragTable').append(<tbody class = "tblGroupAcc"></tbody>);
});
  $('.tblAvoid').nextAll('.tblIndIvAcc').css('background', 'red');
},3500);
*/

  //    $( "ul, li" ).disableSelection();
  //Dragable items in edit layout screen end
  /*Visually hide additional periods so that custom selection handles it*/

  // setTimeout(function () {
  //   $(".pnlTable").show();
  // }, 6000);
  /*Visual hide end*/
  // var eLayScreenArr = [];
  // var pnlTblArr = [];
  // var tbv1 = $('.fgrtotalName').length;
  // var tbv2 = $('.avoid').length;
  // for (let i = 0; i < tbv1; i++) {
  //     eLayScreenArr.push(i);
  // }
  // for (let k = 0; k < tbv2; k++) {
  //
  //     pnlTblArr.push(k);
  // }

  //            const sortArray = (eLayScreenArr, pnlTblArr) => {
  //                pnlTblArr.sort((a, b) => {
  //                    const aKey = Object.keys(a)[0];
  //                    const bKey = Object.keys(b)[0];
  //                    return eLayScreenArr.indexOf(aKey) - eLayScreenArr.indexOf(bKey);
  //                });
  //            };
  //            sortArray(eLayScreenArr, pnlTblArr);


  // LoadingOverlay.hide();

  $('#tblLayoutsList tbody').on('click', 'tr', function() {
      $(".fullScreenSpin").css("display", "inline-block");
      var layoutID = $(this).closest('tr').find(".colID").text();
      var layoutName = $(this).closest('tr').find(".colLayoutName").text();
      var layoutDesc = $(this).closest('tr').find(".colLayoutDescription").text();
      var currentLayout = $(this).closest('tr').find(".colCurrentLayout").text();
      $("#sltLaybout").val(layoutName);
      $("#nplLayoutID").val(layoutID);
      $("#nplLayoutName").val(layoutName);
      $("#nplLayoutDescr").val(layoutDesc);
      if(currentLayout == "true"){
        $("#npldefaultSettting").prop('checked', true);
      }
      else{
        $("#npldefaultSettting").prop('checked', false);
      }
      templateObject.getProfitLossLayout();
      setTimeout(function () {
          $('.fullScreenSpin').css('display','none');
          templateObject.layoutgroupid.set("");
      }, 4000);
      $('#layoutModal').modal('toggle');
  });
});

Template.newprofitandloss.events({
  "click .btnAddGroup": function (event) {
    let templateObject = Template.instance();
    templateObject.layoutgroupid.set("");
  },
  "click .deleteProfitLossLayouts": async function () {
    let templateObject = Template.instance();
    if($("#nplLayoutID").val() != ""){
      swal({
          title: 'Delete Layout',
          text: "Are you sure you want to Delete this Layout?",
          type: 'info',
          showCancelButton: true,
          confirmButtonText: 'Yes'
      }).then((result) => {
          if (result.value) {
            $('.fullScreenSpin').css('display', 'block');
            let id = parseInt($("#nplLayoutID").val());
            let jsonObj = {
              type: "TPNLLayout",
              delete: true,
              fields: {
                "ID": id
              }
            }      
            reportService.savePNLLayout(jsonObj).then(function(res) {
              reportService.getPNLLayout().then(function(data) {
                addVS1Data("TPNLLayout", JSON.stringify(data)).then(function(datareturn) {
                  $("#layoutModal #btnViewDeleted").click();
                }).catch(function(err) {
                  $("#layoutModal #btnViewDeleted").click();
                });
                $('.fullScreenSpin').css('display', 'none');
              });
              $("#sltLaybout").val("");
              $("#nplLayoutID").val("");
              $("#nplLayoutName").val("");
              $("#nplLayoutDescr").val("");
              $("#npldefaultSettting").prop('checked', false);
              templateObject.layoutgroupid.set("");
              templateObject.profitlosslayoutrecords.set([]);
              $("ol.nested_with_switch").empty();
            }).catch(function(err) {
                swal({
                    title: 'Oooops...',
                    text: err,
                    type: 'error',
                    showCancelButton: false,
                    confirmButtonText: 'Try Again'
                }).then((result) => {
                    if (result.value) {
                        // Meteor._reload.reload();
                    } else if (result.dismiss === 'cancel') {}
                });
                $('.fullScreenSpin').css('display', 'none');
            });
          } else {}
      });
    }
  },
  "click .nonePeriod": async function (e) {
    let templateObject = Template.instance();
    var dateFrom = new Date($("#dateFrom").datepicker("getDate"));
    var dateTo = new Date($("#dateTo").datepicker("getDate"));
    templateObject.setReportOptions(0, dateFrom, dateTo);
  },
  "click .onePeriod": async function (e) {
    let templateObject = Template.instance();
    var dateFrom = new Date($("#dateFrom").datepicker("getDate"));
    var dateTo = new Date($("#dateTo").datepicker("getDate"));
    templateObject.setReportOptions(1, dateFrom, dateTo);
  },
  "click .twoPeriods": async function (e) {
    let templateObject = Template.instance();
    var dateFrom = new Date($("#dateFrom").datepicker("getDate"));
    var dateTo = new Date($("#dateTo").datepicker("getDate"));
    templateObject.setReportOptions(2, dateFrom, dateTo);
  },
  "click .threePeriods": async function (e) {
    let templateObject = Template.instance();
    var dateFrom = new Date($("#dateFrom").datepicker("getDate"));
    var dateTo = new Date($("#dateTo").datepicker("getDate"));
    templateObject.setReportOptions(3, dateFrom, dateTo);
  },
  "click .fourPeriods": async function (e) {
    let templateObject = Template.instance();
    var dateFrom = new Date($("#dateFrom").datepicker("getDate"));
    var dateTo = new Date($("#dateTo").datepicker("getDate"));
    templateObject.setReportOptions(4, dateFrom, dateTo);
  },
  "click .PSother": async function (e) {
    let templateObject = Template.instance();
    var dateFrom = new Date($("#dateFrom").datepicker("getDate"));
    var dateTo = new Date($("#dateTo").datepicker("getDate"));
    templateObject.setReportOptions(4, dateFrom, dateTo);
  },
  "click .pnlReportAccount": async function (e) {
    let templateObject = Template.instance();
    await clearData("TAccountRunningBalanceReport");
    let accountName = $(e.target).data("account");
    const options = await templateObject.reportOptions.get();
    let dateTo =
      moment(options.toDate).format("YYYY-MM-DD") ||
      moment().format("YYYY-MM-DD");
    let dateFrom =
      moment(options.fromDate).format("YYYY-MM-DD") ||
      moment().format("YYYY-MM-DD");
    FlowRouter.go(
      `/balancetransactionlist?accountName=${accountName}&toDate=${dateTo}&fromDate=${dateFrom}&isTabItem=false`
    );
  },
  "change input[type='checkbox']": (event) => {
    // This should be global
    $(event.currentTarget).attr(
      "checked",
      $(event.currentTarget).prop("checked")
    );
  },
  "click .currency-modal-save": (e) => {
    //$(e.currentTarget).parentsUntil(".modal").modal("hide");
    LoadingOverlay.show();
    // loadCurrencyHistory();

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
  "click .accountingBasisDropdown": function (e) {
    e.stopPropagation();
  },
  "click td a": async function (event) {
    let id = $(event.target).closest("tr").attr("id").split("item-value-");
    var accountName = id[1].split("_").join(" ");
    let toDate = moment($("#dateTo").val())
      .clone()
      .endOf("month")
      .format("YYYY-MM-DD");
    let fromDate = moment($("#dateFrom").val())
      .clone()
      .startOf("year")
      .format("YYYY-MM-DD");
    await clearData("TAccountRunningBalanceReport");
    //localStorage.setItem('showHeader',true);
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
  "change .edtReportDates": function () {
    $(".fullScreenSpin").css("display", "block");
    let templateObject = Template.instance();
    var dateFrom = new Date($("#dateFrom").datepicker("getDate"));
    var dateTo = new Date($("#dateTo").datepicker("getDate"));
    localStorage.setItem('VS1ProfitAndLoss_Report', '');
    templateObject.setReportOptions(0, dateFrom, dateTo);
  },

  "click .btnRefresh": function () {
    $(".fullScreenSpin").css("display", "inline-block");
    localStorage.setItem("VS1ProfitandLoss_ReportCompare", "");
    // Meteor._reload.reload();
  },
  "click .btnPrintReport": function (event) {
    $('.fullScreenSpin').css('display', 'inline-block');
    $('.nplLayoutSelector').css('display', 'none');
    playPrintAudio();
    setTimeout(function () {
      $("a").attr("href", "/");
      document.title = "Profit and Loss";
      $(".printReport").print({
        title: document.title + " | Profit and Loss | " + loggedCompany,
        noPrintSelector: ".addSummaryEditor",
        mediaPrint: false,
      });

      setTimeout(function () {
        $("a").attr("href", "#");
        $('.nplLayoutSelector').css('display', 'inline-block');
      }, 100);
    }, delayTimeAfterSound);
    $('.fullScreenSpin').css('display', 'none');
  },
  "click .btnExportReportProfit": function () {
    $(".fullScreenSpin").css("display", "inline-block");
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

    const filename = loggedCompany + "-Profit and Loss" + ".csv";
    utilityService.exportReportToCsvTable("tableExport", filename, "csv");
    let rows = [];
    // reportService.getProfitandLoss(formatDateFrom,formatDateTo,false).then(function (data) {
    //     if(data.profitandlossreport){
    //         rows[0] = ['Account Type','Account Name', 'Account Number', 'Total Amount(EX)'];
    //         data.profitandlossreport.forEach(function (e, i) {
    //             rows.push([
    //               data.profitandlossreport[i]['AccountTypeDesc'],
    //               data.profitandlossreport[i].AccountName,
    //               data.profitandlossreport[i].AccountNo,
    //               // utilityService.modifynegativeCurrencyFormat(data.profitandlossreport[i]['Sub Account Total']),
    //               utilityService.modifynegativeCurrencyFormat(data.profitandlossreport[i].TotalAmount)]);
    //         });
    //         setTimeout(function () {
    //             utilityService.exportReportToCsv(rows, filename, 'xls');
    //             $('.fullScreenSpin').css('display','none');
    //         }, 1000);
    //     }
    //
    // });
  },
  //custom selection period number
  "click .btnSaveComparisonPeriods": async function (event) {
    playSaveAudio();
    let templateObject = Template.instance();
    setTimeout(async function(){
      let periods = $("#comparisonPeriodNum").val();
      $(".fullScreenSpin").css("display", "block");

      let defaultOptions = await templateObject.reportOptions.get();
      if (defaultOptions) {
        defaultOptions.compPeriod = periods;
        defaultOptions.departments = [];
      }
      await templateObject.reportOptions.set(defaultOptions);
      await templateObject.getProfitandLossReports();
    }, delayTimeAfterSound);
  },

  // Current Month
  // "click #thisMonth": function () {
  //   $(".fullScreenSpin").css("display", "block");
  //   let templateObject = Template.instance();
  //   let fromDate = moment().startOf("month").format("YYYY-MM-DD");
  //   let endDate = moment().endOf("month").format("YYYY-MM-DD");
  //   localStorage.setItem('VS1ProfitAndLoss_Report', '');
  //   templateObject.setReportOptions(0, fromDate, endDate);
  // },

  // "click #thisQuarter": function () {
  //   $(".fullScreenSpin").css("display", "block");
  //   let templateObject = Template.instance();
  //   let fromDate = moment().startOf("Q").format("YYYY-MM-DD");
  //   let endDate = moment().endOf("Q").format("YYYY-MM-DD");
  //   localStorage.setItem('VS1ProfitAndLoss_Report', '');
  //   templateObject.setReportOptions(0, fromDate, endDate);
  // },

  // "click #thisFinYear": function () {
  //   $(".fullScreenSpin").css("display", "block");
  //   let templateObject = Template.instance();
  //   let fromDate = null;
  //   let endDate = null;
  //   if (moment().quarter() == 4) {
  //     fromDate = moment().month("July").startOf("month").format("YYYY-MM-DD");
  //     endDate = moment()
  //       .add(1, "year")
  //       .month("June")
  //       .endOf("month")
  //       .format("YYYY-MM-DD");
  //   } else {
  //     fromDate = moment()
  //       .subtract(1, "year")
  //       .month("July")
  //       .startOf("month")
  //       .format("YYYY-MM-DD");
  //     endDate = moment().month("June").endOf("month").format("YYYY-MM-DD");
  //   }
  //   localStorage.setItem('VS1ProfitAndLoss_Report', '');
  //   templateObject.setReportOptions(0, fromDate, endDate);
  // },

  // "click #lastMonth": function () {
  //   $(".fullScreenSpin").css("display", "block");
  //   let templateObject = Template.instance();
  //   let fromDate = moment()
  //     .subtract(1, "months")
  //     .startOf("month")
  //     .format("YYYY-MM-DD");
  //   let endDate = moment()
  //     .subtract(1, "months")
  //     .endOf("month")
  //     .format("YYYY-MM-DD");
  //   localStorage.setItem('VS1ProfitAndLoss_Report', '');
  //   templateObject.setReportOptions(0, fromDate, endDate);
  // },

  // "click #lastQuarter": function () {
  //   $(".fullScreenSpin").css("display", "block");
  //   let templateObject = Template.instance();
  //   let fromDate = moment().subtract(1, "Q").startOf("Q").format("YYYY-MM-DD");
  //   let endDate = moment().subtract(1, "Q").endOf("Q").format("YYYY-MM-DD");
  //   localStorage.setItem('VS1ProfitAndLoss_Report', '');
  //   templateObject.setReportOptions(0, fromDate, endDate);
  // },

  // "click #lastFinYear": function () {
  //   $(".fullScreenSpin").css("display", "block");
  //   let templateObject = Template.instance();
  //   let fromDate = null;
  //   let endDate = null;
  //   if (moment().quarter() == 4) {
  //     fromDate = moment()
  //       .subtract(1, "year")
  //       .month("July")
  //       .startOf("month")
  //       .format("YYYY-MM-DD");
  //     endDate = moment().month("June").endOf("month").format("YYYY-MM-DD");
  //   } else {
  //     fromDate = moment()
  //       .subtract(2, "year")
  //       .month("July")
  //       .startOf("month")
  //       .format("YYYY-MM-DD");
  //     endDate = moment()
  //       .subtract(1, "year")
  //       .month("June")
  //       .endOf("month")
  //       .format("YYYY-MM-DD");
  //   }
  //   localStorage.setItem('VS1ProfitAndLoss_Report', '');
  //   templateObject.setReportOptions(0, fromDate, endDate);
  // },

  // "click #monthToDate": function () {
  //   $(".fullScreenSpin").css("display", "block");
  //   let templateObject = Template.instance();
  //   let fromDate = moment().startOf("M").format("YYYY-MM-DD");
  //   let endDate = moment().format("YYYY-MM-DD");
  //   localStorage.setItem('VS1ProfitAndLoss_Report', '');
  //   templateObject.setReportOptions(0, fromDate, endDate);
  // },

  // "click #quarterToDate": function () {
  //   $(".fullScreenSpin").css("display", "block");
  //   let templateObject = Template.instance();
  //   let fromDate = moment().startOf("Q").format("YYYY-MM-DD");
  //   let endDate = moment().format("YYYY-MM-DD");
  //   localStorage.setItem('VS1ProfitAndLoss_Report', '');
  //   templateObject.setReportOptions(0, fromDate, endDate);
  // },

  // "click #finYearToDate": function () {
  //   $(".fullScreenSpin").css("display", "block");
  //   let templateObject = Template.instance();
  //   let fromDate = moment()
  //     .month("january")
  //     .startOf("month")
  //     .format("YYYY-MM-DD");
  //   let endDate = moment().format("YYYY-MM-DD");
  //   localStorage.setItem('VS1ProfitAndLoss_Report', '');
  //   templateObject.setReportOptions(0, fromDate, endDate);
  // },

  "click .btnDepartmentSelect": async function () {
    let departments = [];
    $(".fullScreenSpin").css("display", "block");
    let templateObject = Template.instance();
    $("#tblDepartmentCheckbox .chkServiceCard").each(function () {
      if ($(this).is(":checked")) {
        let dpt = $(this).closest("tr").find(".colDeptName").text();
        departments.push(dpt);
      }
    });
    let defaultOptions = await templateObject.reportOptions.get();
    if (defaultOptions) {
      defaultOptions.compPeriod = 0;
      defaultOptions.departments = departments;
    }
    await templateObject.reportOptions.set(defaultOptions);
    await templateObject.getProfitandLossReports();
    $("#myModalDepartment").modal("hide");
  },

  "click #last12Months": function () {
    $(".fullScreenSpin").css("display", "block");
    let templateObject = Template.instance();
    $(".fullScreenSpin").css("display", "inline-block");
    localStorage.setItem("VS1ProfitandLoss_ReportCompare", "");
    $("#dateFrom").attr("readonly", false);
    $("#dateTo").attr("readonly", false);
    var currentDate = new Date();
    var begunDate = moment(currentDate).format("DD/MM/YYYY");

    let fromDateMonth = Math.floor(currentDate.getMonth() + 1);
    let fromDateDay = currentDate.getDate();
    if (currentDate.getMonth() + 1 < 10) {
      fromDateMonth = "0" + (currentDate.getMonth() + 1);
    }
    if (currentDate.getDate() < 10) {
      fromDateDay = "0" + currentDate.getDate();
    }

    var fromDate =
      fromDateDay +
      "/" +
      fromDateMonth +
      "/" +
      Math.floor(currentDate.getFullYear() - 1);
    // templateObject.dateAsAt.set(begunDate);
    $("#dateFrom").val(fromDate);
    $("#dateTo").val(begunDate);

    var currentDate2 = new Date();
    var getLoadDate = moment(currentDate2).format("YYYY-MM-DD");
    let getDateFrom =
      Math.floor(currentDate2.getFullYear() - 1) +
      "-" +
      Math.floor(currentDate2.getMonth() + 1) +
      "-" +
      currentDate2.getDate();
    templateObject.getProfitandLossReports(getDateFrom, getLoadDate, false);
  },
  "click #ignoreDate": function () {
    let templateObject = Template.instance();
    $(".fullScreenSpin").css("display", "inline-block");
    localStorage.setItem("VS1ProfitandLoss_ReportCompare", "");
    $("#dateFrom").attr("readonly", true);
    $("#dateTo").attr("readonly", true);
    templateObject.dateAsAt.set("Current Date");
    templateObject.getProfitandLossReports("", "", true);
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
  ...Datehandler.getDateRangeEvents(),
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

  "click .btnCloseCustomComparison": function (event) {},

  "click .lytAccountToggle": function (event) {
    $(".lytAccountToggle").each(function () {
      if ($(".lytAccountToggle").is(":checked")) {
        $(".btnAddGroup").hide();
        $(".btnGroupAccounts").show();
      } else {
        $(".btnAddGroup").show();
        $(".btnGroupAccounts").hide();
      }
    });
  },
  "click .btnMoveAccount": function (event) {
    $(".lytAccountToggle").each(function () {
      if ($(".lytAccountToggle").is(":checked")) {
        $("#nplMoveAccountScreen").modal("show");
      } else if ($(".lytAccountToggle").not(":checked")) {
        $("#nplNoSelection").modal("show");
      }
    });
  },
  "click .avoid": function (event) {
    $(".avoid").each(function () {
      $(this).click(function () {
        var el = $(this).attr("id");
        if (el === "gP") {
          $(this).addClass("currSelectedItem");
          $(".edlayCalculator").show();
          $(".editGroup").hide();
          $(".editDefault").hide();
          $(".groupRow").hide();
          $(".totalSelctor").hide();
          $(".pgbSideText").hide();
          $(".dateColumnTab").hide();
          $(".textBlockColumn").hide();
          $(".notesColumn").hide();
          $(".scheduleColumn").hide();
          $(".editRowGroup").hide();
          $(".rowEdLayCalculator").hide();
          $(".columnEdLayCalculator").hide();
          $(".budgetColumnTab").hide();
          $(".varianceColumnTab").hide();
          $(".percentageColumnTab").hide();
          $(".newDateColumnTab").hide();
          //                            $('.btnRowAccounts,.btnRowCustom').hide();
        } else if (el === "nP") {
          $(this).addClass("currSelectedItem");
          $(".edlayCalculator").show();
          $(".editGroup").hide();
          $(".editDefault").hide();
          $(".groupRow").hide();
          $(".totalSelctor").hide();
          $(".pgbSideText").hide();
          $(".dateColumnTab").hide();
          $(".textBlockColumn").hide();
          $(".notesColumn").hide();
          $(".scheduleColumn").hide();
          $(".editRowGroup").hide();
          $(".rowEdLayCalculator").hide();
          $(".columnEdLayCalculator").hide();
          $(".budgetColumnTab").hide();
          $(".varianceColumnTab").hide();
          $(".percentageColumnTab").hide();
          $(".newDateColumnTab").hide();
          $(".btnRowAccounts,.btnRowCustom").hide();
        } else {
          $(this).addClass("currSelectedItem");
          $(".editGroup").show();
          $(".edlayCalculator").hide();
          $(".editDefault").hide();
          $(".groupRow").hide();
          $(".totalSelctor").hide();
          $(".pgbSideText").hide();
          $(".dateColumnTab").hide();
          $(".textBlockColumn").hide();
          $(".notesColumn").hide();
          $(".scheduleColumn").hide();
          $(".editRowGroup").hide();
          $(".rowEdLayCalculator").hide();
          $(".columnEdLayCalculator").hide();
          $(".budgetColumnTab").hide();
          $(".varianceColumnTab").hide();
          $(".percentageColumnTab").hide();
          $(".newDateColumnTab").hide();
          $(".btnRowAccounts,.btnRowCustom").hide();
        }
      });
    });
  },

  /*Page break section display start*/
  "click .sortableAccount .draggable": function (event) {
    $(this).each(function () {
      $(this).click(function () {
        var el = $(this).attr("id");
        if (el === "pgBreak1") {
          $(this).addClass("currSelectedItem");
          $(".edlayCalculator").hide();
          $(".editGroup").hide();
          $(".editDefault").hide();
          $(".groupRow").hide();
          $(".pgbSideText").show();
          $(".totalSelctor").hide();
          $(".dateColumnTab").hide();
          $(".textBlockColumn").hide();
          $(".notesColumn").hide();
          $(".scheduleColumn").hide();
          $(".editRowGroup").hide();
          $(".rowEdLayCalculator").hide();
          $(".columnEdLayCalculator").hide();
          $(".budgetColumnTab").hide();
          $(".varianceColumnTab").hide();
          $(".percentageColumnTab").hide();
          $(".newDateColumnTab").hide();
          $(".btnRowAccounts,.btnRowCustom").hide();
        } else {
          $(".editGroup").show();
          $(".edlayCalculator").hide();
          $(".editDefault").hide();
          $(".groupRow").hide();
          $(".totalSelctor").hide();
          $(".pgbSideText").hide();
          $(".dateColumnTab").hide();
          $(".textBlockColumn").hide();
          $(".notesColumn").hide();
          $(".scheduleColumn").hide();
          $(".editRowGroup").hide();
          $(".rowEdLayCalculator").hide();
          $(".columnEdLayCalculator").hide();
          $(".budgetColumnTab").hide();
          $(".varianceColumnTab").hide();
          $(".percentageColumnTab").hide();
          $(".newDateColumnTab").hide();
          $(".btnRowAccounts,.btnRowCustom").hide();
        }
      });
    });
  },
  /*Page break section display end*/
  /*Total row display section start */
  "click .tot": function (event) {
    $(".edlayCalculator").hide();
    $(".editGroup").hide();
    $(".editDefault").hide();
    $(".groupRow").hide();
    $(".pgbSideText").hide();
    $(".totalSelctor").show();
    $(".dateColumnTab").hide();
    $(".textBlockColumn").hide();
    $(".notesColumn").hide();
    $(".scheduleColumn").hide();
    $(".editRowGroup").hide();
    $(".rowEdLayCalculator").hide();
    $(".columnEdLayCalculator").hide();
    $(".budgetColumnTab").hide();
    $(".varianceColumnTab").hide();
    $(".percentageColumnTab").hide();
    $(".newDateColumnTab").hide();
    $(".btnRowAccounts,.btnRowCustom").hide();
  },
  /*Total row display section end */
  /*edit layout button start*/
  "click .nplLayoutEditorBtn": function (event) {
    $(".editGroup").hide();
    $(".edlayCalculator").hide();
    $(".groupRow").hide();
    $(".editDefault").show();
    $(".totalSelctor").hide();
    $(".pgbSideText").hide();
    $(".dateColumnTab").hide();
    $(".textBlockColumn").hide();
    $(".notesColumn").hide();
    $(".scheduleColumn").hide();
    $(".editRowGroup").hide();
    $(".rowEdLayCalculator").hide();
    $(".columnEdLayCalculator").hide();
    $(".budgetColumnTab").hide();
    $(".varianceColumnTab").hide();
    $(".percentageColumnTab").hide();
    $(".newDateColumnTab").hide();
    $(".btnRowAccounts,.btnRowCustom").hide();
  },
  /*edit layout button end*/
  //calculator account selector
  "click .accValSelect": function (event) {
    var optSelectCheck = $(".accValSelect").val();
    if (optSelectCheck === null) {
      $(".nonOption").hide();
    } else {
      $(".nonOption").hide();

      //            var calcOptSelected = $('.accValSelect').val();
      //            var calcFieldContent = $('.calcField').val();

      //            var insblock = $('<input type="button" disabled class="calcVarBlock" data-formula-value="something1>');
      $(".calcField")
        .append(
          '<input type="button" disabled class="calcVarBlock" value="' +
            optSelectCheck +
            '">'
        )
        .val(optSelectCheck);
      optSelectCheck = null;
    }
  },
  //calculator account selector end

  //adding blocks
  //    'click .calcOption':function(event){
  //
  //            var calcOptSelected = $('.accValSelect').val();
  //            var calcFieldContent = $('.calcField').val();
  //
  //            var addCalcVarBlock = $('<input type="button" disabled class="calcVarBlock" data-formula-value="something1">').attr('value',calcOptSelected);
  //             $('.calcField').append(calcFieldContent+addCalcVarBlock);
  //    },
  //end adding blocks
  //calculator buttons
  /*    'click .opBtn':function (event){
        $('.opBtn').each(function () {
                var valEntry1 = $('.opBtn').val();
                var valEntry2 = $('.calcField').val();
                $('.calcField').val(valEntry2 + valEntry1);
                });
            }*/
  //calculator buttons currently
  "click .addition": function (event) {
    var valEntry1 = $(".addition").val();
    var valEntry2 = $(".calcField").val();
    //        $('.calcField').append(valEntry2 + valEntry1);
    $(".calcField").append(valEntry1);
  },
  "click .minus": function (event) {
    var valEntry1 = $(".minus").val();
    var valEntry2 = $(".calcField").val();
    //        $('.calcField').append(valEntry2 + valEntry1);
    $(".calcField").append(valEntry1);
  },
  "click .multi": function (event) {
    var valEntry1 = $(".multi").val();
    var valEntry2 = $(".calcField").val();
    //        $('.calcField').append(valEntry2 + valEntry1);
    $(".calcField").append(valEntry1);
  },
  "click .divide": function (event) {
    var valEntry1 = $(".divide").val();
    var valEntry2 = $(".calcField").val();
    //        $('.calcField').append(valEntry2 + valEntry1);
    $(".calcField").append(valEntry1);
  },
  "click .ifBlock": function (event) {
    var valEntry1 = $(".ifBlock").val();
    var valEntry2 = $(".calcField").val();
    //        $('.calcField').append(valEntry2 + valEntry1);
    $(".calcField").append(valEntry1);
  },
  //end calculator buttons

  //show group row section
  "click .sortableAccount .draggable": function (event) {
    $(".editGroup").hide();
    $(".edlayCalculator").hide();
    $(".groupRow").show();
    $(".editDefault").hide();
    $(".totalSelctor").hide();
    $(".pgbSideText").hide();
    $(".dateColumnTab").hide();
    $(".textBlockColumn").hide();
    $(".notesColumn").hide();
    $(".scheduleColumn").hide();
    $(".editRowGroup").hide();
    $(".rowEdLayCalculator").hide();
    $(".columnEdLayCalculator").hide();
    $(".budgetColumnTab").hide();
    $(".varianceColumnTab").hide();
    $(".percentageColumnTab").hide();
    $(".newDateColumnTab").hide();
    $(".btnRowAccounts,.btnRowCustom").hide();
  },
  //end group row section
  "click #pgBreak1,.pageBreakBar ": function (event) {
    $(this).addClass("currSelectedItem");
    $(".edlayCalculator").hide();
    $(".editGroup").hide();
    $(".editDefault").hide();
    $(".groupRow").hide();
    $(".pgbSideText").show();
    $(".totalSelctor").hide();
    $(".dateColumnTab").hide();
    $(".textBlockColumn").hide();
    $(".notesColumn").hide();
    $(".scheduleColumn").hide();
    $(".editRowGroup").hide();
    $(".rowEdLayCalculator").hide();
    $(".columnEdLayCalculator").hide();
    $(".budgetColumnTab").hide();
    $(".varianceColumnTab").hide();
    $(".percentageColumnTab").hide();
    $(".newDateColumnTab").hide();
    $(".btnRowAccounts,.btnRowCustom").hide();
  },
  "click .accdate": function (event) {
    $(".edlayCalculator").hide();
    $(".editGroup").hide();
    $(".editDefault").hide();
    $(".groupRow").hide();
    $(".pgbSideText").hide();
    $(".totalSelctor").hide();
    $(".dateColumnTab").show();
    $(".textBlockColumn").hide();
    $(".notesColumn").hide();
    $(".scheduleColumn").hide();
    $(".editRowGroup").hide();
    $(".rowEdLayCalculator").hide();
    $(".columnEdLayCalculator").hide();
    $(".budgetColumnTab").hide();
    $(".varianceColumnTab").hide();
    $(".percentageColumnTab").hide();
    $(".newDateColumnTab").hide();
    $(".btnRowAccounts,.btnRowCustom").hide();
  },

  //top row icon events
  "click .btnTextBlockColumn": function (event) {
    $(".edlayCalculator").hide();
    $(".editGroup").hide();
    $(".editDefault").hide();
    $(".groupRow").hide();
    $(".pgbSideText").hide();
    $(".totalSelctor").hide();
    $(".dateColumnTab").hide();
    $(".textBlockColumn").show();
    $(".notesColumn").hide();
    $(".scheduleColumn").hide();
    $(".editRowGroup").hide();
    $(".rowEdLayCalculator").hide();
    $(".columnEdLayCalculator").hide();
    $(".budgetColumnTab").hide();
    $(".varianceColumnTab").hide();
    $(".percentageColumnTab").hide();
    $(".newDateColumnTab").hide();
    $(".btnRowAccounts,.btnRowCustom").hide();
  },
  "click .btnNotes": function (event) {
    $(".edlayCalculator").hide();
    $(".editGroup").hide();
    $(".editDefault").hide();
    $(".groupRow").hide();
    $(".pgbSideText").hide();
    $(".totalSelctor").hide();
    $(".dateColumnTab").hide();
    $(".textBlockColumn").hide();
    $(".notesColumn").show();
    $(".scheduleColumn").hide();
    $(".editRowGroup").hide();
    $(".rowEdLayCalculator").hide();
    $(".columnEdLayCalculator").hide();
    $(".budgetColumnTab").hide();
    $(".varianceColumnTab").hide();
    $(".percentageColumnTab").hide();
    $(".newDateColumnTab").hide();
    $(".btnRowAccounts,.btnRowCustom").hide();
  },
  "click .btnscheduleColumn": function (event) {
    $(".edlayCalculator").hide();
    $(".editGroup").hide();
    $(".editDefault").hide();
    $(".groupRow").hide();
    $(".pgbSideText").hide();
    $(".totalSelctor").hide();
    $(".dateColumnTab").hide();
    $(".textBlockColumn").hide();
    $(".notesColumn").hide();
    $(".scheduleColumn").show();
    $(".editRowGroup").hide();
    $(".rowEdLayCalculator").hide();
    $(".columnEdLayCalculator").hide();
    $(".budgetColumnTab").hide();
    $(".varianceColumnTab").hide();
    $(".percentageColumnTab").hide();
    $(".newDateColumnTab").hide();
    $(".btnRowAccounts,.btnRowCustom").show();
  },
  "click .btnRowGroupColumn": function (event) {
    $(".edlayCalculator").hide();
    $(".editGroup").hide();
    $(".editDefault").hide();
    $(".groupRow").hide();
    $(".pgbSideText").hide();
    $(".totalSelctor").hide();
    $(".dateColumnTab").hide();
    $(".textBlockColumn").hide();
    $(".notesColumn").hide();
    $(".scheduleColumn").hide();
    $(".editRowGroup").show();
    $(".rowEdLayCalculator").hide();
    $(".columnEdLayCalculator").hide();
    $(".budgetColumnTab").hide();
    $(".varianceColumnTab").hide();
    $(".percentageColumnTab").hide();
    $(".newDateColumnTab").hide();
    $(".btnRowAccounts,.btnRowCustom").hide();
  },
  "click .btnRowFormulaColumn": function (event) {
    $(".edlayCalculator").hide();
    $(".editGroup").hide();
    $(".editDefault").hide();
    $(".groupRow").hide();
    $(".pgbSideText").hide();
    $(".totalSelctor").hide();
    $(".dateColumnTab").hide();
    $(".textBlockColumn").hide();
    $(".notesColumn").hide();
    $(".scheduleColumn").hide();
    $(".editRowGroup").hide();
    $(".rowEdLayCalculator").show();
    $(".columnEdLayCalculator").hide();
    $(".budgetColumnTab").hide();
    $(".varianceColumnTab").hide();
    $(".percentageColumnTab").hide();
    $(".newDateColumnTab").hide();
    $(".btnRowAccounts,.btnRowCustom").hide();
  },
  "click .btnColFormulaColumn": function (event) {
    $(".edlayCalculator").hide();
    $(".editGroup").hide();
    $(".editDefault").hide();
    $(".groupRow").hide();
    $(".pgbSideText").hide();
    $(".totalSelctor").hide();
    $(".dateColumnTab").hide();
    $(".textBlockColumn").hide();
    $(".notesColumn").hide();
    $(".scheduleColumn").hide();
    $(".editRowGroup").hide();
    $(".rowEdLayCalculator").hide();
    $(".columnEdLayCalculator").show();
    $(".budgetColumnTab").hide();
    $(".varianceColumnTab").hide();
    $(".percentageColumnTab").hide();
    $(".newDateColumnTab").hide();
    $(".btnRowAccounts,.btnRowCustom").hide();
  },
  "click .btnBudgetColumn": function (event) {
    $(".edlayCalculator").hide();
    $(".editGroup").hide();
    $(".editDefault").hide();
    $(".groupRow").hide();
    $(".pgbSideText").hide();
    $(".totalSelctor").hide();
    $(".dateColumnTab").hide();
    $(".textBlockColumn").hide();
    $(".notesColumn").hide();
    $(".scheduleColumn").hide();
    $(".editRowGroup").hide();
    $(".rowEdLayCalculator").hide();
    $(".columnEdLayCalculator").hide();
    $(".budgetColumnTab").show();
    $(".varianceColumnTab").hide();
    $(".percentageColumnTab").hide();
    $(".newDateColumnTab").hide();
    $(".btnRowAccounts,.btnRowCustom").hide();
  },
  "click .btnVarianceColumn": function (event) {
    $(".edlayCalculator").hide();
    $(".editGroup").hide();
    $(".editDefault").hide();
    $(".groupRow").hide();
    $(".pgbSideText").hide();
    $(".totalSelctor").hide();
    $(".dateColumnTab").hide();
    $(".textBlockColumn").hide();
    $(".notesColumn").hide();
    $(".scheduleColumn").hide();
    $(".editRowGroup").hide();
    $(".rowEdLayCalculator").hide();
    $(".columnEdLayCalculator").hide();
    $(".budgetColumnTab").hide();
    $(".varianceColumnTab").show();
    $(".percentageColumnTab").hide();
    $(".newDateColumnTab").hide();
    $(".btnRowAccounts,.btnRowCustom").hide();
  },
  "click .btnPercentageColumn": function (event) {
    $(".edlayCalculator").hide();
    $(".editGroup").hide();
    $(".editDefault").hide();
    $(".groupRow").hide();
    $(".pgbSideText").hide();
    $(".totalSelctor").hide();
    $(".dateColumnTab").hide();
    $(".textBlockColumn").hide();
    $(".notesColumn").hide();
    $(".scheduleColumn").hide();
    $(".editRowGroup").hide();
    $(".rowEdLayCalculator").hide();
    $(".columnEdLayCalculator").hide();
    $(".budgetColumnTab").hide();
    $(".varianceColumnTab").hide();
    $(".percentageColumnTab").show();
    $(".newDateColumnTab").hide();
    $(".btnRowAccounts,.btnRowCustom").hide();
  },
  "click .btnNewDateColumnTab": function (event) {
    $(".edlayCalculator").hide();
    $(".editGroup").hide();
    $(".editDefault").hide();
    $(".groupRow").hide();
    $(".pgbSideText").hide();
    $(".totalSelctor").hide();
    $(".dateColumnTab").hide();
    $(".textBlockColumn").hide();
    $(".notesColumn").hide();
    $(".scheduleColumn").hide();
    $(".editRowGroup").hide();
    $(".rowEdLayCalculator").hide();
    $(".columnEdLayCalculator").hide();
    $(".budgetColumnTab").hide();
    $(".varianceColumnTab").hide();
    $(".percentageColumnTab").hide();
    $(".newDateColumnTab").show();
    $(".btnRowAccounts,.btnRowCustom").hide();
  },
  //   'click .btnPageBreak':function(event){
  //       $('.sortableAccountParent').append('<div class="sortableAccount pageBreakBar"><div class="draggable" id="pgBreak1"><label class="col-12 dragAcc" style=" text-align: center; background-color:#00a3d3; border-color: #00a3d3;color:#fff;">Page break (row)</label></div></div>');
  // $(".sortableAccountParent").sortable({
  //     revert: true,
  //     cancel: ".undraggableDate,.accdate,.edtInfo"
  // });
  // $(".sortableAccount").sortable({
  //     revert: true,
  //     handle: ".avoid"
  // });
  // $(".draggable").draggable({
  //     connectToSortable: ".sortableAccount",
  //     helper: "none",
  //     revert: "true"
  // });
  //   },
  "click .btnDelSelected": function (event) {
    let templateObject = Template.instance();
    if(templateObject.layoutgroupid.get()){
      swal({
          title: 'WARNING!',
          text: 'Are you sure delete the selected group?',
          type: 'question',
          showCancelButton: true,
          confirmButtonText: 'Yes',
          cancelButtonText: 'No'
      }).then((result) => {
          if (result.value) {
              let layoutID = parseInt($("#nplLayoutID").val());
              $('.fullScreenSpin').css('display', 'inline-block');
              let jsonObj = {
                "Name": "VS1_PNLDeleteGroup",
                "Params":{
                  "LayoutID": layoutID,
                  "Selected": parseInt(templateObject.layoutgroupid.get())
                }
              }
              reportService.deletePNLGroup(jsonObj).then(function(res){
                templateObject.layoutgroupid.set("");
                // templateObject.getProfitLossLayout();
                $(".editRowGroup").hide();
                $("#editGroupName").val("");
                $("#editGroupID").val("");
                // var dateFrom = new Date($("#dateFrom").datepicker("getDate"));
                // var dateTo = new Date($("#dateTo").datepicker("getDate"));
                // templateObject.setReportOptions(3, dateFrom, dateTo);
                templateObject.getProfitLossLayout();
                setTimeout(function () {
                  $('.fullScreenSpin').css('display', 'none');
                }, 2000);
              }).catch(function(err) {
                  swal({
                      title: 'Oooops...',
                      text: err,
                      type: 'error',
                      showCancelButton: false,
                      confirmButtonText: 'Try Again'
                  }).then((result) => {
                      if (result.value) {
                          // Meteor._reload.reload();
                      } else if (result.dismiss === 'cancel') {}
                  });
                  $('.fullScreenSpin').css('display', 'none');
              });
          } else if (result.dismiss === 'cancel') {
          }
      });
    }
    else{
      swal('WARNING', 'Please select the group you need to delete.', 'error');
    }
  },
  "click .chkTotal": async function (event) {
    let templateObject = Template.instance();
    let options = await templateObject.reportOptions.get();
    if ($(".chkTotal").is(":checked")) {
      options.showtotal = true;
    } else {
      options.showtotal = false;
    }
    templateObject.reportOptions.set(options);
    setTimeout(function () {
      $("td a").each(function () {
        if (
          $(this)
            .text()
            .indexOf("-" + Currency) >= 0
        ) {
          $(this).addClass("text-danger");
          $(this).removeClass("fgrblue");
        }
      });
      $("td").each(function () {
        if (
          $(this)
            .text()
            .indexOf("-" + Currency) >= 0
        ) {
          $(this).addClass("text-danger");
          $(this).removeClass("fgrblue");
        }
      });
    }, 500);
  },
  "click .chkDecimals": async function (event) {
    let templateObject = Template.instance();
    let options = await templateObject.reportOptions.get();
    if ($(".chkDecimals").is(":checked")) {
      options.showDecimal = true;
    } else {
      options.showDecimal = false;
    }
    templateObject.reportOptions.set(options);
    setTimeout(function () {
      $("td a").each(function () {
        if (
          $(this)
            .text()
            .indexOf("-" + Currency) >= 0
        ) {
          $(this).addClass("text-danger");
          $(this).removeClass("fgrblue");
        }
      });
      $("td").each(function () {
        if (
          $(this)
            .text()
            .indexOf("-" + Currency) >= 0
        ) {
          $(this).addClass("text-danger");
          $(this).removeClass("fgrblue");
        }
      });
    }, 500);
  },

  "click .chkYTDate": function (event) {
    $(".tglYTD").toggle();
  },
  "click .chkAccBasis": function (event) {
    $(".tglAccBasis").toggle();
  },
  "click .chkAccCodes": function (event) {
    $(".tglAccCodes").toggle();
  },
  "click .chkPercIncome": function (event) {
     if( $('.chkPercIncome').is(':checked') ){
        $('.plAmountPercentage').show();
     }else{
        $('.plAmountPercentage').hide();
     }
  },
  "click .rbAccrual": function (event) {
    $(".tglAccBasis").text("Accrual Basis");
    if ($(".chkAccBasis").is(":checked")) {
      // $('.chkAccBasis').trigger('click');
      $(".tglAccBasis").text("Accrual Basis");
    } else if ($(".chkAccBasis").is(":not(:checked)")) {
      $(".tglAccBasis").text("Accrual Basis");
      $(".chkAccBasis").trigger("click");
      $(".chkAccBasis").prop("checked", true);

      // $('.chkAccBasis').trigger('click');
    }
  },
  "click .rbCash": function (event) {
    $(".tglAccBasis").text("Cash Basis");
    if ($(".chkAccBasis").is(":checked")) {
      $(".tglAccBasis").text("Cash Basis");
    } else if ($(".chkAccBasis").is(":not(:checked)")) {
      $(".tglAccBasis").text("Cash Basis");
      $(".chkAccBasis").trigger("click");
      $(".chkAccBasis").prop("checked", true);

      // $('.chkAccBasis').trigger('click');
    }
  },
  "click .chkDecimal": function (event) {
    // var takeIn;
    // $('.fgr.text-right').each(function () {
    //   takeIn = $(this).text().substring(1);
    //   takeIn = parseInt(takeIn);
    //   $('.fgr.text-right').text(takeIn);
    // })
    // var numVal = $('.fgr').html().parseInt();
  },
  "click #savePnLFieldsLayout": function () {
    let templateObject = Template.instance();
    let layoutID = parseInt($("#nplLayoutID").val());
    let groupName = $("#newGroupName").val();
    if (groupName == "") {
      swal({
        title: "Please enter group name",
        type: "error",
        showCancelButton: false,
        confirmButtonText: "Try Again",
      });
      return false;
    }
    let accountName = $("#nplPlaceInMoveSelection").val();
    let jsonObj = {
        Name: "VS1_PNLAddGroup",
        Params: {
          "LayoutID": layoutID,
          "GroupName": groupName,
          "Destination": 0
        }
    }
    if (accountName == "none") {
      // profitlosslayoutfields.push({
      //   Account: "",
      //   AccountID: 0,
      //   AccountLevel0GroupName: groupName,
      //   AccountLevel1GroupName: "",
      //   AccountLevel2GroupName: "",
      //   AccountName: groupName,
      //   Direction: "",
      //   GlobalRef: "DEF1",
      //   Group: "",
      //   ID: 0,
      //   ISEmpty: false,
      //   IsAccount: false,
      //   IsRoot: false,
      //   KeyStringFieldName: "",
      //   KeyValue: "",
      //   LayoutID: 1,
      //   LayoutToUse: "",
      //   Level: "",
      //   Level0Group: "",
      //   Level1Group: "",
      //   Level2Group: "",
      //   Level0Order: 1,
      //   Level1Order: 0,
      //   Level2Order: 0,
      //   Level3Order: 0,
      //   MsTimeStamp: "2022-04-06 16:00:23",
      //   MsUpdateSiteCode: "DEF",
      //   Parent: 0,
      //   Pos: "0",
      //   Position: 0,
      //   Recno: 3,
      //   Up: false,
      //   subAccounts: [],
      // });
      // $("#newGroupName").val("");
      // templateObject.profitlosslayoutrecords.set(profitlosslayoutfields);
      // templateObject.profitlosslayoutrecords.set(updateLayouts);
    } else {
      // let updateLayouts = profitlosslayoutfields.filter(function (
      //   item,
      //   index
      // ) {
      //   if (item.AccountName == accountName) {
      //     item.subAccounts.push({
      //       Account: "",
      //       AccountID: 0,
      //       AccountLevel0GroupName: item.AccountName,
      //       AccountLevel1GroupName: groupName,
      //       AccountLevel2GroupName: "",
      //       AccountName: groupName,
      //       Direction: "",
      //       GlobalRef: "DEF1",
      //       Group: "",
      //       ID: 0,
      //       ISEmpty: false,
      //       IsAccount: false,
      //       IsRoot: false,
      //       KeyStringFieldName: "",
      //       KeyValue: "",
      //       LayoutID: 1,
      //       LayoutToUse: "",
      //       Level: "",
      //       Level0Group: "",
      //       Level1Group: "",
      //       Level2Group: "",
      //       Level0Order: 0,
      //       Level1Order: 0,
      //       Level2Order: 0,
      //       Level3Order: 0,
      //       MsTimeStamp: "2022-04-06 16:00:23",
      //       MsUpdateSiteCode: "DEF",
      //       Parent: item.ID,
      //       Pos: "0",
      //       Position: 0,
      //       Recno: 3,
      //       Up: false,
      //     });
      //   }
      //   return item;
      // });
      jsonObj.Params.Destination = parseInt(accountName);
    }

    $('.fullScreenSpin').css('display', 'inline-block');
    reportService.savePNLNewGroup(jsonObj).then(function(res){
      // templateObject.getProfitLossLayout();
      $("#newGroupName").val("");
      $("#nplAddGroupScreen").modal("hide");
      // var dateFrom = new Date($("#dateFrom").datepicker("getDate"));
      // var dateTo = new Date($("#dateTo").datepicker("getDate"));
      // templateObject.setReportOptions(3, dateFrom, dateTo);
      if(templateObject.layoutgroupid.get() != ""){
        let layoutID = parseInt($("#nplLayoutID").val());
        reportService.getProfitLossLayout(layoutID).then(function(data){
          let newprofitLossLayouts = [];
          if(data.ProcessLog.PNLLayout.Lines != undefined){
            let pnlLayout = data.ProcessLog.PNLLayout.Lines.sort(function(a, b) {
                return (a.ID > b.ID) ? -1 : 1;
            });
          // _.sortBy(data.ProcessLog.PNLLayout.Lines, 'ID');
            let layoutgroupid = [];
            layoutgroupid = templateObject.layoutgroupid.get().split(",");
            for(var i=0; i<layoutgroupid.length; i++){
              let groupID = parseInt(layoutgroupid[i]);
              let containerID = parseInt(pnlLayout[0].ID) || 0;
              let jsonObj = {
                "Name": "VS1_PNLMoveAccount",
                "Params":{
                  "LayoutID": layoutID,
                  "Selected": groupID,
                  "Destination": containerID,
                }
              }
              if(i == (layoutgroupid.length-1)){
                reportService.movePNLGroup(jsonObj).then(function(res){
                    templateObject.getProfitLossLayout();
                    setTimeout(function () {
                      $('.fullScreenSpin').css('display', 'none');
                    }, 3000);
                }).catch(function(err) {
                    swal({
                        title: 'Oooops...',
                        text: err,
                        type: 'error',
                        showCancelButton: false,
                        confirmButtonText: 'Try Again'
                    }).then((result) => {
                        if (result.value) {
                            // Meteor._reload.reload();
                        } else if (result.dismiss === 'cancel') {}
                    });
                    $('.fullScreenSpin').css('display', 'none');
                });
              }
              else{
                reportService.movePNLGroup(jsonObj).then(function(res){
                }).catch(function(err) {
                    swal({
                        title: 'Oooops...',
                        text: err,
                        type: 'error',
                        showCancelButton: false,
                        confirmButtonText: 'Try Again'
                    }).then((result) => {
                        if (result.value) {
                            // Meteor._reload.reload();
                        } else if (result.dismiss === 'cancel') {}
                    });
                    $('.fullScreenSpin').css('display', 'none');
                });
              }
            }
          }
          // $('.fullScreenSpin').css('display', 'none');
        });
      }
      else{
        templateObject.getProfitLossLayout();
        setTimeout(function () {
          $('.fullScreenSpin').css('display', 'none');
        }, 3000);
      }
    }).catch(function(err) {
        swal({
            title: 'Oooops...',
            text: err,
            type: 'error',
            showCancelButton: false,
            confirmButtonText: 'Try Again'
        }).then((result) => {
            if (result.value) {
                // Meteor._reload.reload();
            } else if (result.dismiss === 'cancel') {}
        });
        $('.fullScreenSpin').css('display', 'none');
    });
  },
  ...FxGlobalFunctions.getEvents(),
});

Template.newprofitandloss.helpers({
  convertAmount: (amount, currencyData) => {
    let currencyList = Template.instance().tcurrencyratehistory.get(); // Get tCurrencyHistory


    if (!amount || amount.trim() == "") {
      return "";
    }
    if (currencyData.code == defaultCurrencyCode) {
      // default currency
      return amount;
    }
    // // Lets remove the minus character
    // const isMinus = amount.indexOf('-') > -1;
    // if(isMinus == true) amount = amount.replace('-', '');

    amount = utilityService.convertSubstringParseFloat(amount); // This will remove all currency symbol

    const isMinus = amount < 0;
    if (isMinus == true) amount = amount * -1; // Make it positive

    // get default currency symbol
    // let _defaultCurrency = currencyList.filter(a => a.Code == defaultCurrencyCode)[0];

    // amount = amount.replace(_defaultCurrency.symbol, '');

    // amount = isNaN(amount) == true ? parseFloat(amount.substring(1)) : parseFloat(amount);



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



    let rate = firstElem.BuyRate; // Must used from tcurrecyhistory
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
  count: (array = []) => {
    return array.length;
  },
  countActive: (array = []) => {
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
  loggedCompany: () => {
    return localStorage.getItem("mySession") || "";
  },
  reportOptions: () => {
    return Template.instance().reportOptions.get();
  },
  formatDate(currentDate) {
    return moment(currentDate).format("DD/MM/YYYY");
  },
  profitlosslayoutrecords() {
    return Template.instance().profitlosslayoutrecords.get();
  },
  records: () => {
    return Template.instance().records.get();
    //   .sort(function(a, b){
    //     if (a.accounttype == 'NA') {
    //   return 1;
    //       }
    //   else if (b.accounttype == 'NA') {
    //     return -1;
    //   }
    // return (a.accounttype.toUpperCase() > b.accounttype.toUpperCase()) ? 1 : -1;
    // return (a.saledate.toUpperCase() < b.saledate.toUpperCase()) ? 1 : -1;
    // });
  },
  recordslayout: () => {
    return Template.instance().recordslayout.get();
  },
  dateAsAt: () => {
    return Template.instance().dateAsAt.get() || "-";
  },
  daterange: () => {
    return Template.instance().daterange.get();
  },
  companyname: () => {
    return loggedCompany;
  },

  deptrecords: () => {
    return Template.instance()
      .departments.get()
      // .sort(function (a, b) {
      //   if (a.department == "NA") {
      //     return 1;
      //   } else if (b.department == "NA") {
      //     return -1;
      //   }
      //   return a.department.toUpperCase() > b.department.toUpperCase() ? 1 : -1;
      // });
  },

  tableheaderrecords: () => {
      return Template.instance().tableheaderrecords.get();
  },
  apiFunction:function() {
      return reportService.getPNLLayout;
  },

  searchAPI: function() {
      return reportService.getPNLLayout;
  },

  service: ()=>{
      return reportService;
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
      return ["limitCount", "limitFrom", "deleteFilter", "dateFrom", "dateTo", "ignoredate"];
  },
});

Template.registerHelper("equal", function (a, b) {
  return a == b;
});

Template.registerHelper("equals", function (a, b) {
  return a === b;
});

Template.registerHelper("notEquals", function (a, b) {
  return a != b;
});

Template.registerHelper("containsequals", function (a, b) {
  let chechTotal = false;
  if (a.toLowerCase().indexOf(b.toLowerCase()) >= 0) {
    chechTotal = true;
  }
  return chechTotal;
});

Template.registerHelper("shortDate", function (a) {
  let dateIn = a;
  let dateOut = moment(dateIn, "DD/MM/YYYY").format("MMM YYYY");
  return dateOut;
});

Template.registerHelper("noDecimal", function (a) {
  let numIn = a;
  // numIn= $(numIn).val().substring(1);
  // numIn= $(numIn).val().replace('$','');

  // numIn= $numIn.text().replace('-','');
  let numOut = parseInt(numIn);
  return numOut;
});
