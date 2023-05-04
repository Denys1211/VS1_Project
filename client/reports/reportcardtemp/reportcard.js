import {ReactiveVar} from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import "./reportcard.html"
import { TaxRateService } from '../../settings/settings-service';
import { SideBarService } from '../../js/sidebar-service';
import { ReportService } from '../report-service';
import { UtilityService } from '../../utility-service';
import FxGlobalFunctions from '../../packages/currency/FxGlobalFunctions';
import Datehandler from '../../DateHandler';
import GlobalFunctions from '../../GlobalFunctions';
import LoadingOverlay from '../../LoadingOverlay';
import '../../lib/global/colResizable.js';

import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { cloneDeep } from 'lodash';


let sideBarService = new SideBarService();
let reportService = new ReportService();
let utilityService = new UtilityService();
let taxRateService = new TaxRateService();

let defaultCurrencyCode = CountryAbbr;

Template.reportcard.onCreated(function(){
    let templateObject = Template.instance();
    templateObject.reportrecords = new ReactiveVar([]);
    templateObject.transactiondatatablerecords = new ReactiveVar([]);
    templateObject.grandrecords = new ReactiveVar();
    templateObject.dateAsAt = new ReactiveVar();
    templateObject.deptrecords = new ReactiveVar();
    templateObject.reset_data = new ReactiveVar([]);
    templateObject.reportdata = new ReactiveVar([]);
    templateObject.apiParams = new ReactiveVar([]);
    templateObject.currencyList = new ReactiveVar([]);
    templateObject.recordCount = new ReactiveVar(0);
    templateObject.ignoreDate = new ReactiveVar(false);
    templateObject.fxCurrencies = new ReactiveVar([]);
    templateObject.totalCount = new ReactiveVar(0)

    let tempData = localStorage.getItem('fx_'+templateObject.data.tablename);
    if(tempData) {
      let _fxCurrencies = JSON.parse(tempData)?JSON.parse(tempData): [];
      templateObject.fxCurrencies.set(_fxCurrencies)
    }
  
    
    FxGlobalFunctions.initVars(templateObject);
    templateObject.reportOptions = new ReactiveVar();
    templateObject.init_reset_data = function () {
      let reset_data = templateObject.data.displaysettings;
      templateObject.reset_data.set(reset_data);
    }
    templateObject.init_reset_data();

    if(templateObject.data.listParam) {
      let params = templateObject.data.listParam;
      templateObject.apiParams.set(params);
    }

})

Template.reportcard.onRendered(async function() {
  let templateObject = Template.instance();
  let tablename = templateObject.data.tablename
    LoadingOverlay.show();
  
  
  
    // await reportService.getBalanceSheetReport(dateAOsf) :
  
    // --------------------------------------------------------------------------------------------------
    // templateObject.initDate = () => {
    //   Datehandler.initOneMonth();
    // };
    templateObject.setDateAs = (dateFrom = null) => {
      templateObject.dateAsAt.set((dateFrom) ? moment(new Date(dateFrom)).format("DD/MM/YYYY") : moment().format("DD/MM/YYYY"))
    };
    // templateObject.initDate();
  
    templateObject.getReportData = async function (limitCount, limitFrom,  dateFrom, dateTo, ignoreDate, contactID=null) {
      templateObject.setDateAs(dateFrom);
      let indexdbname = templateObject.data.indexDBName
      getVS1Data(indexdbname).then(function (dataObject) {
        if (dataObject.length == 0) {

          let params = cloneDeep(templateObject.apiParams.get());
              for (let i = 0; i < params.length; i++) {
                  if (params[i] == 'ignoreDate') {
                      params[i] = ignoreDate;
                  } else if (params[i] == 'dateFrom') {
                      params[i] = dateFrom
                  } else if (params[i] == 'dateTo') {
                      params[i] = dateTo
                  } else if (params[i] == 'limitFrom') {
                      params[i] = templateObject.recordCount.get();
                  } else if (params[i] == 'limitCount') {
                      params[i] = initialReportLoad
                  } else if (params[i] == 'deleteFilter') {
                      params[i] = false
                  }
              }
          let that = templateObject.data.service;
          templateObject.data.apiName.apply(that, params).then(async function(data) {
            templateObject.reportrecords.set(data[templateObject.data.lowercasename])
            await addVS1Data(indexdbname, JSON.stringify(data));
            templateObject.displayReportData(data)
          }).catch(function(err) {

          })
        
        } else {
          let data = JSON.parse(dataObject[0].data);
          templateObject.displayReportData(data);
        }
      }).catch(function (err) {
        let params = cloneDeep(templateObject.apiParams.get());
              for (let i = 0; i < params.length; i++) {
                  if (params[i] == 'ignoreDate') {
                      params[i] = ignoreDate;
                  } else if (params[i] == 'dateFrom') {
                      params[i] = dateFrom
                  } else if (params[i] == 'dateTo') {
                      params[i] = dateTo
                  } else if (params[i] == 'limitFrom') {
                      params[i] = templateObject.recordCount.get()
                  } else if (params[i] == 'limitCount') {
                      params[i] = initialReportLoad
                  } else if (params[i] == 'deleteFilter') {
                      params[i] = false
                  }
              }
          let that = templateObject.data.service;
          templateObject.data.apiName.apply(that, params).then(async function(data) {
            await addVS1Data(indexdbname, JSON.stringify(data));
            templateObject.displayReportData(data)
          }).catch(function(err) {})
      });

      templateObject.recordCount.set(initialReportLoad)
    }

    templateObject.getFilteredReportData = async function (dateFrom, dateTo, ignoreDate, limitCount=initialReportLoad, limitFrom=0, updateCount = true) {
      $('#'+tablename).DataTable().destroy();
      $('#tablePrint').DataTable().destroy();
      setTimeout(function(){
        let params = cloneDeep(templateObject.apiParams.get());
            for (let i = 0; i < params.length; i++) {
                if (params[i] == 'ignoreDate') {
                    params[i] = ignoreDate;
                } else if (params[i] == 'dateFrom') {
                    params[i] = dateFrom
                } else if (params[i] == 'dateTo') {
                    params[i] = dateTo
                } else if (params[i] == 'limitFrom') {
                    params[i] = limitFrom
                } else if (params[i] == 'limitCount') {
                    params[i] = limitCount
                } else if (params[i] == 'deleteFilter') {
                    params[i] = false
                }
            }
        let that = templateObject.data.service;
        templateObject.data.apiName.apply(that, params).then(async function(data) {
          // if($('#myInputSearch').val()!='') {
          //   addVS1Data(templateObject.data.indexDBName, JSON.stringify(data)).then(function(){})
          // }
          if(templateObject.recordCount.get() != 0 ) {
            let tempRecords = templateObject.reportrecords.get();

            for(let i = 0; i< data[templateObject.data.lowercasename].length; i++) {
              tempRecords.push(data[templateObject.data.lowercasename][i]);
            }
            let keyname = templateObject.data.lowercasename;
            let objData = {};

            objData[keyname]= tempRecords
            templateObject.reportrecords.set(tempRecords)
            templateObject.displayReportData(objData, updateCount)
          } else {
            templateObject.reportrecords.set(data[templateObject.data.lowercasename])
            templateObject.displayReportData(data, updateCount)
          }
          templateObject.recordCount.set(templateObject.recordCount.get() + initialReportLoad)
        }).catch(function(err) {})
      }, 1000)
    }
    let url = FlowRouter.current().path;
    if (url.indexOf("?dateFrom") > 0) {
      url = new URL(window.location.href);
      var getDateFrom = url.searchParams.get("dateFrom");
      var getLoadDate = url.searchParams.get("dateTo");
      if( typeof getDateFrom === undefined || getDateFrom == "" || getDateFrom === null){
        let currentUrl = FlowRouter.current().queryParams;
        getDateFrom = currentUrl.dateFrom
        getLoadDate = currentUrl.dateTo
      }
      $("#dateFrom").datepicker('setDate', moment(getDateFrom).format('DD/MM/YYYY'));
      $("#dateTo").datepicker('setDate', moment(getLoadDate).format('DD/MM/YYYY'));
    }
  
    templateObject.getReportData(
      initialReportLoad, 0,
        templateObject.data.tablename == 'tblbalancesheet' ? '' : GlobalFunctions.convertYearMonthDay($('#dateFrom').val()),
      GlobalFunctions.convertYearMonthDay($('#dateTo').val()),
      false,
    );
    templateObject.displayReportData = async function (data, updateCount = true) {
      let lowercasename = templateObject.data.lowercasename || templateObject.data.indexDBName.toLowerCase();
      if(data[lowercasename] && data[lowercasename].length > 0) {
        if(updateCount == true) {
          if(data.Params) {
            templateObject.totalCount.set(data.Params.Count || 0);
          } else {
            templateObject.totalCount.set(data[lowercasename].length);
          }
        }
        function groupBy(xs, prop) {
          var grouped = {};
          for (var i=0; i<xs.length; i++) {
            var p = xs[i][prop];
            if (!grouped[p]) { grouped[p] = []; }
            grouped[p].push(xs[i]);
          }
          return grouped;
        }
        let groupedData = groupBy(data[lowercasename], templateObject.data.mainfieldname);
        let keys = Object.keys(groupedData)
        let sumFieldsIndex=[];
        let datatableArr = [];
        let displaysettings = templateObject.reset_data.get();
        displaysettings.forEach((item, index) => {
          if(item.calc == true) {
            sumFieldsIndex.push(index)
          }
        });
        for(let i = 0; i< keys.length; i ++) {
          let subArr = [];
          if(groupedData[keys[i]].length > 0) {
            for(let j = 0; j<groupedData[keys[i]].length; j++) {
              let line = templateObject.data.datahandler(groupedData[keys[i]][j]);
              line[0] = ''
              subArr.push(line)
            }
            let calcedValues = [];
            for(let x = 0; x < sumFieldsIndex.length; x++) {
              calcedValues.push(0)
            }
            for(let k = 0 ; k< sumFieldsIndex.length; k++) {
              let index = sumFieldsIndex[k] - 1;
              if(index != undefined) {
                for(n = 0; n< subArr.length; n++) {
                  calcedValues[k] = calcedValues[k] + subArr[n][index];
                }
              }
            }
            let newLine = templateObject.data.datahandler('');
            newLine[0] = ' Total ' + keys[i] ;
            for(let o = 0; o<sumFieldsIndex.length; o++) {
              newLine[sumFieldsIndex[o]-1] = calcedValues[o]
            }
            subArr.push(newLine)

            subArr.forEach((item, index)=> {
              for(let p=0; p<sumFieldsIndex.length; p++) {
                item[sumFieldsIndex[p] - 1] = GlobalFunctions.showCurrency(item[sumFieldsIndex[p]-1])
              }
            })
          }
          let obj = {
            type: keys[i],
            subArr: subArr
          }
          datatableArr.push(obj)
         
        }
        let totalLine = templateObject.data.datahandler('');
        let totalValues = [];
            for(let x = 0; x < sumFieldsIndex.length; x++) {
              totalValues.push(0)
            }
            for(let k = 0 ; k< sumFieldsIndex.length; k++) {
              let index = sumFieldsIndex[k] - 1;
              if(index != undefined) {
                for(n = 0; n< datatableArr.length; n++) {
                  let subArray = datatableArr[n].subArr;
                  totalValues[k] = totalValues[k] + removeCurrencySymbol(subArray[subArray.length-1][index]);
                }
              }
            }
            function removeCurrencySymbol (data) {
              let retVal = Number(data.replace(/[^0-9.-]+/g,""));
              return retVal
            }
            for(let o = 0; o<sumFieldsIndex.length; o++) {
            
              totalLine[sumFieldsIndex[o] -1 ] = GlobalFunctions.showCurrency(totalValues[o])
            }
            totalLine[0]='Grand Total';
            datatableArr.push({type:'', subArr: [totalLine]})

        // }        
        templateObject.reportdata.set(datatableArr);
      } else {
        templateObject.reportdata.set('')
      }
    

      setTimeout(function () {
        $('#'+tablename).DataTable({
          searching: false,
          "sDom": "<'row'><'row'<'col-sm-12 col-md-6'f><'col-sm-12 col-md-6'l>r>t<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>B",
          // columnDefs: getColumnDef(),
          columnDefs: [
            { targets: '_all', orderable: false, width: '100px', } // make all columns not sortable
          ],
          colResize: true, 
          order: [[0, 'asc']], // default order by first column (type)
          
          buttons: [{
              extend: 'print',
              download: 'open',
              className: "btntabletopdf hiddenColumn",
              text: '',
              title: templateObject.data.exportfilename,
              filename: templateObject.data.exportfilename,
              exportOptions: {
                  columns: ':visible',
                  stripHtml: false
              },
              page: 'all'
          },
          {
            extend: 'csvHtml5',
            text: '',
            download: 'open',
            className: "btntabletocsv hiddenColumn",
            filename: templateObject.data.exportfilename,
            orientation: 'portrait',
            exportOptions: {
                columns: ':visible'
            }
          },
          {
            extend: 'excelHtml5',
            title: '',
            download: 'open',
            className: "btntabletoexcel hiddenColumn",
            filename: templateObject.data.exportfilename,
            orientation: 'portrait',
            exportOptions: {
                columns: ':visible'
            }
          }],
          select: true,
          destroy: true,
          colReorder: true,
          pageLength: initialDatatableLoad,
          lengthMenu: [[initialDatatableLoad, -1], [initialDatatableLoad, "All"]],
          info: true,
          responsive: false,
          // "order": [],
          "bsort": true,
          action: function () {
            $('#'+tablename).DataTable().ajax.reload();
          },
          "fnRowCallback": function( nRow, aData, iDisplayIndex ) {
                // if(aData[0] == GlobalFunctions.generateSpan(`Grand Total`, 'table-cells text-bold'))
                //     $(nRow).addClass("grandtotal");
                // else if(nRow != 0 && aData[6] == "")
                //     $(nRow).addClass("totalhr");
                if(nRow !=0 && aData[3] == '' && aData[2] == "") {
                  $(nRow).addClass("totalline")
                  if(aData[aData.length -1] == '' && aData[aData.length-2]=='') {
                    $(nRow).addClass('titleLine');
                  } else {
                    $(nRow).addClass("listhr");
                  }
                }
          },
          "fnDrawCallback": function (oSettings) {
            $('.paginate_button.page-item').removeClass('disabled');
            $('#' + tablename + '_ellipsis').addClass('disabled');
            if (oSettings._iDisplayLength == -1) {
                if (oSettings.fnRecordsDisplay() > 150) {

                }
            } else {

            }
            if (oSettings.fnRecordsDisplay() < initialReportLoad) {
                $('.paginate_button.page-item.next').addClass('disabled');
            }

            $('.paginate_button.next:not(.disabled)', this.api().table().container()).on('click', function () {
                $('.fullScreenSpin').css('display', 'inline-block');
                //var splashArrayCustomerListDupp = new Array();
                // let dataLenght = oSettings._iDisplayLength;
                // let customerSearch = $('#' + currenttablename + '_filter input').val();

                var dateFrom = new Date($("#dateFrom").datepicker("getDate"));
                var dateTo = new Date($("#dateTo").datepicker("getDate"));

                let formatDateFrom = dateFrom.getFullYear() + "-" + (dateFrom.getMonth() + 1) + "-" + dateFrom.getDate();
                let formatDateTo = dateTo.getFullYear() + "-" + (dateTo.getMonth() + 1) + "-" + dateTo.getDate();


                let params = cloneDeep(templateObject.apiParams.get());
                for (let i = 0; i < params.length; i++) {
                    if (params[i] == 'ignoredate') {
                        params[i] = templateObject.ignoreDate.get();
                    } else if (params[i] == 'dateFrom') {
                        params[i] = formatDateFrom
                    } else if (params[i] == 'dateTo') {
                        params[i] = formatDateTo
                    } else if (params[i] == 'limitFrom') {
                        params[i] = templateObject.recordCount.get();
                    } else if (params[i] == 'limitCount') {
                        params[i] = initialReportLoad
                    } else if (params[i] == 'deleteFilter') {
                        params[i] = deleteFilter
                    }
                }

                templateObject.getFilteredReportData(
                  GlobalFunctions.convertYearMonthDay($('#dateFrom').val()),
                  GlobalFunctions.convertYearMonthDay($('#dateTo').val()),
                  templateObject.ignoreDate.get(),
                  initialReportLoad,
                  templateObject.recordCount.get(),
                  false
                )

                
                
                let that = templateObject.data.service;
                // templateObject.data.apiName.apply(that, params).then(function (dataObjectnew) {
                //     for (let j = 0; j < dataObjectnew[indexDBLowercase].length; j++) {
                //         var dataList = templateObject.data.datahandler(dataObjectnew[indexDBLowercase][j])
                //         splashDataArray.push(dataList);
                //     }
                //     let uniqueChars = [...new Set(splashDataArray)];
                //     templateObject.transactiondatatablerecords.set(uniqueChars);
                //     var datatable = $('#' + tablename).DataTable();
                //     datatable.clear();
                //     datatable.rows.add(uniqueChars);
                //     templateObject.recordCount.set(templateObject.recordCount.get() + initialReportLoad)
                //     datatable.draw(false);
                //     setTimeout(function () {
                //         $('#' + tablename).dataTable().fnPageChange('last');
                //     }, 400);

                //     $('.fullScreenSpin').css('display', 'none');
                // }).catch(function (err) {
                //     $('.fullScreenSpin').css('display', 'none');
                // })
            });
            
          },
          "fnInfoCallback": function (oSettings, iStart, iEnd, iMax, iTotal, sPre) {
            let countTableData = 0;
            // if (data.Params) {
            //     countTableData = data.Params.Count || 0; //get count from API data
            // } else {
                countTableData = templateObject.totalCount.get()
            // }
            return 'Showing ' + iStart + " to " + iEnd + " of " + countTableData;
          },
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
        });

        $('#'+tablename).colResizable();

        $('#tablePrint').DataTable({
          searching: false,
          "sDom": "<'row'><'row'<'col-sm-12 col-md-6'f><'col-sm-12 col-md-6'l>r>t<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
          // columnDefs: getColumnDef(),
          order: [[0, 'asc']], // default order by first column (type)
          select: true,
          destroy: true,
          colReorder: true,
          lengthMenu: [[initialDatatableLoad, -1], [initialDatatableLoad, "All"]],
          info: true,
          responsive: true,
          // "order": [],
          "bsort": true,
          action: function () {
            $('#tablePrint').DataTable().ajax.reload();
          },
          "fnRowCallback": function( nRow, aData, iDisplayIndex ) {
                if(nRow !=0 && aData[3] == '' && aData[2] == "") {
                  $(nRow).addClass("totalline")
                  if(aData[aData.length -1] == '' && aData[aData.length-2]=='') {
                    $(nRow).addClass('titleLine');
                  } else {
                    $(nRow).addClass("listhr");
                  }
                }
          },
          "fnInfoCallback": function (oSettings, iStart, iEnd, iMax, iTotal, sPre) {
            let countTableData = 0;
            if (data.Params) {
                countTableData = data.Params.Count || 0; //get count from API data
            } 
            return 'Showing ' + iStart + " to " + iEnd + " of " + countTableData;
          },
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
        });
        $(".fullScreenSpin").css("display", "none");
        tableResize()
        LoadingOverlay.hide();
      }, 0);
  
      $('div.dataTables_filter input').addClass('form-control form-control-sm');

    }

    templateObject.getCurrencyList = function() {
      return new Promise((resolve, reject)=>{
        getVS1Data('TCurrencyList').then(function(dataObject){
          if(dataObject.length == 0) {
            taxRateService.getCurrencies().then(function(data){
              resolve(data.tcurrencylist)
            }).catch(function(e){resolve([])})
          } else {
            let data = JSON.parse(dataObject[0].data);
            let useData = data.tcurrencylist;
            resolve(useData)
          }
        }).catch(function(error){
          taxRateService.getCurrencies().then(function(data){
            resolve(data.tcurrencylist)
          }).catch(function(e){resolve([])})
        })
      })
    }

    let currencies = await templateObject.getCurrencyList();
    let currencyList = []
    for (let i = 0; i <currencies.length; i++) {
      // let taxRate = (data.tcurrency[i].fields.Rate * 100).toFixed(2) + '%';
      var dataList = {
        active: false,
        id:currencies[i].CurrencyID || "",
        code:currencies[i].Code || "-",
        currency:currencies[i].Currency || "-",
        symbol:currencies[i].CurrencySymbol || "-",
        buyrate:currencies[i].BuyRate || "-",
        sellrate:currencies[i].SellRate || "-",
        country:currencies[i].Country || "-",
        description:currencies[i].CurrencyDesc || "-",
        ratelastmodified:currencies[i].RateLastModified || "-"
      };

      currencyList.push(dataList);
    }

    templateObject.currencyList.set(currencyList)

    let _fxCurrencies = templateObject.fxCurrencies.get();
    let cloneCurrenyList = cloneDeep(templateObject.currencyList.get());
    for(let i = 0; i < _fxCurrencies.length; i++) {
      let _index = cloneCurrenyList.findIndex(item => {
        return item.id == _fxCurrencies[i].id
      })

      if(_index > -1) {
        cloneCurrenyList[_index].active = true
      } else {
        cloneCurrenyList[_index].active = false
      }
    }
    templateObject.currencyList.set(cloneCurrenyList)

  
    $(document).on('change', '#dateTo, #dateFrom', function () {
    // $(document).on('change', '#dateTo, #dateFrom', function () {
      LoadingOverlay.show();
      templateObject.recordCount.set(0);
      templateObject.reportrecords.set([]);
      templateObject.ignoreDate.set(false)
      templateObject.getFilteredReportData(
        GlobalFunctions.convertYearMonthDay($('#dateFrom').val()),
        GlobalFunctions.convertYearMonthDay($('#dateTo').val()),
        false,
        initialReportLoad,
        0
      )
    })

    $('#'+tablename).on('column-resize', function(e, settings, column) {
      
          $("#"+tablename+".JColResizer.JCLRFlex").attr("style", "width: auto !important")
    });
    LoadingOverlay.hide();
})

Template.reportcard.helpers({
  reportdata: ()=> {
    return Template.instance().reportdata.get();
  },
  reset_data: ()=> {
    return Template.instance().reset_data.get()
  },
  dateAsAt: () => {
    return Template.instance().dateAsAt.get();
  },

  currencyList: ()=>{
    return Template.instance().currencyList.get()
  },

  fxCurrencies: () => {
    return Template.instance().fxCurrencies.get();
  },
  filterfunction: function() {
    return function(param1, param2, param3, param4, param5) {
      return Template.instance().getFilteredReportData(param1, param2, param3, param4, param5)
    }
  },
  currencythlength: function(){
    return Template.instance().fxCurrencies.get().length + 1
  },

  currentCurrenySymbol: function() {
    return localStorage.getItem("ERPCountryAbbr");
  }
})

Template.reportcard.events({
  'change .currency-selector-js': function(event) {
    let templateObject = Template.instance();
    let currencyId = $(event.target).attr('currency-id');
    let currency = templateObject.currencyList.get().find(item=>{return item.id == currencyId})
    let currencies = cloneDeep(templateObject.fxCurrencies.get());
    if($(event.target).prop('checked') == true) {
      let index = currencies.findIndex(item => {return item.id.toString() == currencyId.toString()});
      if(index == -1) {
        currencies.push(currency)
      }
    } else {
      let index = currencies.findIndex(item => {return item.id.toString() == currencyId.toString()});
      if(index > -1) {
        currencies.splice(index, 1)
      }
    }
    templateObject.fxCurrencies.set(currencies)
  },
  'click .chkDatatable': function (event) {
    let columnDataValue = $(event.target).closest("div").find(".divcolumn").attr('valueupdate');
    if ($(event.target).is(':checked')) {
      $('.' + columnDataValue).addClass('showColumn');
      $('.' + columnDataValue).removeClass('hiddenColumn');
    } else {
      $('.' + columnDataValue).addClass('hiddenColumn');
      $('.' + columnDataValue).removeClass('showColumn');
    }
  },

 

  'change .custom-range': async function (event) {
    //   const tableHandler = new TableHandler();
    let range = $(event.target).val() || 0;
    let colClassName = $(event.target).attr("valueclass");
    await $('.' + colClassName).css('width', range);
    //   await $('.colAccountTree').css('width', range);
    $('.dataTable').resizable();
  },

  'click .btnRefresh': function () {
    $('.fullScreenSpin').css('display', 'inline-block');
    // Meteor._reload.reload();
    location.reload();
  },

  'click td a': function (event) {
      let redirectid = $(event.target).closest('tr').attr('id');

      let transactiontype = $(event.target).closest('tr').attr('class'); ;

      if (redirectid && transactiontype) {
          if (transactiontype === 'Bill') {
              window.open('/billcard?id=' + redirectid, '_self');
          } else if (transactiontype === 'PO') {
              window.open('/purchaseordercard?id=' + redirectid, '_self');
          } else if (transactiontype === 'Credit') {
              window.open('/creditcard?id=' + redirectid, '_self');
          } else if (transactiontype === 'Supplier Payment') {
              window.open('/supplierpaymentcard?id=' + redirectid, '_self');
          }
      }
      // window.open('/balancetransactionlist?accountName=' + accountName+ '&toDate=' + toDate + '&fromDate=' + fromDate + '&isTabItem='+false,'_self');
  },

  'click .btnPrintReport': async function (event) {
    let templateObject = Template.instance();
    let docTitle = templateObject.data.printDocTitle;
    let tableId = templateObject.data.tablename
    let targetElement = document.getElementById(tableId);
    var opt = {
        margin: 0,
        filename: docTitle,
        image: {
            type: 'jpeg',
            quality: 0.98
        },
        html2canvas: {
            scale: 2
        },
        jsPDF: {
            unit: 'in',
            format: 'a4',
            orientation: 'portrait'
        }
    };
    let source = targetElement;
    async function getAttachments () {
      return new Promise(async(resolve, reject)=> {
        html2pdf().set(opt).from(source).toPdf().output('datauristring').then(function(dataObject){
          let pdfObject = "";
          let base64data = dataObject.split(',')[1];
          pdfObject = {
            filename: docTitle,
            content: base64data,
            encoding: 'base64'
          }
          let attachments = [];
          attachments.push(pdfObject);
          resolve(attachments)
        })
      })
    }
    async function checkBasedOnType() {
      return new Promise(async(resolve, reject)=>{
        let values = [];
        let typeIndex = templateObject.data.typeIndex;
        let basedOnTypeStorages = Object.keys(localStorage);
        basedOnTypeStorages = basedOnTypeStorages.filter((storage) => {
            let employeeId = storage.split('_')[2];
            return storage.includes('BasedOnType_');
            // return storage.includes('BasedOnType_') && employeeId == localStorage.getItem('mySessionEmployeeLoggedID')
        });
        let i = basedOnTypeStorages.length;
        if (i > 0) {
            while (i--) {
                values.push(localStorage.getItem(basedOnTypeStorages[i]));
            }
        }
        for (let j =0; j<values.length; j++) {
          let value = values[j]
          let reportData = JSON.parse(value);
          reportData.HostURL = $(location).attr('protocal') ? $(location).attr('protocal') + "://" + $(location).attr('hostname') : 'http://' + $(location).attr('hostname');
          if (reportData.BasedOnType.includes("P")) {
              if (reportData.FormID == 1) {
                  let formIds = reportData.FormIDs.split(',');
                  if (formIds.includes(typeIndex.toString())) {
                      reportData.FormID = typeIndex;
                      reportData.attachments = await getAttachments()
                      Meteor.call('sendNormalEmail', reportData);
                      resolve();
                  }
              } else {
                  if (reportData.FormID == typeIndex) {
                    reportData.attachments = await getAttachments();
                    Meteor.call('sendNormalEmail', reportData);
                    resolve();
                  }
              }
          }
          if(j == values.length -1) {resolve()}
        }

      })
    }
    await checkBasedOnType()
  },

  // 'click .btnExportReport': function () {
  //   $('.fullScreenSpin').css('display', 'inline-block');

  //   let templateObject = Template.instance();

  //   const filename = loggedCompany + ' - '+templateObject.data.tabledisplayname+'' + '.csv';
  //   utilityService.exportReportToCsvTable('tableExport', filename, 'csv');
  // },
  // 'keyup #myInputSearch': function (event) {
  //   $('.table tbody tr').show();
  //   let searchItem = $(event.target).val();
  //   if (searchItem != '') {
  //       var value = searchItem.toLowerCase();
  //       $('.table tbody tr').each(function () {
  //           var found = 'false';
  //           $(this).each(function () {
  //               if ($(this).text().toLowerCase().indexOf(value.toLowerCase()) >= 0) {
  //                   found = 'true';
  //               }
  //           });
  //           if (found == 'true') {
  //               $(this).show();
  //           } else {
  //               $(this).hide();
  //           }
  //       });
  //   } else {
  //       $('.table tbody tr').show();
  //   }
  // },


  'keyup #myInputSearch': function (event) {
    let templateObject = Template.instance();
    let tablename = templateObject.data.tablename;
    let keyword = $(event.target).val();
    if(event.keyCode == 13) {
      LoadingOverlay.show()
      $('#'+tablename).DataTable().destroy();
      $('#tablePrint').DataTable().destroy();
      setTimeout(function(){

        let dateFrom = GlobalFunctions.convertYearMonthDay($('#dateFrom').val());
        let dateTo = GlobalFunctions.convertYearMonthDay($('#dateTo').val());
        let ignoreDate =  templateObject.ignoreDate.get();
        

        let params = cloneDeep(templateObject.apiParams.get());
        for (let i = 0; i < params.length; i++) {
            if (params[i] == 'ignoreDate') {
                params[i] = ignoreDate;
            } else if (params[i] == 'dateFrom') {
                params[i] = dateFrom
            } else if (params[i] == 'dateTo') {
                params[i] = dateTo
            } else if (params[i] == 'limitFrom') {
                params[i] = 0
            } else if (params[i] == 'limitCount') {
                params[i] = initialReportLoad
            } else if (params[i] == 'deleteFilter') {
                params[i] = false
            }
        }

        params.push(keyword)
        let that = templateObject.data.service;
        templateObject.data.searchFunction.apply(that, params).then(async function(data) {
            templateObject.displayReportData(data)
        }).catch(function(e){
          let objData = {};
          objData[templateObject.data.lowercasename] = []
          templateObject.displayReportData({objData})
        })
      }, 1000)
    }
  },
  // 'blur #myInputSearch': function (event) {
  //     $('.table tbody tr').show();
  //     let searchItem = $(event.target).val();
  //     if (searchItem != '') {
  //         var value = searchItem.toLowerCase();
  //         $('.table tbody tr').each(function () {
  //             var found = 'false';
  //             $(this).each(function () {
  //                 if ($(this).text().toLowerCase().indexOf(value.toLowerCase()) >= 0) {
  //                     found = 'true';
  //                 }
  //             });
  //             if (found == 'true') {
  //                 $(this).show();
  //             } else {
  //                 $(this).hide();
  //             }
  //         });
  //     } else {
  //         $('.table tbody tr').show();
  //     }
  // },
  "click #ignoreDate": async function () {
    let templateObject = Template.instance();
    LoadingOverlay.show();
    templateObject.ignoreDate.set(true)
    templateObject.recordCount.set(0)
    localStorage.setItem(templateObject.data.localStorageKeyName, "");
    $("#dateFrom").attr("readonly", true);
    $("#dateTo").attr("readonly", true);
    templateObject.getFilteredReportData(null, null, true, initialReportLoad, 0);
  },

  "click .currency-modal-save": (e) => {
    //$(e.currentTarget).parentsUntil(".modal").modal("hide");
    LoadingOverlay.show();

    let templateObject = Template.instance();

    // Get all currency list
    let _currencyList = templateObject.currencyList.get();
    let _fxCurrencies = templateObject.fxCurrencies.get();

    let strFxCurrencies = _fxCurrencies.length == 0? "": JSON.stringify(_fxCurrencies);
    localStorage.setItem('fx_'+ templateObject.data.tablename, strFxCurrencies);
    LoadingOverlay.hide();



    // Get all selected currencies
    // const currencySelected = $(".currency-selector-js:checked");
    // let _currencySelectedList = [];
    // if (currencySelected.length > 0) {
    // $.each(currencySelected, (index, e) => {
    //     const sellRate = $(e).attr("sell-rate");
    //     const buyRate = $(e).attr("buy-rate");
    //     const currencyCode = $(e).attr("currency");
    //     const currencyId = $(e).attr("currency-id");
    //     console
    //     let _currency = _currencyList.find((c) => c.id == currencyId);
    //     _currency.active = true;
    //     _currencySelectedList.push(_currency);
    // });
    // } else {
    // let _currency = _currencyList.find((c) => c.code == defaultCurrencyCode);
    // _currency.active = true;
    // _currencySelectedList.push(_currency);
    // }

    // _currencyList.forEach((value, index) => {
    // if (_currencySelectedList.some((c) => c.id == _currencyList[index].id)) {
    //     _currencyList[index].active = _currencySelectedList.find(
    //     (c) => c.id == _currencyList[index].id
    //     ).active;
    // } else {
    //     _currencyList[index].active = false;
    // }
    // });

    // _currencyList = _currencyList.sort((a, b) => {
    // if (a.code == defaultCurrencyCode) {
    //     return -1;
    // }
    // return 1;
    // });

    // // templateObject.activeCurrencyList.set(_activeCurrencyList);
    // templateObject.currencyList.set(_currencyList);

    // LoadingOverlay.hide();
  },

  'click .btnRefreshTable': async function (event) {
    let templateObject = Template.instance();
    let utilityService = new UtilityService();
    const dataTableList = [];
    $('.fullScreenSpin').css('display', 'inline-block');
    let tablename = templateObject.data.tablename;
    let dataSearchName = $('#' + tablename + '_filter input').val();
    if (dataSearchName.replace(/\s/g, '') != '') {
        let that = templateObject.data.service;
        if (that == undefined) {
            $('.fullScreenSpin').css('display', 'none');
            $('.btnRefreshTable').removeClass('btnSearchAlert');
            return;
        }
        let paramArray = [dataSearchName]
        templateObject.data.searchAPI.apply(that, paramArray).then(function (data) {
            $('.btnRefreshTable').removeClass('btnSearchAlert');
            templateObject.displayTableData(data, true)
        }).catch(function (err) {
            $('.fullScreenSpin').css('display', 'none');
        });
    } else {
        $(".btnRefresh").trigger("click");
    }
},
  // ...Datehandler.getDateRangeEvents(),

  ...FxGlobalFunctions.getEvents(),
})

Template.registerHelper('lookup', function (obj, key) {
  return obj[key-1];
});

Template.registerHelper('convert2foreign', function(item, index, fx) {
  let templateObject = Template.instance();
  if(templateObject.data.transType == 'purchase') {
    return FxGlobalFunctions.convertToForeignAmount(item[index-1], fx.buyrate, fx.symbol)
  }else {
    return FxGlobalFunctions.convertToForeignAmount(item[index-1], fx.sellrate, fx.symbol)
  }
})
Template.registerHelper('concat', function(param1, param2) {
  return parseFloat(param1.toString() + '.'+ param2.toString())
})
