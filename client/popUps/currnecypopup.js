import {TaxRateService} from "../settings/settings-service";
import {ReactiveVar} from "meteor/reactive-var";
import {CountryService} from "../js/country-service";
import {SideBarService} from "../js/sidebar-service";
import "../lib/global/indexdbstorage.js";
import LoadingOverlay from "../LoadingOverlay";
import { currencySymbolEmpty } from "../packages/currency/CurrencyGlobals";
import FxGlobalFunctions from "../packages/currency/FxGlobalFunctions";
import { Template } from 'meteor/templating';
import './currnecypopup.html';
import moment from "moment";
let sideBarService = new SideBarService();

export function setCurrentCurrencySymbol(symbol = "N/A") {
  return localStorage.setItem("_SELECTED_CURRENCY_SYMBOL", symbol);
}

export const getCurrentCurrencySymbol = () => FxGlobalFunctions.getCurrentCurrencySymbol()

export function getUserCurrency() {
  return localStorage.getItem("_USER_CURRENCY");
}

export function setUserCurrency(currencyObject) {
  return localStorage.setItem("_USER_CURRENCY", currencyObject);
}

const defaultCurrencyCode = CountryAbbr;

Template.currencypop.onCreated(function () {
  const templateObject = Template.instance();
  templateObject.datatablerecordscurrencypop = new ReactiveVar([]);
  templateObject.tableheaderrecords = new ReactiveVar([]);
  templateObject.countryData = new ReactiveVar();

  templateObject.getDataTableList = function(data) {
    let linestatus = '';
    if (data.Active == true) {
      linestatus = "";
    } else if (data.Active == false) {
      linestatus = "In-Active";
    }
    var dataList = [
      data.CurrencyID || "",
      data.Code || "",
      data.Currency || "",
      data.CurrencySymbol || "",
      data.BuyRate || 0.00,
      data.SellRate || 0.00,
      data.Country || "",
      moment(data.RateLastModified).format("DD/MM/YYYY") || "",
      data.CurrencyDesc || "",
      data.FixedRate || 0.00,
      data.UpperVariation || 0.00,
      data.LowerVariation || 0.00,
      data.TriggerPriceVariation || 0.00,
      data.CountryID || "",
      linestatus,
    ];
    return dataList;
  }

  let headerStructure = [
    { index: 0, label: 'ID', class: 'colCurrencyID', active: false, display: false, width: "30" },
    { index: 1, label: 'Code', class: 'colCode', active: true, display: true, width: "50" },
    { index: 2, label: 'Currency', class: 'colCurrency', active: true, display: true, width: "100" },
    { index: 3, label: 'Symbol', class: 'colSymbol', active: true, display: true, width: "100", align:"right" },
    { index: 4, label: 'Buy Rate', class: 'colBuyRate', active: true, display: true, width: "100" },
    { index: 5, label: 'Sell Rate', class: 'colSellRate', active: true, display: true, width: "100" },
    { index: 6, label: 'Country', class: 'colCountry', active: true, display: true, width: "200" },
    { index: 7, label: 'Rate Last Modified', class: 'colRateLastModified', active: false, display: true, width: "200" },
    { index: 8, label: 'Description', class: 'colDescription', active: true, display: true, width: "" },
    { index: 9, label: 'Fixed Rate', class: 'colFixedRate', active: false, display: true, width: "100" },
    { index: 10, label: 'Upper Variation', class: 'colUpperVariation', active: false, display: true, width: "150" },
    { index: 11, label: 'Lower Variation', class: 'colLowerVariation', active: false, display: true, width: "150" },
    { index: 12, label: 'Trigger Price Variation', class: 'colTriggerPriceVariation', active: false, display: true, width: "250" },
    { index: 13, label: 'Country ID', class: 'colCountryID', active: false, display: true, width: "100" },
    { index: 14, label: 'Status', class: 'colStatus', active: true, display: true, width: "100" },
  ];

  templateObject.tableheaderrecords.set(headerStructure);
});

Template.currencypop.onRendered(function () {
  let templateObject = Template.instance();


  let prefix = templateObject.data.custid ? templateObject.data.custid : '';
  $(`#currencyListModal${prefix}`).on('shown.bs.modal', function () {
    setTimeout(function () {
      $(`#tblCurrencyPopList${prefix}_filter .form-control-sm`).get(0).focus()
    }, 500);
  });
    var countryService = new CountryService();
    let countries = [];

    function MakeNegative() {
      $("td").each(function () {
            if ($(this).text().indexOf("-" + Currency) >= 0)
              $(this).addClass("text-danger");
          }
      );
    }

    templateObject.loadCurrencies = async () => {
      let currencies = [];
      LoadingOverlay.show();
      let data = "";
      let dataObject = await getVS1Data('TCurrency') || '';
      if (dataObject.length > 0) {
        data = JSON.parse(dataObject[0].data);
      } else {
        data = await sideBarService.getCurrencies();
      }
      ;
      data.tcurrency.forEach(_currency => {

        currencies.push({
          id: _currency.fields.ID || "",
          code: _currency.fields.Code || "N/A",
          currency: _currency.fields.Currency || "N/A",
          symbol: _currency.fields.CurrencySymbol || currencySymbolEmpty,
          buyrate: _currency.fields.BuyRate || "N/A",
          sellrate: _currency.fields.SellRate || "N/A",
          country: _currency.fields.Country || "N/A",
          description: _currency.fields.CurrencyDesc || "N/A",
          ratelastmodified: _currency.fields.RateLastModified || "N/A",
        });

        if (_currency.currency == defaultCurrencyCode) {
          setUserCurrency(_currency);
        }


      });

      templateObject.datatablerecordscurrencypop.set(currencies);

      if (templateObject.datatablerecordscurrencypop.get()) {

        setTimeout(function () {
          MakeNegative();
        }, 100);
      }

      // setTimeout(function () {
      //   $("#tblCurrencyPopList").DataTable({
      //     columnDefs: [
      //       {
      //         type: "date",
      //         targets: 0
      //       }, {
      //         orderable: false,
      //         targets: -1
      //       }
      //     ],
      //     sDom: "<'row'><'row'<'col-sm-12 col-md-6'f><'col-sm-12 col-md-6'l>r>t<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>B",
      //     buttons: [
      //       {
      //         extend: "excelHtml5",
      //         text: "",
      //         download: "open",
      //         className: "btntabletocsv hiddenColumn",
      //         filename: "taxratelist_" + moment().format(),
      //         orientation: "portrait",
      //         exportOptions: {
      //           columns: ":visible"
      //         }
      //       }, {
      //         extend: "print",
      //         download: "open",
      //         className: "btntabletopdf hiddenColumn",
      //         text: "",
      //         title: "Tax Rate List",
      //         filename: "taxratelist_" + moment().format(),
      //         exportOptions: {
      //           columns: ":visible"
      //         }
      //       }
      //     ],
      //     select: true,
      //     destroy: true,
      //     colReorder: {
      //       fixedColumnsRight: 1
      //     },
      //     // bStateSave: true,
      //     // rowId: 0,
      //     paging: false,
      //     // scrollY: "400px",
      //     // scrollCollapse: true,
      //     info: true,
      //     responsive: true,
      //     order: [
      //       [0, "asc"]
      //     ],
      //     action: function () {
      //       $("#tblCurrencyPopList").DataTable().ajax.reload();
      //     },
      //     fnDrawCallback: function (oSettings) {
      //       setTimeout(function () {
      //         MakeNegative();
      //       }, 100);
      //     },
      //     language: { search: "",searchPlaceholder: "Search List..." },
      //     fnInitComplete: function () {
      //       $("<button class='btn btn-primary btnAddNewCurrency' data-dismiss='modal' data-toggle='modal' data-target='#newCurrencyModal' type='button' style='padding: 4px 10px; font-size: 16px; margin-left: 12px !important;'><i class='fas fa-plus'></i></button>").insertAfter("#tblCurrencyPopList_filter");
      //       $("<button class='btn btn-primary btnRefreshCurrency' type='button' id='btnRefreshCurrency' style='padding: 4px 10px; font-size: 16px; margin-left: 12px !important;'><i class='fas fa-search-plus' style='margin-right: 5px'></i>Search</button>").insertAfter("#tblCurrencyPopList_filter");
      //     }
      //   }).on("page", function () {
      //     setTimeout(function () {
      //       MakeNegative();
      //     }, 100);
      //     let draftRecord = templateObject.datatablerecordscurrencypop.get();
      //     templateObject.datatablerecordscurrencypop.set(draftRecord);
      //   }).on("column-reorder", function () {}).on("length.dt", function (e, settings, len) {
      //     setTimeout(function () {
      //       MakeNegative();
      //     }, 100);
      //   });

      //   // $('#tblCurrencyPopList').DataTable().column( 0 ).visible( true );
      //   $(".fullScreenSpin").css("display", "none");
      // }, 0);

      var columns = $("#tblCurrencyPopList th");
      let sTible = "";
      let sWidth = "";
      let sIndex = "";
      let sVisible = "";
      let columVisible = false;
      let sClass = "";
      $.each(columns, function (i, v) {
        if (v.hidden == false) {
          columVisible = true;
        }
        if (v.className.includes("hiddenColumn")) {
          columVisible = false;
        }
        sWidth = v.style.width.replace("px", "");

        let datatablerecordObj = {
          sTitle: v.innerText || "",
          sWidth: sWidth || "",
          sIndex: v.cellIndex || "",
          sVisible: columVisible || false,
          sClass: v.className || ""
        };
        tableHeaderList.push(datatablerecordObj);
      });
      templateObject.tableheaderrecords.set(tableHeaderList);
      $("div.dataTables_filter input").addClass("form-control form-control-sm");
      LoadingOverlay.hide();
    };

    // templateObject.getTaxRates = function () {
    //   getVS1Data("TCurrency").then(function (dataObject) {
    //     if (dataObject.length == 0) {
    //       taxRateService.getCurrencies().then(function (data) {
    //         let lineItems = [];
    //         let lineItemObj = {};
    //         for (let i = 0; i < data.tcurrency.length; i++) {
    //           // let taxRate = (data.tcurrency[i].fields.Rate * 100).toFixed(2) + '%';
    //           var dataList = {
    //             id: data.tcurrency[i].fields.Id || "",
    //             code: data.tcurrency[i].fields.Code || "-",
    //             currency: data.tcurrency[i].fields.Currency || "-",
    //             symbol: data.tcurrency[i].fields.CurrencySymbol || "-",
    //             buyrate: data.tcurrency[i].fields.BuyRate || "-",
    //             sellrate: data.tcurrency[i].fields.SellRate || "-",
    //             country: data.tcurrency[i].fields.Country || "-",
    //             description: data.tcurrency[i].fields.CurrencyDesc || "-",
    //             ratelastmodified: data.tcurrency[i].fields.RateLastModified || "-"
    //           };

    //           dataTableList.push(dataList);
    //           //}
    //         }

    //         templateObject.datatablerecordscurrencypop.set(dataTableList);

    //         if (templateObject.datatablerecordscurrencypop.get()) {
    //           Meteor.call("readPrefMethod", localStorage.getItem("mycloudLogonID"), "tblCurrencyPopList", function (error, result) {
    //             if (error) {} else {
    //               if (result) {
    //                 for (let i = 0; i < result.customFields.length; i++) {
    //                   let customcolumn = result.customFields;
    //                   let columData = customcolumn[i].label;
    //                   let columHeaderUpdate = customcolumn[i].thclass.replace(/ /g, ".");
    //                   let hiddenColumn = customcolumn[i].hidden;
    //                   let columnClass = columHeaderUpdate.split(".")[1];
    //                   let columnWidth = customcolumn[i].width;
    //                   let columnindex = customcolumn[i].index + 1;

    //                   if (hiddenColumn == true) {
    //                     $("." + columnClass + "").addClass("hiddenColumn");
    //                     $("." + columnClass + "").removeClass("showColumn");
    //                   } else if (hiddenColumn == false) {
    //                     $("." + columnClass + "").removeClass("hiddenColumn");
    //                     $("." + columnClass + "").addClass("showColumn");
    //                   }
    //                 }
    //               }
    //             }
    //           });

    //           setTimeout(function () {
    //             MakeNegative();
    //           }, 100);
    //         }

    //         $(".fullScreenSpin").css("display", "none");
    //         setTimeout(function () {
    //           $("#tblCurrencyPopList").DataTable({
    //             columnDefs: [
    //               {
    //                 type: "date",
    //                 targets: 0
    //               }, {
    //                 orderable: false,
    //                 targets: -1
    //               }
    //             ],
    //             sDom: "<'row'><'row'<'col-sm-12 col-md-6'f><'col-sm-12 col-md-6'l>r>t<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>B",
    //             buttons: [
    //               {
    //                 extend: "excelHtml5",
    //                 text: "",
    //                 download: "open",
    //                 className: "btntabletocsv hiddenColumn",
    //                 filename: "taxratelist_" + moment().format(),
    //                 orientation: "portrait",
    //                 exportOptions: {
    //                   columns: ":visible"
    //                 }
    //               }, {
    //                 extend: "print",
    //                 download: "open",
    //                 className: "btntabletopdf hiddenColumn",
    //                 text: "",
    //                 title: "Tax Rate List",
    //                 filename: "taxratelist_" + moment().format(),
    //                 exportOptions: {
    //                   columns: ":visible"
    //                 }
    //               }
    //             ],
    //             select: true,
    //             destroy: true,
    //             colReorder: {
    //               fixedColumnsRight: 1
    //             },
    //             // bStateSave: true,
    //             // rowId: 0,
    //             paging: false,
    //             scrollY: "400px",
    //             scrollCollapse: true,
    //             info: true,
    //             responsive: true,
    //             order: [
    //               [0, "asc"]
    //             ],
    //             action: function () {
    //               $("#tblCurrencyPopList").DataTable().ajax.reload();
    //             },
    //             fnDrawCallback: function (oSettings) {
    //               setTimeout(function () {
    //                 MakeNegative();
    //               }, 100);
    //             },
    //             language: { search: "",searchPlaceholder: "Search List..." },
    //             fnInitComplete: function () {
    //               $("<button class='btn btn-primary btnAddNewCurrency' data-dismiss='modal' data-toggle='modal' data-target='#newCurrencyModal' type='button' style='padding: 4px 10px; font-size: 16px; margin-left: 12px !important;'><i class='fas fa-plus'></i></button>").insertAfter("#tblCurrencyPopList_filter");
    //               $("<button class='btn btn-primary btnRefreshCurrency' type='button' id='btnRefreshCurrency' style='padding: 4px 10px; font-size: 16px; margin-left: 12px !important;'><i class='fas fa-search-plus' style='margin-right: 5px'></i>Search</button>").insertAfter("#tblCurrencyPopList_filter");
    //             }
    //           }).on("page", function () {
    //             setTimeout(function () {
    //               MakeNegative();
    //             }, 100);
    //             let draftRecord = templateObject.datatablerecordscurrencypop.get();
    //             templateObject.datatablerecordscurrencypop.set(draftRecord);
    //           }).on("column-reorder", function () {}).on("length.dt", function (e, settings, len) {
    //             setTimeout(function () {
    //               MakeNegative();
    //             }, 100);
    //           });

    //           // $('#tblCurrencyPopList').DataTable().column( 0 ).visible( true );
    //           $(".fullScreenSpin").css("display", "none");
    //         }, 0);

    //         var columns = $("#tblCurrencyPopList th");
    //         let sTible = "";
    //         let sWidth = "";
    //         let sIndex = "";
    //         let sVisible = "";
    //         let columVisible = false;
    //         let sClass = "";
    //         $.each(columns, function (i, v) {
    //           if (v.hidden == false) {
    //             columVisible = true;
    //           }
    //           if (v.className.includes("hiddenColumn")) {
    //             columVisible = false;
    //           }
    //           sWidth = v.style.width.replace("px", "");

    //           let datatablerecordObj = {
    //             sTitle: v.innerText || "",
    //             sWidth: sWidth || "",
    //             sIndex: v.cellIndex || "",
    //             sVisible: columVisible || false,
    //             sClass: v.className || ""
    //           };
    //           tableHeaderList.push(datatablerecordObj);
    //         });
    //         templateObject.tableheaderrecords.set(tableHeaderList);
    //         $("div.dataTables_filter input").addClass("form-control form-control-sm");
    //       }).catch(function (err) {
    //         // Bert.alert('<strong>' + err + '</strong>!', 'danger');
    //         $(".fullScreenSpin").css("display", "none");
    //         // Meteor._reload.reload();
    //       });
    //     } else {
    //       let data = JSON.parse(dataObject[0].data);
    //       let useData = data.tcurrency;
    //       let lineItems = [];
    //       let lineItemObj = {};
    //       for (let i = 0; i < data.tcurrency.length; i++) {
    //         // let taxRate = (useData[i].fields.Rate * 100).toFixed(2) + '%';
    //         var dataList = {
    //           id: data.tcurrency[i].fields.Id || "",
    //           code: data.tcurrency[i].fields.Code || "-",
    //           currency: data.tcurrency[i].fields.Currency || "-",
    //           symbol: data.tcurrency[i].fields.CurrencySymbol || "-",
    //           buyrate: data.tcurrency[i].fields.BuyRate || "-",
    //           sellrate: data.tcurrency[i].fields.SellRate || "-",
    //           country: data.tcurrency[i].fields.Country || "-",
    //           description: data.tcurrency[i].fields.CurrencyDesc || "-",
    //           ratelastmodified: data.tcurrency[i].fields.RateLastModified || "-"
    //         };

    //         dataTableList.push(dataList);
    //         //}
    //       }

    //       templateObject.datatablerecordscurrencypop.set(dataTableList);

    //       if (templateObject.datatablerecordscurrencypop.get()) {
    //         setTimeout(function () {
    //           MakeNegative();
    //         }, 100);
    //       }

    //       $(".fullScreenSpin").css("display", "none");
    //       setTimeout(function () {
    //         $("#tblCurrencyPopList").DataTable({
    //           columnDefs: [
    //             // {type: 'date', targets: 0},
    //             // { "orderable": false, "targets": -1 }
    //           ],
    //           sDom: "<'row'><'row'<'col-sm-12 col-md-6'f><'col-sm-12 col-md-6'l>r>t<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>B",
    //           buttons: [
    //             {
    //               extend: "excelHtml5",
    //               text: "",
    //               download: "open",
    //               className: "btntabletocsv hiddenColumn",
    //               filename: "taxratelist_" + moment().format(),
    //               orientation: "portrait",
    //               exportOptions: {
    //                 columns: ":visible"
    //               }
    //             }, {
    //               extend: "print",
    //               download: "open",
    //               className: "btntabletopdf hiddenColumn",
    //               text: "",
    //               title: "Tax Rate List",
    //               filename: "taxratelist_" + moment().format(),
    //               exportOptions: {
    //                 columns: ":visible"
    //               }
    //             }
    //           ],
    //           select: true,
    //           destroy: true,
    //           colReorder: {
    //             fixedColumnsRight: 1
    //           },
    //           // bStateSave: true,
    //           // rowId: 0,
    //           paging: false,
    //           // "scrollY": "400px",
    //           // "scrollCollapse": true,
    //           pageLength: initialDatatableLoad,
    //           lengthMenu: [
    //             [
    //               initialDatatableLoad, -1
    //             ],
    //             [
    //               initialDatatableLoad, "All"
    //             ]
    //           ],
    //           info: true,
    //           responsive: true,
    //           order: [
    //             [0, "asc"]
    //           ],
    //           action: function () {
    //             $("#tblCurrencyPopList").DataTable().ajax.reload();
    //           },
    //           fnDrawCallback: function (oSettings) {
    //             setTimeout(function () {
    //               MakeNegative();
    //             }, 100);
    //           },
    //           language: { search: "",searchPlaceholder: "Search List..." },
    //           fnInitComplete: function () {
    //             $("<button class='btn btn-primary btnAddNewCurrency' data-dismiss='modal' data-toggle='modal' data-target='#newCurrencyModal' type='button' style='padding: 4px 10px; font-size: 16px; margin-left: 12px !important;'><i class='fas fa-plus'></i></button>").insertAfter("#tblCurrencyPopList_filter");
    //             $("<button class='btn btn-primary btnRefreshCurrency' type='button' id='btnRefreshCurrency' style='padding: 4px 10px; font-size: 16px; margin-left: 12px !important;'><i class='fas fa-search-plus' style='margin-right: 5px'></i>Search</button>").insertAfter("#tblCurrencyPopList_filter");
    //           }
    //         }).on("page", function () {
    //           setTimeout(function () {
    //             MakeNegative();
    //           }, 100);
    //           let draftRecord = templateObject.datatablerecordscurrencypop.get();
    //           templateObject.datatablerecordscurrencypop.set(draftRecord);
    //         }).on("column-reorder", function () {}).on("length.dt", function (e, settings, len) {
    //           setTimeout(function () {
    //             MakeNegative();
    //           }, 100);
    //         });

    //         // $('#tblCurrencyPopList').DataTable().column( 0 ).visible( true );
    //         $(".fullScreenSpin").css("display", "none");
    //       }, 0);

    //       var columns = $("#tblCurrencyPopList th");
    //       let sTible = "";
    //       let sWidth = "";
    //       let sIndex = "";
    //       let sVisible = "";
    //       let columVisible = false;
    //       let sClass = "";
    //       $.each(columns, function (i, v) {
    //         if (v.hidden == false) {
    //           columVisible = true;
    //         }
    //         if (v.className.includes("hiddenColumn")) {
    //           columVisible = false;
    //         }
    //         sWidth = v.style.width.replace("px", "");

    //         let datatablerecordObj = {
    //           sTitle: v.innerText || "",
    //           sWidth: sWidth || "",
    //           sIndex: v.cellIndex || "",
    //           sVisible: columVisible || false,
    //           sClass: v.className || ""
    //         };
    //         tableHeaderList.push(datatablerecordObj);
    //       });
    //       templateObject.tableheaderrecords.set(tableHeaderList);
    //       $("div.dataTables_filter input").addClass("form-control form-control-sm");
    //     }
    //   }).catch(function (err) {
    //     taxRateService.getCurrencies().then(function (data) {
    //       let lineItems = [];
    //       let lineItemObj = {};
    //       for (let i = 0; i < data.tcurrency.length; i++) {
    //         // let taxRate = (data.tcurrency[i].fields.Rate * 100).toFixed(2) + '%';
    //         var dataList = {
    //           id: data.tcurrency[i].fields.Id || "",
    //           code: data.tcurrency[i].fields.Code || "-",
    //           currency: data.tcurrency[i].fields.Currency || "-",
    //           symbol: data.tcurrency[i].fields.CurrencySymbol || "-",
    //           buyrate: data.tcurrency[i].fields.BuyRate || "-",
    //           sellrate: data.tcurrency[i].fields.SellRate || "-",
    //           country: data.tcurrency[i].fields.Country || "-",
    //           description: data.tcurrency[i].fields.CurrencyDesc || "-",
    //           ratelastmodified: data.tcurrency[i].fields.RateLastModified || "-"
    //         };

    //         dataTableList.push(dataList);
    //         //}
    //       }

    //       templateObject.datatablerecordscurrencypop.set(dataTableList);

    //       if (templateObject.datatablerecordscurrencypop.get()) {
    //         Meteor.call("readPrefMethod", localStorage.getItem("mycloudLogonID"), "tblCurrencyPopList", function (error, result) {
    //           if (error) {} else {
    //             if (result) {
    //               for (let i = 0; i < result.customFields.length; i++) {
    //                 let customcolumn = result.customFields;
    //                 let columData = customcolumn[i].label;
    //                 let columHeaderUpdate = customcolumn[i].thclass.replace(/ /g, ".");
    //                 let hiddenColumn = customcolumn[i].hidden;
    //                 let columnClass = columHeaderUpdate.split(".")[1];
    //                 let columnWidth = customcolumn[i].width;
    //                 let columnindex = customcolumn[i].index + 1;

    //                 if (hiddenColumn == true) {
    //                   $("." + columnClass + "").addClass("hiddenColumn");
    //                   $("." + columnClass + "").removeClass("showColumn");
    //                 } else if (hiddenColumn == false) {
    //                   $("." + columnClass + "").removeClass("hiddenColumn");
    //                   $("." + columnClass + "").addClass("showColumn");
    //                 }
    //               }
    //             }
    //           }
    //         });

    //         setTimeout(function () {
    //           MakeNegative();
    //         }, 100);
    //       }

    //       $(".fullScreenSpin").css("display", "none");
    //       setTimeout(function () {
    //         $("#tblCurrencyPopList").DataTable({
    //           columnDefs: [
    //             {
    //               type: "date",
    //               targets: 0
    //             }, {
    //               orderable: false,
    //               targets: -1
    //             }
    //           ],
    //           sDom: "<'row'><'row'<'col-sm-12 col-md-6'f><'col-sm-12 col-md-6'l>r>t<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>B",
    //           buttons: [
    //             {
    //               extend: "excelHtml5",
    //               text: "",
    //               download: "open",
    //               className: "btntabletocsv hiddenColumn",
    //               filename: "taxratelist_" + moment().format(),
    //               orientation: "portrait",
    //               exportOptions: {
    //                 columns: ":visible"
    //               }
    //             }, {
    //               extend: "print",
    //               download: "open",
    //               className: "btntabletopdf hiddenColumn",
    //               text: "",
    //               title: "Tax Rate List",
    //               filename: "taxratelist_" + moment().format(),
    //               exportOptions: {
    //                 columns: ":visible"
    //               }
    //             }
    //           ],
    //           select: true,
    //           destroy: true,
    //           colReorder: {
    //             fixedColumnsRight: 1
    //           },
    //           // bStateSave: true,
    //           // rowId: 0,
    //           paging: false,
    //           scrollY: "400px",
    //           scrollCollapse: true,
    //           info: true,
    //           responsive: true,
    //           order: [
    //             [0, "asc"]
    //           ],
    //           action: function () {
    //             $("#tblCurrencyPopList").DataTable().ajax.reload();
    //           },
    //           fnDrawCallback: function (oSettings) {
    //             setTimeout(function () {
    //               MakeNegative();
    //             }, 100);
    //           },
    //           language: { search: "",searchPlaceholder: "Search List..." },
    //           fnInitComplete: function () {
    //             $("<button class='btn btn-primary btnAddNewCurrency' data-dismiss='modal' data-toggle='modal' data-target='#newCurrencyModal' type='button' style='padding: 4px 10px; font-size: 16px; margin-left: 12px !important;'><i class='fas fa-plus'></i></button>").insertAfter("#tblCurrencyPopList_filter");
    //             $("<button class='btn btn-primary btnRefreshCurrency' type='button' id='btnRefreshCurrency' style='padding: 4px 10px; font-size: 16px; margin-left: 12px !important;'><i class='fas fa-search-plus' style='margin-right: 5px'></i>Search</button>").insertAfter("#tblCurrencyPopList_filter");
    //           }
    //         }).on("page", function () {
    //           setTimeout(function () {
    //             MakeNegative();
    //           }, 100);
    //           let draftRecord = templateObject.datatablerecordscurrencypop.get();
    //           templateObject.datatablerecordscurrencypop.set(draftRecord);
    //         }).on("column-reorder", function () {}).on("length.dt", function (e, settings, len) {
    //           setTimeout(function () {
    //             MakeNegative();
    //           }, 100);
    //         });

    //         // $('#tblCurrencyPopList').DataTable().column( 0 ).visible( true );
    //         $(".fullScreenSpin").css("display", "none");
    //       }, 0);

    //       var columns = $("#tblCurrencyPopList th");
    //       let sTible = "";
    //       let sWidth = "";
    //       let sIndex = "";
    //       let sVisible = "";
    //       let columVisible = false;
    //       let sClass = "";
    //       $.each(columns, function (i, v) {
    //         if (v.hidden == false) {
    //           columVisible = true;
    //         }
    //         if (v.className.includes("hiddenColumn")) {
    //           columVisible = false;
    //         }
    //         sWidth = v.style.width.replace("px", "");

    //         let datatablerecordObj = {
    //           sTitle: v.innerText || "",
    //           sWidth: sWidth || "",
    //           sIndex: v.cellIndex || "",
    //           sVisible: columVisible || false,
    //           sClass: v.className || ""
    //         };
    //         tableHeaderList.push(datatablerecordObj);
    //       });
    //       templateObject.tableheaderrecords.set(tableHeaderList);
    //       $("div.dataTables_filter input").addClass("form-control form-control-sm");
    //     }).catch(function (err) {
    //       // Bert.alert('<strong>' + err + '</strong>!', 'danger');
    //       $(".fullScreenSpin").css("display", "none");
    //       // Meteor._reload.reload();
    //     });
    //   });
    // };

    //templateObject.getTaxRates();
    //templateObject.loadCurrencies();

    // templateObject.getCountryData = function () {
    //   getVS1Data("TCountries").then(function (dataObject) {
    //     if (dataObject.length == 0) {
    //       countryService.getCountry().then(data => {
    //         for (let i = 0; i < data.tcountries.length; i++) {
    //           countries.push(data.tcountries[i].Country);
    //         }
    //         countries.sort((a, b) => a.localeCompare(b));
    //         templateObject.countryData.set(countries);
    //       });
    //     } else {
    //       let data = JSON.parse(dataObject[0].data);
    //       let useData = data.tcountries;
    //       for (let i = 0; i < useData.length; i++) {
    //         countries.push(useData[i].Country);
    //       }
    //       countries.sort((a, b) => a.localeCompare(b));
    //       templateObject.countryData.set(countries);
    //     }
    //   }).catch(function (err) {
    //     countryService.getCountry().then(data => {
    //       for (let i = 0; i < data.tcountries.length; i++) {
    //         countries.push(data.tcountries[i].Country);
    //       }
    //       countries.sort((a, b) => a.localeCompare(b));
    //       templateObject.countryData.set(countries);
    //     });
    //   });
    // };
    //templateObject.getCountryData();

    $(document).on("click", ".table-remove", function () {
      event.stopPropagation();
      event.stopPropagation();
      var targetID = $(event.target).closest("tr").attr("id"); // table row ID
      $("#selectDeleteLineID").val(targetID);
      $("#deleteLineModal").modal("toggle");
    });
  });


Template.currencypop.events({

  'click .tblCurrencyPopList tbody tr': function (event) {
    var listData = $(this).closest("tr").find("td.colCurrencyID").text();
    if (listData) {
      $("#add-currency-title").text("Edit Currency");
      $("#sedtCountry").prop("readonly", true);
      if (listData !== "") {
        listData = Number(listData);
        //taxRateService.getOneCurrency(listData).then(function (data) {

        var currencyid = listData || "";
        var country = $(event.target).closest("tr").find(".colCountry").text() || "";
        var currencyCode = $(event.target).closest("tr").find(".colCode").text() || "";
        var currencySymbol = $(event.target).closest("tr").find(".colCurrencySymbol").text() || "";
        var currencyName = $(event.target).closest("tr").find(".colCurrency").text() || "";
        var currencyDesc = $(event.target).closest("tr").find(".colDescription").text() || "";
        var currencyBuyRate = $(event.target).closest("tr").find(".colBuyRate").text() || 0;
        var currencySellRate = $(event.target).closest("tr").find(".colSellRate").text() || 0;
        //data.fields.Rate || '';
        $("#edtCurrencyID").val(currencyid);
        $("#sedtCountry").val(country);
        $("#sedtCountry").attr("readonly", true);
        $("#sedtCountry").attr("disabled", "disabled");
        $("#currencyCode").val(currencyCode);
        $("#currencySymbol").val(currencySymbol);
        $("#edtCurrencyName").val(currencyName);
        $("#edtCurrencyDesc").val(currencyDesc);
        $("#edtBuyRate").val(currencyBuyRate);
        $("#edtSellRate").val(currencySellRate);

        //});

        // $(this).closest("tr").attr("data-target", "#myModal");
        // $(this).closest("tr").attr("data-toggle", "modal");
      }
    }
  },

  // "click #btnNewInvoice": function (event) {
  //   // FlowRouter.go('/invoicecard');
  // },
  // "click .chkDatatable": function (event) {
  //   var columns = $("#tblCurrencyPopList th");
  //   let columnDataValue = $(event.target).closest("div").find(".divcolumn").text();

  //   $.each(columns, function (i, v) {
  //     let className = v.classList;
  //     let replaceClass = className[1];

  //     if (v.innerText == columnDataValue) {
  //       if ($(event.target).is(":checked")) {
  //         $("." + replaceClass + "").css("display", "table-cell");
  //         $("." + replaceClass + "").css("padding", ".75rem");
  //         $("." + replaceClass + "").css("vertical-align", "top");
  //       } else {
  //         $("." + replaceClass + "").css("display", "none");
  //       }
  //     }
  //   });
  // },
  // "click .resetTable": function (event) {
  //   var getcurrentCloudDetails = CloudUser.findOne({_id: localStorage.getItem("mycloudLogonID"), clouddatabaseID: localStorage.getItem("mycloudLogonDBID")});
  //   if (getcurrentCloudDetails) {
  //     if (getcurrentCloudDetails._id.length > 0) {
  //       var clientID = getcurrentCloudDetails._id;
  //       var clientUsername = getcurrentCloudDetails.cloudUsername;
  //       var clientEmail = getcurrentCloudDetails.cloudEmail;
  //       var checkPrefDetails = CloudPreference.findOne({userid: clientID, PrefName: "tblCurrencyPopList"});
  //       if (checkPrefDetails) {
  //         CloudPreference.remove({
  //           _id: checkPrefDetails._id
  //         }, function (err, idTag) {
  //           if (err) {} else {
  //             Meteor._reload.reload();
  //           }
  //         });
  //       }
  //     }
  //   }
  // },
  // "click .saveTable": function (event) {
  //   let lineItems = [];
  //   $(".columnSettings").each(function (index) {
  //     var $tblrow = $(this);
  //     var colTitle = $tblrow.find(".divcolumn").text() || "";
  //     var colWidth = $tblrow.find(".custom-range").val() || 0;
  //     var colthClass = $tblrow.find(".divcolumn").attr("valueupdate") || "";
  //     var colHidden = false;
  //     if ($tblrow.find(".custom-control-input").is(":checked")) {
  //       colHidden = false;
  //     } else {
  //       colHidden = true;
  //     }
  //     let lineItemObj = {
  //       index: index,
  //       label: colTitle,
  //       hidden: colHidden,
  //       width: colWidth,
  //       thclass: colthClass
  //     };

  //     lineItems.push(lineItemObj);
  //   });

  //   var getcurrentCloudDetails = CloudUser.findOne({_id: localStorage.getItem("mycloudLogonID"), clouddatabaseID: localStorage.getItem("mycloudLogonDBID")});
  //   if (getcurrentCloudDetails) {
  //     if (getcurrentCloudDetails._id.length > 0) {
  //       var clientID = getcurrentCloudDetails._id;
  //       var clientUsername = getcurrentCloudDetails.cloudUsername;
  //       var clientEmail = getcurrentCloudDetails.cloudEmail;
  //       var checkPrefDetails = CloudPreference.findOne({userid: clientID, PrefName: "tblCurrencyPopList"});
  //       if (checkPrefDetails) {
  //         CloudPreference.update({
  //           _id: checkPrefDetails._id
  //         }, {
  //           $set: {
  //             userid: clientID,
  //             username: clientUsername,
  //             useremail: clientEmail,
  //             PrefGroup: "salesform",
  //             PrefName: "tblCurrencyPopList",
  //             published: true,
  //             customFields: lineItems,
  //             updatedAt: new Date()
  //           }
  //         }, function (err, idTag) {
  //           if (err) {
  //             $("#myModal2").modal("toggle");
  //           } else {
  //             $("#myModal2").modal("toggle");
  //           }
  //         });
  //       } else {
  //         CloudPreference.insert({
  //           userid: clientID,
  //           username: clientUsername,
  //           useremail: clientEmail,
  //           PrefGroup: "salesform",
  //           PrefName: "tblCurrencyPopList",
  //           published: true,
  //           customFields: lineItems,
  //           createdAt: new Date()
  //         }, function (err, idTag) {
  //           if (err) {
  //             $("#myModal2").modal("toggle");
  //           } else {
  //             $("#myModal2").modal("toggle");
  //           }
  //         });
  //       }
  //     }
  //   }
  //   $("#myModal2").modal("toggle");
  // },
  // "blur .divcolumn": function (event) {
  //   let columData = $(event.target).text();

  //   let columnDatanIndex = $(event.target).closest("div.columnSettings").attr("id");
  //   var datable = $("#tblCurrencyPopList").DataTable();
  //   var title = datable.column(columnDatanIndex).header();
  //   $(title).html(columData);
  // },
  // "change .rngRange": function (event) {
  //   let range = $(event.target).val();
  //   $(event.target).closest("div.divColWidth").find(".spWidth").html(range + "px");

  //   let columData = $(event.target).closest("div.divColWidth").find(".spWidth").attr("value");
  //   let columnDataValue = $(event.target).closest("div").prev().find(".divcolumn").text();
  //   var datable = $("#tblCurrencyPopList th");
  //   $.each(datable, function (i, v) {
  //     if (v.innerText == columnDataValue) {
  //       let className = v.className;
  //       let replaceClass = className.replace(/ /g, ".");
  //       $("." + replaceClass + "").css("width", range + "px");
  //     }
  //   });
  // },
  // "click .btnOpenSettings": function (event) {
  //   let templateObject = Template.instance();
  //   var columns = $("#tblCurrencyPopList th");

  //   const tableHeaderList = [];
  //   let sTible = "";
  //   let sWidth = "";
  //   let sIndex = "";
  //   let sVisible = "";
  //   let columVisible = false;
  //   let sClass = "";
  //   $.each(columns, function (i, v) {
  //     if (v.hidden == false) {
  //       columVisible = true;
  //     }
  //     if (v.className.includes("hiddenColumn")) {
  //       columVisible = false;
  //     }
  //     sWidth = v.style.width.replace("px", "");

  //     let datatablerecordObj = {
  //       sTitle: v.innerText || "",
  //       sWidth: sWidth || "",
  //       sIndex: v.cellIndex || "",
  //       sVisible: columVisible || false,
  //       sClass: v.className || ""
  //     };
  //     tableHeaderList.push(datatablerecordObj);
  //   });
  //   templateObject.tableheaderrecords.set(tableHeaderList);
  // },
  // "click #exportbtn": function () {
  //   $(".fullScreenSpin").css("display", "inline-block");
  //   jQuery("#tblCurrencyPopList_wrapper .dt-buttons .btntabletocsv").click();
  //   $(".fullScreenSpin").css("display", "none");
  // },
  // "click .btnRefresh": function () {
  //   $(".fullScreenSpin").css("display", "inline-block");
  //   sideBarService.getCurrencies().then(function (dataReload) {
  //     addVS1Data("TCurrency", JSON.stringify(dataReload)).then(function (datareturn) {
  //       location.reload(true);
  //     }).catch(function (err) {
  //       location.reload(true);
  //     });
  //   }).catch(function (err) {
  //     location.reload(true);
  //   });
  // },
  // "click .btnAddNewDepart": function () {
  //   $("#newTaxRate").css("display", "block");
  // },
  // "click .btnCloseAddNewDept": function () {
  //   playCancelAudio();
  //   setTimeout(function(){
  //   $("#newTaxRate").css("display", "none");
  //   }, delayTimeAfterSound);
  // },
  // "click .btnDeleteCurrency": function () {
  //   playDeleteAudio();
  //   let taxRateService = new TaxRateService();
  //   setTimeout(function(){

  //   let currencyId = $("#selectDeleteLineID").val();
  //   let objDetails = {
  //     type: "TCurrency",
  //     fields: {
  //       Id: currencyId,
  //       Active: false
  //     }
  //   };

  //   taxRateService.saveCurrency(objDetails).then(function (objDetails) {
  //     sideBarService.getCurrencies().then(function (dataReload) {
  //       addVS1Data("TCurrency", JSON.stringify(dataReload)).then(function (datareturn) {
  //         Meteor._reload.reload();
  //       }).catch(function (err) {
  //         Meteor._reload.reload();
  //       });
  //     }).catch(function (err) {
  //       Meteor._reload.reload();
  //     });
  //   }).catch(function (err) {
  //     swal({title: "Oooops...", text: err, type: "error", showCancelButton: false, confirmButtonText: "Try Again"}).then(result => {
  //       if (result.value) {
  //         Meteor._reload.reload();
  //       } else if (result.dismiss === "cancel") {}
  //     });
  //     $(".fullScreenSpin").css("display", "none");
  //   });
  // }, delayTimeAfterSound);
  // },
  // "click .btnAddCurrency": function () {
  //   $("#add-currency-title").text("Add New Currency");
  //   $("#sedtCountry").val("");
  //   $("#edtCurrencyID").val("");
  //   $("#sedtCountry").removeAttr("readonly", true);
  //   $("#sedtCountry").removeAttr("disabled", "disabled");
  //   $("#currencyCode").val("");
  //   $("#currencySymbol").val("");
  //   $("#edtCurrencyName").val("");
  //   $("#edtCurrencyName").val("");
  //   $("#edtBuyRate").val(1);
  //   $("#edtSellRate").val(1);
  // },
  // "change #sedtCountry": function () {
  //   let taxRateService = new TaxRateService();
  //   let selectCountry = $("#sedtCountry").val();
  //   $("#edtCurrencyID").val("");

  //   $("#currencyCode").val("");
  //   $("#currencySymbol").val("");
  //   $("#edtCurrencyName").val("");
  //   $("#edtCurrencyDesc").val("");
  //   $("#edtBuyRate").val(1);
  //   $("#edtSellRate").val(1);
  //   if (selectCountry != "") {
  //     taxRateService.getOneCurrencyByCountry(selectCountry).then(function (data) {
  //       for (let i = 0; i < data.tcurrency.length; i++) {
  //         if (data.tcurrency[i].Country === selectCountry) {
  //           var currencyid = data.tcurrency[i].Id || "";
  //           var country = data.tcurrency[i].Country || "";
  //           var currencyCode = data.tcurrency[i].Code || "";
  //           var currencySymbol = data.tcurrency[i].CurrencySymbol || "";
  //           var currencyName = data.tcurrency[i].Currency || "";
  //           var currencyDesc = data.tcurrency[i].CurrencyDesc;
  //           var currencyBuyRate = data.tcurrency[i].BuyRate || 0;
  //           var currencySellRate = data.tcurrency[i].SellRate || 0;

  //           setCurrentCurrencySymbol(currencySymbol);

  //           $("#edtCurrencyID").val(currencyid);
  //           // $('#sedtCountry').val(country);

  //           $("#currencyCode").val(currencyCode);
  //           $("#currencySymbol").val(currencySymbol);
  //           $("#edtCurrencyName").val(currencyName);
  //           $("#edtCurrencyDesc").val(currencyDesc);
  //           $("#edtBuyRate").val(currencyBuyRate);
  //           $("#edtSellRate").val(currencySellRate);
  //         }
  //       }

  //       //data.fields.Rate || '';
  //     });
  //   }
  // },
  // "click .btnSaveCurrency": function () {
  //   playSaveAudio();
  //   let taxRateService = new TaxRateService();
  //   setTimeout(function(){
  //   $(".fullScreenSpin").css("display", "inline-block");
  //   var currencyid = $("#edtCurrencyID").val();
  //   var country = $("#sedtCountry").val();
  //   var currencyCode = $("#currencyCode").val();
  //   var currencySymbol = $("#currencySymbol").val();
  //   var currencyName = $("#edtCurrencyName").val();
  //   var currencyDesc = $("#edtCurrencyDesc").val();
  //   var currencyBuyRate = $("#edtBuyRate").val() || 0;
  //   var currencySellRate = $("#edtSellRate").val() || 0;

  //   let objDetails = "";
  //   if (currencyName === "") {
  //     Bert.alert("<strong>WARNING:</strong> Currency Name cannot be blank!", "warning");
  //     $(".fullScreenSpin").css("display", "none");
  //     e.preventDefault();
  //   }

  //   if (currencyid == "") {
  //     objDetails = {
  //       type: "TCurrency",
  //       fields: {
  //         Active: true,
  //         Country: country,
  //         Code: currencyCode,
  //         CurrencySymbol: currencySymbol,
  //         Currency: currencyName,
  //         CurrencyDesc: currencyDesc,
  //         BuyRate: parseFloat(currencyBuyRate) || 1,
  //         SellRate: parseFloat(currencySellRate) || 1
  //       }
  //     };
  //   } else {
  //     objDetails = {
  //       type: "TCurrency",
  //       fields: {
  //         ID: parseInt(currencyid),
  //         Active: true,
  //         Country: country,
  //         Code: currencyCode,
  //         CurrencySymbol: currencySymbol,
  //         Currency: currencyName,
  //         CurrencyDesc: currencyDesc,
  //         BuyRate: parseFloat(currencyBuyRate) || 1,
  //         SellRate: parseFloat(currencySellRate) || 1
  //       }
  //     };
  //   }

  //   taxRateService.saveCurrency(objDetails).then(function (objDetails) {
  //     sideBarService.getCurrencies().then(function (dataReload) {
  //       addVS1Data("TCurrency", JSON.stringify(dataReload)).then(function (datareturn) {
  //         Meteor._reload.reload();
  //       }).catch(function (err) {
  //         Meteor._reload.reload();
  //       });
  //     }).catch(function (err) {
  //       Meteor._reload.reload();
  //     });
  //   }).catch(function (err) {
  //     swal({title: "Oooops...", text: err, type: "error", showCancelButton: false, confirmButtonText: "Try Again"}).then(result => {
  //       if (result.value) {
  //         Meteor._reload.reload();
  //       } else if (result.dismiss === "cancel") {}
  //     });
  //     $(".fullScreenSpin").css("display", "none");
  //   });
  // }, delayTimeAfterSound);
  // }

});

Template.currencypop.helpers({
  datatablerecordscurrencypop: () => {
    return Template.instance().datatablerecordscurrencypop.get().sort(function (a, b) {
      if (a.code == "NA") {
        return 1;
      } else if (b.code == "NA") {
        return -1;
      }
      return a.code.toUpperCase() > b.code.toUpperCase()
        ? 1
        : -1;
      // return (a.saledate.toUpperCase() < b.saledate.toUpperCase()) ? 1 : -1;
    });
  },
  tableheaderrecords: () => {
    return Template.instance().tableheaderrecords.get();
  },
  salesCloudPreferenceRec: () => {
    return CloudPreference.findOne({userid: localStorage.getItem("mycloudLogonID"), PrefName: "tblCurrencyPopList"});
  },
  countryList: () => {
    return Template.instance().countryData.get();
  },
  // loggedCompany: () => {
  //   return localStorage.getItem("mySession") || "";
  // },

  apiFunction:function() {
    let sideBarService = new SideBarService();
    return sideBarService.getCurrencyDataList;
  },

  searchAPI: function() {
    return sideBarService.getCurrencyDataList;
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
    let CustID = templateObject.data.custid ? templateObject.data.custid : '';
    return 'tblCurrencyPopList'+ CustID;
  },
});
