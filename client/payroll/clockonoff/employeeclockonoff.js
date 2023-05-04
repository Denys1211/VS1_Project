import { ReactiveVar } from 'meteor/reactive-var';
import { CoreService } from '../../js/core-service';
import { UtilityService } from "../../utility-service";
import { ContactService } from "../../contacts/contact-service";
import { AppointmentService } from '../../appointments/appointment-service';
import {Template} from 'meteor/templating';
import './employeeclockonoff.html';
import LoadingOverlay from "../../LoadingOverlay";
import { SideBarService } from "../../js/sidebar-service";
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import CachedHttp from "../../lib/global/CachedHttp";
import erpObject from "../../lib/global/erp-objects";
import { cloneDeep, template } from 'lodash'; 


let utilityService = new UtilityService();
let sideBarService = new SideBarService();
let contactService = new ContactService();  


Template.clockOnOff.onCreated(function () {
  const templateObject = Template.instance();
  templateObject.datatablerecords = new ReactiveVar([]);
  templateObject.employeerecords = new ReactiveVar([]);
  templateObject.jobsrecords = new ReactiveVar([]);
  templateObject.tableheaderrecords = new ReactiveVar([]);
  templateObject.appointmentrecords = new ReactiveVar([]);
  templateObject.selectedFile = new ReactiveVar();
  templateObject.timesheetrecords = new ReactiveVar([]);
  templateObject.breaktime = new ReactiveVar(0);
  templateObject.breakStartTime = new ReactiveVar();
  templateObject.clockonstatus = new ReactiveVar([]);
  templateObject.onHoldStatus = new ReactiveVar(false);
  templateObject.clockonToHoldTime = new ReactiveVar(0);
  templateObject.holdTime = new ReactiveVar(0);

  
  //get ClockOnStatus
  templateObject.getClockOnStatus = async function() {
    return new Promise(async(resolve, reject)=>{
        getVS1Data('TClockOnStatus').then(function(dataObject){
            if(dataObject.length == 0) {
                resolve ([]);
            }else  {
                let data = JSON.parse(dataObject[0].data);
                resolve(data);
            }
        })
    })
  }

  templateObject.getTimeSheet = async function() {
    return new Promise(async(resolve, reject)=>{
        getVS1Data('TTimeSheet').then(function(dataObject){
            if(dataObject.length == 0) {
                resolve ([]);
            }else  {
                let data = JSON.parse(dataObject[0].data);
                resolve(data);
            }
        })
    })
  }
  
});

Template.clockOnOff.onRendered(async function () {

  let templateObject = Template.instance();

  $('.fullScreenSpin').css('display', 'inline-block');
   $(".formClassDate").datepicker({
    showOn: 'button',
    buttonText: 'Show Date',
    buttonImageOnly: true,
    buttonImage: '/img/imgCal2.png',
    dateFormat: 'dd/mm/yy',
    showOtherMonths: true,
    selectOtherMonths: true,
    changeMonth: true,
    changeYear: true,
    yearRange: "-90:+10",
  });

  var currentDate = new Date();
  var begunDate = moment(currentDate).format("DD/MM/YYYY");
  $('.formClassDate').val(begunDate);
  $('#employee_name').editableSelect();
  $('#employee_name').editableSelect().on('click.editable-select', function (e, li) {
    var $earch = $(this);
    var offset = $earch.offset();
    var employeeDataName = e.target.value || '';
    if (e.pageX > offset.left + $earch.width() - 8) { // X button 16px wide?
        $('#employeeListPOPModal').modal();
        setTimeout(function () {
            $('#tblEmployeelist_filter .form-control-sm').focus();
            $('#tblEmployeelist_filter .form-control-sm').val('');
            $('#tblEmployeelist_filter .form-control-sm').trigger("input");
            var datatable = $('#tblEmployeelist').DataTable();
            //datatable.clear();
            //datatable.rows.add(splashArrayCustomerList);
            datatable.draw();
            $('#tblEmployeelist_filter .form-control-sm').trigger("input");
            //$('#tblEmployeelist').dataTable().fnFilter(' ').draw(false);
        }, 500);
    } else {          
      $('#employeeListPOPModal').modal();              
    }
  });

  $("#employeeClockonoffModal").modal("show");


  let ClockOnStatus = await templateObject.getClockOnStatus();
  let startTime ;
  $("#employee_name").val(localStorage.getItem('mySessionEmployee'));     
  $("#btnClockOff").prop("disabled", true);

  for(let i = 0 ; i < ClockOnStatus.length ; i++) {
    if(ClockOnStatus[i].fields.Status == "Clock On") {
      $('#employee_name').val(ClockOnStatus[i].fields.EmployeeName);
      startTime = new Date(ClockOnStatus[i].fields.StartTime);
      let hours = startTime.getHours();
      let hr_str = hours.toString().padStart(2,'0');
      let minutes = startTime.getMinutes();
      let min_str = minutes.toString().padStart(2,'0');

      $('#startTime').val(hr_str + ":" + min_str);
      $("#btnClockOn").prop("disabled", true);
      $("#btnClockOff").removeAttr("disabled");

    }   

    if(ClockOnStatus[i].fields.Status == "Paused")  {
      let break_start_time = ClockOnStatus[i].fields.StartTime;
      let clockontime_pause = ClockOnStatus[i].fields.PausedTime
      $("#btnClockOff").prop("disabled", true);
      $("#btnHoldOne").prop("disabled", true);
      $("#btnClockOn").removeAttr("disabled");

      templateObject.clockonToHoldTime.set(clockontime_pause); 
      templateObject.onHoldStatus.set(true);   
      templateObject.breakStartTime.set(new Date(break_start_time));
    }


  } 

  let timesheetlist = await templateObject.getTimeSheet();

  let barcodeForce = false;  // Barcode Force Check
  barcodeForce = JSON.parse(localStorage.getItem("CloudEnforceBarcodeScan"));

  if(barcodeForce) {
    $('#employee_name').prop("disabled", true);
    $('#employee_name').css('background-color', '#e3e6f0');
    
    $("#barcodeScanInput").removeAttr('disabled');
    $("#btnDesktopSearch").removeAttr('disabled');
    $("#scanBarcode").removeAttr('disabled');

  } else {
    $('#barcodeScanInput').prop("disabled", true);
    $('#btnDesktopSearch').prop("disabled", true);
    $('#scanBarcode').prop("disabled", true);
    $("#employee_name").removeAttr('disabled');
    $('#employee_name').css('background-color', '#ffffff');
  }
  
  $(document).on("click", "#tblEmployeelist tbody tr", function (e) {
    let employeeName = $(this).find(".colEmployeeName").text() || '';
    let employeeID = $(this).find(".colEmployeeNo").text() || '';
  
   // let employeeName = $(this).find(".colFirstName").text() || '';
   // let employeeID = $(this).find(".colEmployeeName").text() || '';
    $('#employee_name').val(employeeName);
    $('#employee_id').val(employeeID);
    $('#barcodeScanInput').prop("disabled", true);
    $('#employeeListPOPModal').modal('toggle');
  });

  document
    .querySelector("#barcodeScanInput")
    .addEventListener("keypress", function (e) {
      if (e.key == "Enter") {
        $("#btnDesktopSearch").trigger("click");
      }
    }); 
    

  //
  // Initializes jQuery Raty control
  //
  function initDataTableCtrl(container) {
    $('select', container).select2();
  }
  var today = moment().format('DD/MM/YYYY');
  var currentDate = new Date();
  var begunDate = moment(currentDate).format("DD/MM/YYYY");
  let fromDateMonth = (currentDate.getMonth() + 1);
  let fromDateDay = currentDate.getDate();
  if ((currentDate.getMonth()+1) < 10) {
    fromDateMonth = "0" + (currentDate.getMonth()+1);
  }

  if (currentDate.getDate() < 10) {
    fromDateDay = "0" + currentDate.getDate();
  }
  var fromDate = fromDateDay + "/" + (fromDateMonth) + "/" + currentDate.getFullYear();

  templateObject.diff_hours = function (dt2, dt1) {
    var diff = (dt2.getTime() - dt1.getTime()) / 1000;
    diff /= (60 * 60);
    return Math.abs(diff);
  }

  templateObject.dateFormat = function (date) {
    var dateParts = date.split("/");
    var dateObject = dateParts[2] + '/' + ('0' + (dateParts[1] - 1)).toString().slice(-2) + '/' + dateParts[0];
    return dateObject;
  }
  Meteor.call('readPrefMethod', localStorage.getItem('mycloudLogonID'), 'tblTimeSheet', function (error, result) {
    if (error) {

    } else {
      if (result) {

        for (let i = 0; i < result.customFields.length; i++) {
          let customcolumn = result.customFields;
          let columData = customcolumn[i].label;
          let columHeaderUpdate = customcolumn[i].thclass.replace(/ /g, ".");
          let hiddenColumn = customcolumn[i].hidden;
          let columnClass = columHeaderUpdate.split('.')[1];
          let columnWidth = customcolumn[i].width;

          $("th." + columnClass + "").html(columData);
          $("th." + columnClass + "").css('width', "" + columnWidth + "px");

        }
      }

    }
  });

  templateObject.timeToDecimal = function (time) {
    var hoursMinutes = time.split(/[.:]/);
    var hours = parseInt(hoursMinutes[0], 10);
    var minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
    return hours + minutes / 60;
  };

  templateObject.loadTimeSheet = async (refresh = false) => {
    let data = await CachedHttp.get(erpObject.TTimeSheet, async () => {
        return await sideBarService.getAllTimeSheetList();
    }, {
        useIndexDb: true,
        useLocalStorage: false,
        fallBackToLocal: true,
        forceOverride: refresh,
        validate: (cachedResponse) => {
            return true;
        }
    });

    data = data.response;
    let timesheets = data.ttimesheet.map(t => t.fields);
    timesheets.forEach((t, index) => {
      if (t.Status == "") {
        t.Status = "Draft";
      }
    });
    
  templateObject.timesheetrecords.set(timesheets); 
  }

  templateObject.loadTimeSheet(false) ;  

});

Template.clockOnOff.events({
  
  'click #btnClockOn': async function () {
    const templateObject = Template.instance();
   
    let holdtime = 0; 
    if(templateObject.onHoldStatus.get()) {

      let current_time = moment().startOf('hour').format('HH') + ":" + moment().startOf('minute').format('mm');
      let date1 = moment().format('YYYY-MM-DD'); 
      let current_date_time = new Date(date1 + ' ' + current_time + ':00');
      let breakStartTime = templateObject.breakStartTime.get();

      holdtime = templateObject.diff_hours(current_date_time, breakStartTime) * 60; 
      templateObject.holdTime.set(holdtime/60);
      
    }  else {
      $("#startTime").val(moment().startOf('hour').format('HH') + ":" + moment().startOf('minute').format('mm'));
    }

    
    let date = new Date();
    let date1 = date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + (date.getDate())).slice(-2);
    var endTime = new Date(date1 + ' ' + document.getElementById("endTime").value + ':00');
    var startTime = new Date(date1 + ' ' + document.getElementById("startTime").value + ':00');

    if (endTime > startTime) {
      document.getElementById('txtBookedHoursSpent').value = parseFloat(templateObject.diff_hours(endTime, startTime)).toFixed(2);
    }
    
    $("#txtBookedHoursSpent").val("");
    $("#endTime").val("");

    $("#btnClockOn").prop("disabled", true);
    $("#btnClockOff").removeAttr("disabled");
    $("#btnHoldOne").removeAttr("disabled");
    
    
    let employee_name = $("#employee_name").val();
    let employee_id = $("#employee_id").val();

    // let timesheet_temp = await templateObject.getTimeSheet();
    // let timesheetlist = timesheet_temp.ttimesheet;
  
    // let currenttimesheet;
    // let checkArray_timesheet = Array.isArray(timesheetlist);
    
    // if(checkArray_timesheet) {
    //   let current_index = timesheetlist.findIndex(timesheet => {
    //     return (timesheet.fields.InvoiceNotes === "Clock Off" || timesheet.fields.InvoiceNotes === "Paused") && timesheet.field.EmployeeName === employee_name ;
    //   })

      
    //   if(current_index > -1) {

    //     currenttimesheet = timesheetlist[current_index];
    //     let temptimesheetlist = cloneDeep(currenttimesheet);
    //     temptimesheetlist.fields = {...temptimesheetlist.filds, InvoiceNotes: "Clock On", StartTime: startTime};
    //     timesheetlist.splice(current_index, 1, temptimesheetlist);
    //     addVS1Data('TTimeSheet', JSON.stringify({ttimesheet:timesheetlist})).then(function(){

    //     })

    //   }else {
    //     let new_timesheet = {
    //       fileds : {
    //         EmployeeName : employee_name,
    //         InvoiceNotes : "Clock On",
    //         StartTime: startTime,
    //         EndTime: "",
            
    //       },
    //       type : "TTimeSheet"
    //     };
    //     timesheetlist.push(new_timesheet);
    //     addVS1Data('TTimeSheet', JSON.stringify({ttimesheet:timesheetlist})).then(function(data){
    //     });

    //   }
    // }
   
    let clockonstatusList = [];
        clockonstatusList = await templateObject.getClockOnStatus();
    let currentClockOnStatus;
    let checkArray = Array.isArray(clockonstatusList);
 
    if(checkArray) {
      let pausedindex = clockonstatusList.findIndex(clockonstatus => {
        return clockonstatus.fields.Status === "Paused" && clockonstatus.fields.EmployeeName === employee_name;
      })

      let clockonindex = clockonstatusList.findIndex(clockonstatus => {
        return clockonstatus.fields.EmployeeName == employee_name ;
      })

      if(pausedindex > -1) {
        clockonstatusList.splice(pausedindex, 1);
        addVS1Data('TClockOnStatus', JSON.stringify(clockonstatusList)).then(function(){
        })

      }else {
        if(clockonindex > -1) {
          currentClockOnStatus = clockonstatusList[clockonindex];        
          let tempClockOnStatus = cloneDeep(currentClockOnStatus);
          tempClockOnStatus.fields = {...tempClockOnStatus.fields, Status:"Clock On", StartTime:startTime };
          clockonstatusList.splice(clockonindex, 1, tempClockOnStatus);
          addVS1Data('TClockOnStatus', JSON.stringify(clockonstatusList)).then(function(){
          })
        
        } else {
          let clockon_data = {
            type : "TClockOnStatus",
            fields: {
              EmployeeName: employee_name || '',
              EmployeeId: employee_id || '',
              Status: "Clock On",
              StartTime:startTime,
            }
          };
          clockonstatusList.push(clockon_data);
          addVS1Data('TClockOnStatus', JSON.stringify(clockonstatusList)).then(function(){
          });
        }
      }
      

    }else {
      if(clockonstatusList.fields.EmployeeName == employee_name) {
         clockonstatusList.fields.Status = "Clock On";
         clockonstatusList.fields.StartDatetime = startTime;

         addVS1Data('TClockOnStatus', JSON.stringify(clockonstatusList)).then(function(){

         })

      } else {
        let tempClockOnStatus = [];
            tempClockOnStatus[0] = clockonstatusList;
        let clockon_data = {
          type : "TClockOnStatus",
          fields: {
            EmployeeName: employee_name || '',
            EmployeeId: employee_id || '',
            Status: "Clock On",
            StartTime:startTime,
          }
        };
        tempClockOnStatus.push(clockon_data);        
        addVS1Data('TClockOnStatus', JSON.stringify(tempClockOnStatus)).then(function(){
        });
      }
    } 
    if(templateObject.onHoldStatus.get()) {
      swal('Job Hold is ended. Hold time  is ' + holdtime + ' minutes', '', 'success'); 
    } else {
      swal($("#employee_name").val() + ' is Clocked On now', '', 'success'); 
    }
   
    templateObject.onHoldStatus.set(false);    
     
  },

  'click #btnClockOff': async function () {
   
    const templateObject = Template.instance();
    let date = new Date();
    document.getElementById("endTime").value = moment().startOf('hour').format('HH') + ":" + moment().startOf('minute').format('mm');
    let date1 = date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + (date.getDate())).slice(-2);
    var endTime = new Date(date1 + ' ' + document.getElementById("endTime").value + ':00');
    var startTime = new Date(date1 + ' ' + document.getElementById("startTime").value + ':00');
    document.getElementById('txtBookedHoursSpent').value = parseFloat(templateObject.diff_hours(endTime, startTime)).toFixed(2);

    $("#btnClockOff").prop("disabled", true);
    $("#btnClockOn").removeAttr("disabled");

    let employee_name = $("#employee_name").val();
    let employee_id = $("#employee_id").val();
    
    let clockonstatusList = await templateObject.getClockOnStatus();
    let currentClockOnStatus;

    let clockonindex = clockonstatusList.findIndex(order => {
        return order.fields.EmployeeName == employee_name;
    })

   
    if(clockonindex > -1) {
        currentClockOnStatus = clockonstatusList[clockonindex];        
        let tempClockOnStatus = cloneDeep(currentClockOnStatus);
        tempClockOnStatus.fields = {...tempClockOnStatus.fields, Status:"Clock Off", EndTime:endTime }
        clockonstatusList.splice(clockonindex, 1, tempClockOnStatus);
        addVS1Data('TClockOnStatus', JSON.stringify(clockonstatusList)).then(function(){

        })
    } else {
      let clockon_data = {
        type : "TClockOnStatus",
        fields: {
          EmployeeName: employee_name || '',
          EmployeeId: employee_id || '',
          Status: "Clock Off",
          EndTime: endTime,
        }
      }

      clockonstatusList.push(clockon_data);
  
      addVS1Data("TClockOnStatus",JSON.stringify(clockon_data));
    }
    
    swal($("#employee_name").val() + ' is Clocked Off ', '', 'success');
    

    // let clockList = templateObject.timesheetrecords.get();

    // let updateID = $("#updateID").val() || "";
    // let employeeName = $("#employee_name").val() || "";
    // let employeeId = $("#employee_id").val() || "";
    
    // LoadingOverlay.show();

    // data = {
    //   type: "TTimeSheetEntry",
    //   fields: {
        
    //     TimeSheet: [
    //       {
    //         type: "TTimeSheet",
    //         fields: {
    //           ID:updateID,
    //           EmployeeName: employeeName || "",
    //           TimeSheetDate: date,
    //           StartTime: startTime,
    //           InvoiceNotes: "Clocked Off",
    //           Status: "Unprocessed",
    //           Hours: 0.001,
    //           // EntryDate: accountdesc|| ''
    //         },
    //       },
    //     ],
    //     TypeName: "Payroll",
    //     WhoEntered: localStorage.getItem("mySessionEmployee") || "",
    //   },
    // };


    // contactService
    //   .saveTimeSheet(data)
    //   .then(function (dataReturnRes) {
        
    //     sideBarService.getAllTimeSheetList().then(function (data) {
    //       $("#updateID").val(data.ttimesheet[0].fields.ID);

    //       addVS1Data("TTimeSheet", JSON.stringify(data));
                   
                
    //       swal($("#employee_name").val() + ' is Clocked Off ', '', 'success');
    //       // $("#employeeClockonoffModal").modal("hide");
          
    //       $(".fullScreenSpin").css("display", "none");
    //       // FlowRouter.go('/');
    //     });
    //   })
   
  },

  "click #btnHoldOne": function (event) {
    let templateObject = Template.instance();
    let date1 = moment().format('YYYY-MM-DD');
    $("#frmOnHoldModal").modal("show");
    let current_time = moment().startOf('hour').format('HH') + ":" + moment().startOf('minute').format('mm');
    let break_start_time = new Date(date1 + ' ' + current_time + ':00'); 
    $('#lunch').prop('checked', true);
    $('#break').prop('checked', false);
    $('#personal').prop('checked', false);
   
    $("#txtpause-notes").trigger("focus");
    

    templateObject.breakStartTime.set(break_start_time);
    templateObject.onHoldStatus.set(true);
  },

  'change #startTime': function () {
    const templateObject = Template.instance();
    let date1 = moment().format('YYYY-MM-DD');  
    var endTime = new Date(date1 + ' ' + document.getElementById("endTime").value + ':00');
    var startTime = new Date(date1 + ' ' + document.getElementById("startTime").value + ':00');

    if (endTime > startTime) {
      document.getElementById('txtBookedHoursSpent').value = parseFloat(templateObject.diff_hours(endTime, startTime)).toFixed(2);
    } else {
    }
  },

  'change #endTime': function () {
    const templateObject = Template.instance();
    // let date1 = date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2) + "-" + ("0" + (date.getDate())).slice(-2);
    let date1 = moment().format('YYYY-MM-DD');    
    var endTime = new Date(date1 + ' ' + document.getElementById("endTime").value + ':00');
    var startTime = new Date(date1 + ' ' + document.getElementById("startTime").value + ':00');
   
    if (endTime > startTime) {
      document.getElementById('txtBookedHoursSpent').value = parseFloat(templateObject.diff_hours(endTime, startTime)).toFixed(2);
    } else {

    }
  },
   
  'click .btnSaveTimeSheetOne': async function () {    
    
    playSaveAudio();

    let templateObject = Template.instance();
    
    setTimeout(async function(){      
    //  LoadingOverlay.show();
      let checkStatus = "";
      let checkStartTime = "";     
     
      var employeeName = $("#employee_name").val();      
      var employeeId = $("#employee_id").val();
      var updateId = $("#updateId").val();
    
      // Employee Clock On to Clock Off
      let clockonstatusList = await templateObject.getClockOnStatus();
      let currentClockOnStatus;
      let clockonindex = clockonstatusList.findIndex(order => {
          return order.fields.EmployeeName == employeeName;
      })

      if(clockonindex > -1) {
          currentClockOnStatus = clockonstatusList[clockonindex];        
          let tempClockOnStatus = cloneDeep(currentClockOnStatus);
          tempClockOnStatus.fields = {...tempClockOnStatus.fields, Status:"Clock Off" }
          clockonstatusList.splice(clockonindex, 1, tempClockOnStatus);
          addVS1Data('TClockOnStatus', JSON.stringify(clockonstatusList)).then(function(){

          })
      }
       // Employee Clock On to Clock Off End

      let holdTime ;
      holdTime = templateObject.holdTime.get();

      var startdateGet = new Date();
      var endDateGet = new Date();
      let date =
        startdateGet.getFullYear() +
        "-" +
        ("0" + (startdateGet.getMonth() + 1)).slice(-2) +
        "-" +
        ("0" + startdateGet.getDate()).slice(-2);
        
      let endDate =
        endDateGet.getFullYear() +
        "-" +
        ("0" + (endDateGet.getMonth() + 1)).slice(-2) +
        "-" +
        ("0" + endDateGet.getDate()).slice(-2);
      
      var startTime = $("#startTime").val() || "";
      var endTime = $("#endTime").val() || "";
      var edthour = $("#txtBookedHoursSpent").val() || "00:00";
      let hours = templateObject.timeToDecimal(edthour) - holdTime;
      templateObject.holdTime.set(0);

      var techNotes = $("#txtNotes").val() || "";
         
      let isPaused = checkStatus;
      let obj = {};
      let data = "";

      if (startTime != "") {
        startTime = date + " " + startTime;
      }

      if (endTime != "") {
        endTime = date + " " + endTime;
      }
      
      if (checkStartTime == "" && startTime == "") {
        
        swal({
          title: "Oooops...",
          text: "You can't save this entry with no start time",
          type: "warning",
          showCancelButton: false,
          confirmButtonText: "Try Again",
        })
        $(".fullScreenSpin").css("display", "none");
      }    
      else {

        LoadingOverlay.show();
        $('.fullScreenSpin').css('display', 'inline-block'); 

        if ($("#startTime").val() != "" && $("#endTime").val() != "") {
          obj = {
            type: "TTimeLog",
            fields: {
              EmployeeID: employeeId,
              StartDatetime: startTime,
              EndDatetime: endTime,
              Product: '',
              Description: "Timesheet Started & Completed",
              EnteredBy: localStorage.getItem("mySessionEmployeeLoggedID"),
            },
          };
          isPaused = "completed";
        } else if ($("#startTime").val() != "" && $("#endTime").val() == "") {
          obj = {
            type: "TTimeLog",
            fields: {
              EmployeeID: employeeId,
              StartDatetime: startTime,
              EndDatetime: endTime,
              Product: '',
              Description: "Timesheet Started",
              EnteredBy: localStorage.getItem("mySessionEmployeeLoggedID"),
            },
          };
          isPaused = "";
        }

        data = {
          type: "TTimeSheetEntry",
          fields: {
            // "EntryDate":"2020-10-12 12:39:14",
            TimeSheet: [
              {
                type: "TTimeSheet",
                fields: {
                  EmployeeName: employeeName || "",
                  ServiceName: "",
                  HourlyRate:  0,
                  LabourCost: 1,
                  Allowedit: true,
                  Logs: obj,
                  TimeSheetDate: date,
                  StartTime: startTime,
                  EndTime: endTime,
                  Hours: hours || 0,
                  // OverheadRate: 90,
                  Job: "",
                  // ServiceName: "Test"|| '',
                  TimeSheetClassName: "Default" || "",
                  Notes: techNotes || "",
                  InvoiceNotes: "Complete",
                  Status: "Unprocessed",
                  // EntryDate: accountdesc|| ''
                },
              },
            ],
            TypeName: "Payroll",
            WhoEntered: localStorage.getItem("mySessionEmployee") || "",
          },
        };

        // addVS1Data("TTimeSheet", JSON.stringify(data));

        //     $("#employeeStatusField").removeClass("statusOnHold");
        //     $("#employeeStatusField").removeClass("statusClockedOff");
        //     $("#employeeStatusField")
        //       .addClass("statusClockedOn")
        //       .text("Clocked On");
            
        //     $("#startTime").prop("disabled", true);
          
        //     swal($("#employee_name").val() + ' Clock On data is saved', '', 'success');
        //     $("#employeeClockonoffModal").modal("hide");
             
        //     $(".fullScreenSpin").css("display", "none");

        contactService
        .saveTimeSheet(data)
        .then(function (dataReturnRes) {
          sideBarService.getAllTimeSheetList().then(function (data) {
          
            addVS1Data("TTimeSheet", JSON.stringify(data));

            $("#employeeStatusField").removeClass("statusOnHold");
            $("#employeeStatusField").removeClass("statusClockedOff");
            $("#employeeStatusField")
              .addClass("statusClockedOn")
              .text("Clocked On");
            
            $("#startTime").prop("disabled", true);
          
            swal($("#employee_name").val() + ' Clock On data is saved', '', 'success');
            $("#employeeClockonoffModal").modal("hide");
             
            $(".fullScreenSpin").css("display", "none");
            FlowRouter.go('/payrolloverview');

          });
        })
        .catch(function (err) {
          swal({
            title: "Oooops...",
            text: err,
            type: "error",
            showCancelButton: false,
            confirmButtonText: "Try Again",
          }).then((result) => {
            if (result.value) {
              // Meteor._reload.reload();
            } else if (result.dismiss == "cancel") {
            }
          });
          $(".fullScreenSpin").css("display", "none");
        });

      }
          
    }, delayTimeAfterSound);

  },

  "click .btnSaveTimeSheet_One": async function () {
    playSaveAudio();
    let templateObject = Template.instance();
    setTimeout(async function(){
      LoadingOverlay.show();

      let showTimesheetStatus = localStorage.getItem("CloudShowTimesheet") || true;
      let checkStatus = "";
      let checkStartTime = "";
      let checkEndTime = "";
      let TimeSheetHours = 0;
      let updateID = $("#updateID").val() || "";

      let clockList = templateObject.timesheetrecords.get();

      let getEmpIDFromLine = $(".employee_name").val() || "";
      if (getEmpIDFromLine != "") {
        let checkEmpTimeSettings =
          (await contactService.getCheckTimeEmployeeSettingByName(
            getEmpIDFromLine
          )) || "";
        if (checkEmpTimeSettings != "") {
          if (checkEmpTimeSettings.temployee[0].CustFld8 == "false") {
            var productcost = parseFloat($("#edtProductCost").val()) || 0;
          } else {
            var productcost = 0;
          }
        }
      } else {
        var productcost = 0;
      }

      clockList = clockList.filter((clkList) => {
        return (
          clkList.employee == $("#employee_name").val() &&
          clkList.id == $("#updateID").val()
        );
      });
      
      if (clockList.length > 0) {
        if (Array.isArray(clockList[clockList.length - 1].timelog)) {
          checkStatus = clockList[clockList.length - 1].isPaused || "";
          TimeSheetHours: clockList[clockList.length - 1].hours || "";
          let latestTimeLogId =
            clockList[clockList.length - 1].timelog[
              clockList[clockList.length - 1].timelog.length - 1
            ].fields.ID || "";
          checkStartTime =
            clockList[clockList.length - 1].timelog[0].fields.StartDatetime || "";
          checkEndTime =
            clockList[clockList.length - 1].timelog[
              clockList[clockList.length - 1].timelog.length - 1
            ].fields.EndDatetime || "";
        } else {
          checkStatus = clockList[clockList.length - 1].isPaused || "";
          TimeSheetHours: clockList[clockList.length - 1].hours || "";
          let latestTimeLogId =
            clockList[clockList.length - 1].timelog.fields.ID || "";
          checkStartTime =
            clockList[clockList.length - 1].timelog.fields.StartDatetime || "";
          checkEndTime =
            clockList[clockList.length - 1].timelog.fields.EndDatetime || "";
        }
      }

      var employeeName = $(".employee_name").val();
      var startdateGet = new Date($("#dtSODate").datepicker("getDate"));
      var endDateGet = new Date();
      let date =
        startdateGet.getFullYear() +
        "-" +
        ("0" + (startdateGet.getMonth() + 1)).slice(-2) +
        "-" +
        ("0" + startdateGet.getDate()).slice(-2);
      let endDate =
        endDateGet.getFullYear() +
        "-" +
        ("0" + (endDateGet.getMonth() + 1)).slice(-2) +
        "-" +
        ("0" + endDateGet.getDate()).slice(-2);
      var startTime = $("#startTime").val() || "";
      var endTime = $("#endTime").val() || "";
      var edthour = $("#txtBookedHoursSpent").val() || "00:01";
      let hours = templateObject.timeToDecimal(edthour);
      var techNotes = $("#txtNotes").val() || "";
      var product = $("#product-list").val() || "";
      var jobName = $("#sltJob").val() || "";
      let isPaused = checkStatus;
      let toUpdate = {};
      let obj = {};
      let data = "";
     
      
      if (startTime != "") {
        startTime = date + " " + startTime;
      }

      if (endTime != "") {
        endTime = endDate + " " + endTime;
      }

      if (hours != 0) {
        edthour = hours + parseFloat($("#txtBookedHoursSpent1").val());
      }

      if (hours != 0) {
        obj = {
          type: "TTimeLog",
          fields: {
            TimeSheetID: updateID,
            EmployeeID: localStorage.getItem("mySessionEmployeeLoggedID"),
            StartDatetime: checkStartTime,
            EndDatetime: endTime,
            Product: product,
            Description: "Timesheet Completed",
            EnteredBy: localStorage.getItem("mySessionEmployeeLoggedID"),
          },
        };
        isPaused = "completed";
      }

      if (checkStartTime == "" && endTime != "") {
        $(".fullScreenSpin").css("display", "none");
        swal({
          title: "Oooops...",
          text: "You can't clock off, because you haven't clocked in",
          type: "warning",
          showCancelButton: false,
          confirmButtonText: "Try Again",
        }).then((result) => {
          if (result.value) {
            // Meteor._reload.reload();
          } else if (result.dismiss == "cancel") {
          }
        });
        return false;
      }

      if (checkStartTime == "" && startTime == "") {
        $(".fullScreenSpin").css("display", "none");
        swal({
          title: "Oooops...",
          text: "You can't save this entry with no start time",
          type: "warning",
          showCancelButton: false,
          confirmButtonText: "Try Again",
        }).then((result) => {
          if (result.value) {
            // Meteor._reload.reload();
          } else if (result.dismiss == "cancel") {
          }
        });
        return false;
      }

      if (updateID != "") {
        result = clockList.filter((Timesheet) => {
          return Timesheet.id == updateID;
        });

        if (result.length > 0) {
          if (result[0].timelog == null) {
            obj = {
              type: "TTimeLog",
              fields: {
                TimeSheetID: updateID,
                EmployeeID: localStorage.getItem("mySessionEmployeeLoggedID"),
                StartDatetime: startTime,
                EndDatetime: endTime,
                Product: product,
                Description: "Timesheet Started",
                EnteredBy: localStorage.getItem("mySessionEmployeeLoggedID"),
              },
            };
          } else if (
            $("#startTime").val() != "" &&
            $("#endTime").val() != "" &&
            checkStatus != "completed"
          ) {
            let startTime1 =
              startdateGet.getFullYear() +
              "-" +
              ("0" + (startdateGet.getMonth() + 1)).slice(-2) +
              "-" +
              ("0" + startdateGet.getDate()).slice(-2) +
              " " +
              ("0" + startdateGet.getHours()).slice(-2) +
              ":" +
              ("0" + startdateGet.getMinutes()).slice(-2);
            obj = {
              type: "TTimeLog",
              fields: {
                TimeSheetID: updateID,
                EmployeeID: localStorage.getItem("mySessionEmployeeLoggedID"),
                StartDatetime: checkStartTime,
                EndDatetime: endTime,
                Product: product,
                Description: "Timesheet Completed",
                EnteredBy: localStorage.getItem("mySessionEmployeeLoggedID"),
              },
            };
            isPaused = "completed";
          } else if (checkEndTime != "") {
            let aEndDate = moment().format("YYYY-MM-DD") + " " + endTime;
          }
        } else {
          obj = {
            type: "TTimeLog",
            fields: {
              TimeSheetID: updateID,
              EmployeeID: localStorage.getItem("mySessionEmployeeLoggedID"),
              StartDatetime: startTime,
              EndDatetime: endTime,
              Product: product,
              Description: "Timesheet Started",
              EnteredBy: localStorage.getItem("mySessionEmployeeLoggedID"),
            },
          };
        }
      }

      if (updateID == "") {
        if ($("#startTime").val() != "" && $("#endTime").val() != "") {
          obj = {
            type: "TTimeLog",
            fields: {
              EmployeeID: localStorage.getItem("mySessionEmployeeLoggedID"),
              StartDatetime: startTime,
              EndDatetime: endTime,
              Product: product,
              Description: "Timesheet Started & Completed",
              EnteredBy: localStorage.getItem("mySessionEmployeeLoggedID"),
            },
          };
          isPaused = "completed";
        } else if ($("#startTime").val() != "" && $("#endTime").val() == "") {
          obj = {
            type: "TTimeLog",
            fields: {
              EmployeeID: localStorage.getItem("mySessionEmployeeLoggedID"),
              StartDatetime: startTime,
              EndDatetime: endTime,
              Product: product,
              Description: "Timesheet Started",
              EnteredBy: localStorage.getItem("mySessionEmployeeLoggedID"),
            },
          };
          isPaused = "";
        }

        data = {
          type: "TTimeSheetEntry",
          fields: {
            // "EntryDate":"2020-10-12 12:39:14",
            TimeSheet: [
              {
                type: "TTimeSheet",
                fields: {
                  EmployeeName: employeeName || "",
                  ServiceName: product || "",
                  HourlyRate: productcost || 0,
                  LabourCost: 1,
                  Allowedit: true,
                  Logs: obj,
                  TimeSheetDate: date,
                  StartTime: startTime,
                  EndTime: endTime,
                  Hours: hours || 0.016666666666666666,
                  // OverheadRate: 90,
                  Job: jobName || "",
                  // ServiceName: "Test"|| '',
                  TimeSheetClassName: "Default" || "",
                  Notes: techNotes || "",
                  InvoiceNotes: "Complete",
                  // EntryDate: accountdesc|| ''
                },
              },
            ],
            TypeName: "Payroll",
            WhoEntered: localStorage.getItem("mySessionEmployee") || "",
          },
        };
        contactService
          .saveTimeSheet(data)
          .then(function (dataReturnRes) {
            $("#updateID").val(dataReturnRes.fields.ID);
            sideBarService.getAllTimeSheetList().then(function (data) {
              addVS1Data("TTimeSheet", JSON.stringify(data));
              $("#employeeStatusField").removeClass("statusOnHold");
              $("#employeeStatusField").removeClass("statusClockedOff");
              $("#employeeStatusField")
                .addClass("statusClockedOn")
                .text("Clocked On");
              $("#startTime").prop("disabled", true);
              templateObject.timesheetrecords.set([]);
              templateObject.getAllTimeSheetDataClock();
              $("#employeeClockonoffModal").modal("hide");
              // setTimeout(function(){
              //    let getTimesheetRecords = templateObject.timesheetrecords.get();
              //     let getLatestTimesheet = getTimesheetRecords.filter(clkList => {
              //        return clkList.employee == employeeName;
              //    });
              //     $('#updateID').val(getLatestTimesheet[getLatestTimesheet.length - 1].id || '');
              $(".fullScreenSpin").css("display", "none");
              // },1500);
            });
          })
          .catch(function (err) {
            swal({
              title: "Oooops...",
              text: err,
              type: "error",
              showCancelButton: false,
              confirmButtonText: "Try Again",
            }).then((result) => {
              if (result.value) {
                // Meteor._reload.reload();
              } else if (result.dismiss == "cancel") {
              }
            });
            $(".fullScreenSpin").css("display", "none");
          });
      } else {
        data = {
          type: "TTimeSheet",
          fields: {
            ID: updateID,
            EmployeeName: employeeName || "",
            ServiceName: product || "",
            HourlyRate: productcost || 0,
            LabourCost: 1,
            Allowedit: true,
            Hours: hours || 0.016666666666666666,
            TimeSheetDate: date,
            StartTime: startTime,
            EndTime: endTime,
            // OverheadRate: 90,
            Job: jobName || "",
            // ServiceName: "Test"|| '',
            TimeSheetClassName: "Default" || "",
            Notes: techNotes || "",
            InvoiceNotes: isPaused,
            // EntryDate: accountdesc|| ''
          },
        };

        contactService
          .saveClockTimeSheet(data)
          .then(function (data) {
            if (Object.keys(obj).length > 0) {
              if (obj.fields.Description == "Timesheet Completed") {
                let endTime1 = endTime;
                if (Array.isArray(clockList[clockList.length - 1].timelog)) {
                  toUpdateID =
                    clockList[clockList.length - 1].timelog[
                      clockList[clockList.length - 1].timelog.length - 1
                    ].fields.ID;
                } else {
                  toUpdateID = clockList[clockList.length - 1].timelog.fields.ID;
                }

                if (toUpdateID != "") {
                  updateData = {
                    type: "TTimeLog",
                    fields: {
                      ID: toUpdateID,
                      EndDatetime: endTime1,
                    },
                  };
                }
              contactService
                .saveTimeSheetLog(obj)
                .then(function (data) {
                  contactService
                    .saveTimeSheetLog(updateData)
                    .then(function (data) {
                      sideBarService
                        .getAllTimeSheetList()
                        .then(function (data) {
                          addVS1Data("TTimeSheet", JSON.stringify(data));
                          if (showTimesheetStatus == true) {
                            setTimeout(function () {
                              templateObject.checkAccessSaveRedirect();
                            }, 500);
                          } else {
                            setTimeout(function () {
                              window.open("/dashboard", "_self");
                            }, 500);
                          }
                        });
                    })
                    .catch(function (err) {});
                })
                .catch(function (err) {});
              } else if (obj.fields.Description == "Timesheet Started") {
                contactService
                  .saveTimeSheetLog(obj)
                  .then(function (data) {
                    sideBarService.getAllTimeSheetList().then(function (data) {
                      addVS1Data("TTimeSheet", JSON.stringify(data));
                      setTimeout(function () {
                        if (showTimesheetStatus == true) {
                          setTimeout(function () {
                            templateObject.checkAccessSaveRedirect();
                          }, 500);
                        } else {
                          setTimeout(function () {
                            window.open("/dashboard", "_self");
                          }, 500);
                        }
                      }, 500);
                    });
                  })
                  .catch(function (err) {});
              }
            } else {
              sideBarService.getAllTimeSheetList().then(function (data) {
                addVS1Data("TTimeSheet", JSON.stringify(data));
                if (showTimesheetStatus == true) {
                  setTimeout(function () {
                    templateObject.checkAccessSaveRedirect();
                  }, 500);
                } else {
                  setTimeout(function () {
                    window.open("/dashboard", "_self");
                  }, 500);
                }
              });
            }
          })
          .catch(function (err) {
            swal({
              title: "Oooops...",
              text: err,
              type: "error",
              showCancelButton: false,
              confirmButtonText: "Try Again",
            }).then((result) => {
              if (result.value) {
                // Meteor._reload.reload();
              } else if (result.dismiss == "cancel") {
              }
            });
            $(".fullScreenSpin").css("display", "none");
          });
      }
  }, delayTimeAfterSound);
  },

  "click .btnDesktopSearch": function (e) {
    const templateObject = Template.instance();
    let barcodeData = $("#barcodeScanInput").val();
    let empNo = barcodeData.replace(/^\D+/g, "");
    LoadingOverlay.show();
    if (barcodeData == "") {
      swal("Please enter the employee number", "", "warning");
      $(".fullScreenSpin").css("display", "none");
      e.preventDefault();
      return false;
    } else {
      contactService
        .getOneEmployeeDataEx(empNo)
        .then(function (data) {
          $(".fullScreenSpin").css("display", "none");
         
          if (Object.keys(data).length > 0) {
            $("#employee_name").val(data.fields.EmployeeName || "");
            $("#employee_id").val(data.fields.ID || "");
            $("#barcodeScanInput").val("");
            
            $("#edtProductCost").val(0);
            $("#updateID").val("");
            $("#startTime").val("");
            $("#endTime").val("");
            $("#txtBookedHoursSpent").val("");
            $("#startTime").prop("disabled", false);
            $("#endTime").prop("disabled", false);
            $("#btnClockOn").prop("disabled", false);
            $("#btnHold").prop("disabled", false);
            $("#btnClockOff").prop("disabled", false);
            

            
          } else {
            swal("Employee Not Found", "", "warning");
          }
        })
        .catch(function (err) {
          swal({
            title: "Oooops...",
            text: "Employee Not Found",
            type: "error",
            showCancelButton: false,
            confirmButtonText: "Try Again",
          }).then((result) => {
            if (result.value) {
              // Meteor._reload.reload();
            } else if (result.dismiss == "cancel") {
            }
          });
          $(".fullScreenSpin").css("display", "none");
        });
    }
  },

  "click #btnProcessClockOnOff": function () {
    playSaveAudio();

    let templateObject = Template.instance();
    
    setTimeout(async function(){      
    //  LoadingOverlay.show();
      let checkStatus = "";
      let checkStartTime = "";     
     
      var employeeName = $("#employee_name").val();      
      var employeeId = $("#employee_id").val(); 
     
      // Employee Clock On to Clock Off
      let clockonstatusList = await templateObject.getClockOnStatus();
      let currentClockOnStatus;
      let clockonindex = clockonstatusList.findIndex(order => {
          return order.fields.EmployeeName == employeeName;
      })

      if(clockonindex > -1) {
          currentClockOnStatus = clockonstatusList[clockonindex];        
          let tempClockOnStatus = cloneDeep(currentClockOnStatus);
          tempClockOnStatus.fields = {...tempClockOnStatus.fields, Status:"Clock Off" }
          clockonstatusList.splice(clockonindex, 1, tempClockOnStatus);
          addVS1Data('TClockOnStatus', JSON.stringify(clockonstatusList)).then(function(){

          })
      }
       // Employee Clock On to Clock Off End


      var startdateGet = new Date();
      var endDateGet = new Date();
      let date =
        startdateGet.getFullYear() +
        "-" +
        ("0" + (startdateGet.getMonth() + 1)).slice(-2) +
        "-" +
        ("0" + startdateGet.getDate()).slice(-2);
        
      let endDate =
        endDateGet.getFullYear() +
        "-" +
        ("0" + (endDateGet.getMonth() + 1)).slice(-2) +
        "-" +
        ("0" + endDateGet.getDate()).slice(-2);
      
      var startTime = $("#startTime").val() || "";
      var endTime = $("#endTime").val() || "";
      var edthour = $("#txtBookedHoursSpent").val() || "00:00";
      let hours = templateObject.timeToDecimal(edthour);
      var techNotes = $("#txtNotes").val() || "";
         
      let isPaused = checkStatus;
      let obj = {};
      let data = "";

      if (startTime != "") {
        startTime = date + " " + startTime;
      }

      if (endTime != "") {
        endTime = date + " " + endTime;
      }
      
      if (checkStartTime == "" && startTime == "") {
        
        swal({
          title: "Oooops...",
          text: "You can't save this entry with no start time",
          type: "warning",
          showCancelButton: false,
          confirmButtonText: "Try Again",
        })
        $(".fullScreenSpin").css("display", "none");
      }    
      else {

        LoadingOverlay.show();
        $('.fullScreenSpin').css('display', 'inline-block'); 

        if ($("#startTime").val() != "" && $("#endTime").val() != "") {
          obj = {
            type: "TTimeLog",
            fields: {
              EmployeeID: employeeId,
              StartDatetime: startTime,
              EndDatetime: endTime,
              Product: '',
              Description: "Timesheet Started & Completed",
              EnteredBy: localStorage.getItem("mySessionEmployeeLoggedID"),
            },
          };
          isPaused = "completed";
        } else if ($("#startTime").val() != "" && $("#endTime").val() == "") {
          obj = {
            type: "TTimeLog",
            fields: {
              EmployeeID: employeeId,
              StartDatetime: startTime,
              EndDatetime: endTime,
              Product: '',
              Description: "Timesheet Started",
              EnteredBy: localStorage.getItem("mySessionEmployeeLoggedID"),
            },
          };
          isPaused = "";
        }
        data = {
          type: "TTimeSheetEntry",
          fields: {
            // "EntryDate":"2020-10-12 12:39:14",
            TimeSheet: [
              {
                type: "TTimeSheet",
                fields: {
                  EmployeeName: employeeName || "",
                  ServiceName: "",
                  HourlyRate:  0,
                  LabourCost: 1,
                  Allowedit: true,
                  Logs: obj,
                  TimeSheetDate: date,
                  StartTime: startTime,
                  EndTime: endTime,
                  Hours: hours || 0,
                  // OverheadRate: 90,
                  Job: "",
                  // ServiceName: "Test"|| '',
                  TimeSheetClassName: "Default" || "",
                  Notes: techNotes || "",
                  InvoiceNotes: isPaused,
                  Status: "Processed",
                  // EntryDate: accountdesc|| ''
                },
              },
            ],
            TypeName: "Payroll",
            WhoEntered: localStorage.getItem("mySessionEmployee") || "",
          },
        };
      

        contactService
        .saveTimeSheet(data)
        .then(function (dataReturnRes) {

          sideBarService.getAllTimeSheetList().then(function (data) {
            // Bert.alert(
            //   $("#employee_name").val() + " you are now Clocked On",
            //   "now-success"
            // );
           
            addVS1Data("TTimeSheet", JSON.stringify(data));
                    
            $("#startTime").prop("disabled", true);
          
            swal($("#employee_name").val() + ' Clock On data is processed', '', 'success');
            $("#employeeClockonoffModal").modal("hide");             
            $(".fullScreenSpin").css("display", "none");
            FlowRouter.go('/payrolloverview');
          });
        })
        .catch(function (err) {
          swal({
            title: "Oooops...",
            text: err,
            type: "error",
            showCancelButton: false,
            confirmButtonText: "Try Again",
          }).then((result) => {
            if (result.value) {
              // Meteor._reload.reload();
            } else if (result.dismiss == "cancel") {
            }
          });
          $(".fullScreenSpin").css("display", "none");
        });

      }
          
    }, delayTimeAfterSound);

  },

  "click .btnHoldSave" : async function() {
    let templateObject = Template.instance();  
    let break_start_time = templateObject.breakStartTime.get();

    let employee_name = $("#employee_name").val();
    let employee_id = $("#employee_id").val();
    
    let clockon_time = templateObject.clockonToHoldTime.get(); //Clock on till OnHold;
    let date1 = moment().format('YYYY-MM-DD');
    let clockon_start_time =  new Date(date1 + ' ' + document.getElementById("startTime").value + ':00');
    clockon_time = clockon_time +  templateObject.diff_hours(break_start_time,clockon_start_time); // Clock on To Hold on Time
    let pause_reason;    

    if ($('#break').is(":checked")) {
      pause_reason = $('#break').val();
    } else if ($('#lunch').is(":checked")) {
      pause_reason = $('#lunch').val();
    } else if ($('#personal').is(":checked")) {
      pause_reason = $('#personal').val();
    } 
    
 
    templateObject.clockonToHoldTime.set(clockon_time); 


    let clockonstatusList = [];
        clockonstatusList = await templateObject.getClockOnStatus();

    let on_hold_data = {
      type : "TClockOnStatus",
      fields: {
        EmployeeName: employee_name || '',
        EmployeeId: employee_id || '',
        Status: "Paused",
        StartTime:break_start_time,
        PausedTime : clockon_time,
      }
    };

    clockonstatusList.push(on_hold_data);
      addVS1Data('TClockOnStatus', JSON.stringify(clockonstatusList)).then(function() {
    }); 
       
    swal('The Job is Now On Hold for '+ pause_reason , '', 'success');
    
    $("#btnClockOff").prop("disabled", true);
    $("#btnClockOn").removeAttr("disabled");
    $("#btnHoldOne").prop("disabled", true);
   
  
    $("#frmOnHoldModal").modal("hide");
  },

  'change #break': function(event) {
      $('#lunch').prop('checked', false);
      $('#personal').prop('checked', false);
  },

  'change #lunch': function(event) {
    $('#break').prop('checked', false);
    $('#personal').prop('checked', false);
  },

  'change #personal': function(event) {
    $('#break').prop('checked', false);
    $('#lunch').prop('checked', false);
  },

 
});

Template.clockOnOff.helpers({
  jobsrecords: () => {
    return Template.instance().jobsrecords.get().sort(function (a, b) {
      if (a.jobname == 'NA') {
        return 1;
      }
      else if (b.jobname == 'NA') {
        return -1;
      }
      return (a.jobname.toUpperCase() > b.jobname.toUpperCase()) ? 1 : -1;
    });
  },
  employeerecords: () => {
    return Template.instance().employeerecords.get().sort(function (a, b) {
      if (a.employeename == 'NA') {
        return 1;
      }
      else if (b.employeename == 'NA') {
        return -1;
      }
      return (a.employeename.toUpperCase() > b.employeename.toUpperCase()) ? 1 : -1;
    });
  },
  datatablerecords: () => {
    return Template.instance().datatablerecords.get().sort(function (a, b) {
      if (a.timesheetdate == 'NA') {
        return 1;
      }
      else if (b.timesheetdate == 'NA') {
        return -1;
      }
      return (a.timesheetdate.toUpperCase() > b.timesheetdate.toUpperCase()) ? 1 : -1;
    });
  },
  tableheaderrecords: () => {
    return Template.instance().tableheaderrecords.get();
  },
  loggedCompany: () => {
    return localStorage.getItem('mySession') || '';
  }
});
