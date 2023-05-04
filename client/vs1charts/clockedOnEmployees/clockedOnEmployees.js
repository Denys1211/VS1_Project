import { ReactiveVar } from "meteor/reactive-var";
import { SideBarService } from "../../js/sidebar-service";
import { UtilityService } from "../../utility-service";

import { Template } from 'meteor/templating';
import './clockedOnEmployees.html';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

let sideBarService = new SideBarService();
let utilityService = new UtilityService();
let _ = require("lodash");

Template.clockedOnEmployees.onCreated(function () {
  let templateObject = Template.instance();
  templateObject.clockedOnEmpData = new ReactiveVar([]);

});

Template.clockedOnEmployees.onRendered(function () {
  const templateObject = Template.instance();

  templateObject.getAllTimeSheetDataClock = function () {
    getVS1Data("TTimeSheet")
      .then(function (dataObject) {
        if (dataObject == 0) {
          sideBarService
            .getAllTimeSheetList()
            .then(function (data) {
              /* Update Clocked On Employees */
              let clockedOnEmpList = []
              let dataListClockedOnEmployeeObj = {};
              for (let t = 0; t < data.ttimesheet.length; t++) {
                if (data.ttimesheet[t].fields.Logs != null) {
                  if ( data.ttimesheet[t].fields.InvoiceNotes == "Clocked On" || data.ttimesheet[t].fields.InvoiceNotes == "paused") {
                    let duplicateCheck = false;
                    for(let j = 0; j < clockedOnEmpList.length; j++) {
                      if(clockedOnEmpList[j].employeename == data.ttimesheet[t].fields.EmployeeName ) {
                        duplicateCheck = true;
                      }
                    }
                    if(!duplicateCheck) {
                      dataListClockedOnEmployeeObj = {
                        employeename: data.ttimesheet[t].fields.EmployeeName || "",
                      };
                      clockedOnEmpList.push(dataListClockedOnEmployeeObj);
    
                    }                 
                  }
                }
              }
              templateObject.clockedOnEmpData.set(clockedOnEmpList);
              // $(".fullScreenSpin").css("display", "none");
            })
            .catch(function (err) {
              // Bert.alert('<strong>' + err + '</strong>!', 'danger');
              $(".fullScreenSpin").css("display", "none");
              // Meteor._reload.reload();
            });
        } else {
          let clockedOnEmpList = []
          let data = JSON.parse(dataObject[0].data);
          /* Update Clocked On Employees */
          let dataListClockedOnEmployeeObj = {};
          for (let t = 0; t < data.ttimesheet.length; t++) {
            if (data.ttimesheet[t].fields.Logs != null) {
              if ( data.ttimesheet[t].fields.InvoiceNotes == "Clocked On" || data.ttimesheet[t].fields.InvoiceNotes == "paused") {
                let duplicateCheck = false;
                for(let j = 0; j < clockedOnEmpList.length; j++) {
                  if(clockedOnEmpList[j].employeename == data.ttimesheet[t].fields.EmployeeName ) {
                    duplicateCheck = true;
                  }
                }
                if(!duplicateCheck) {
                  dataListClockedOnEmployeeObj = {
                    employeename: data.ttimesheet[t].fields.EmployeeName || "",
                  };
                  clockedOnEmpList.push(dataListClockedOnEmployeeObj);

                }                 
              }
            }
          }
          
          templateObject.clockedOnEmpData.set(clockedOnEmpList);
        }
      })
      .catch(function (err) {
        sideBarService
          .getAllTimeSheetList()
          .then(function (data) {
            /* Update Clocked On Employees */
            let clockedOnEmpList = []
            let dataListClockedOnEmployeeObj = {};
            for (let t = 0; t < data.ttimesheet.length; t++) {
              if (data.ttimesheet[t].fields.Logs != null) {
                if ( data.ttimesheet[t].fields.InvoiceNotes == "Clocked On" || data.ttimesheet[t].fields.InvoiceNotes == "paused") {
                let duplicateCheck = false;
                for(let j = 0; j < clockedOnEmpList.length; j++) {
                  if(clockedOnEmpList[j].employeename == data.ttimesheet[t].fields.EmployeeName ) {
                    duplicateCheck = true;
                  }
                }
                if(!duplicateCheck) {
                  dataListClockedOnEmployeeObj = {
                    employeename: data.ttimesheet[t].fields.EmployeeName || "",
                  };
                  clockedOnEmpList.push(dataListClockedOnEmployeeObj);

                }                 
              }
              }
            }
            templateObject.clockedOnEmpData.set(clockedOnEmpList); 
          })
          .catch(function (err) {
            $(".fullScreenSpin").css("display", "none"); 
          });
      });
  };

//  templateObject.getAllTimeSheetDataClock();

  templateObject.getClockOnEmployee = function () {
    getVS1Data("TClockOnStatus")
      .then(function (dataObject) {
        if (dataObject == 0) {
          // sideBarService
          //   .getAllTimeSheetList()
          //   .then(function (data) {
          //     /* Update Clocked On Employees */
          //     let clockedOnEmpList = []
          //     let dataListClockedOnEmployeeObj = {};
          //     for (let t = 0; t < data.ttimesheet.length; t++) {
          //       if (data.ttimesheet[t].fields.Logs != null) {
          //         if ( data.ttimesheet[t].fields.InvoiceNotes == "Clocked On" || data.ttimesheet[t].fields.InvoiceNotes == "paused") {
          //           let duplicateCheck = false;
          //           for(let j = 0; j < clockedOnEmpList.length; j++) {
          //             if(clockedOnEmpList[j].employeename == data.ttimesheet[t].fields.EmployeeName ) {
          //               duplicateCheck = true;
          //             }
          //           }
          //           if(!duplicateCheck) {
          //             dataListClockedOnEmployeeObj = {
          //               employeename: data.ttimesheet[t].fields.EmployeeName || "",
          //             };
          //             clockedOnEmpList.push(dataListClockedOnEmployeeObj);
    
          //           }                 
          //         }
          //       }
          //     }
          //     templateObject.clockedOnEmpData.set(clockedOnEmpList);
          //     // $(".fullScreenSpin").css("display", "none");
          //   })
          //   .catch(function (err) {
          //     // Bert.alert('<strong>' + err + '</strong>!', 'danger');
          //     $(".fullScreenSpin").css("display", "none");
          //     // Meteor._reload.reload();
          //   });
        } else {
          let clockedOnEmpList = []
          let data = JSON.parse(dataObject[0].data);

          /* Update Clocked On Employees */
          let dataListClockedOnEmployeeObj = {};
          for (let t = 0; t < data.length; t++) {
          
              if ( data[t].fields.Status == "Clock On") {
               
                  dataListClockedOnEmployeeObj = {
                    employeename: data[t].fields.EmployeeName || "",
                  };
                  clockedOnEmpList.push(dataListClockedOnEmployeeObj);
                  
                }                 
             
            }          
          
          templateObject.clockedOnEmpData.set(clockedOnEmpList);
        }
      })
      .catch(function (err) {
        // sideBarService
        //   .getAllTimeSheetList()
        //   .then(function (data) {
        //     /* Update Clocked On Employees */
        //     let clockedOnEmpList = []
        //     let dataListClockedOnEmployeeObj = {};
        //     for (let t = 0; t < data.ttimesheet.length; t++) {
        //       if (data.ttimesheet[t].fields.Logs != null) {
        //         if ( data.ttimesheet[t].fields.InvoiceNotes == "Clocked On" || data.ttimesheet[t].fields.InvoiceNotes == "paused") {
        //         let duplicateCheck = false;
        //         for(let j = 0; j < clockedOnEmpList.length; j++) {
        //           if(clockedOnEmpList[j].employeename == data.ttimesheet[t].fields.EmployeeName ) {
        //             duplicateCheck = true;
        //           }
        //         }
        //         if(!duplicateCheck) {
        //           dataListClockedOnEmployeeObj = {
        //             employeename: data.ttimesheet[t].fields.EmployeeName || "",
        //           };
        //           clockedOnEmpList.push(dataListClockedOnEmployeeObj);

        //         }                 
        //       }
        //       }
        //     }
        //     templateObject.clockedOnEmpData.set(clockedOnEmpList); 
        //   })
        //   .catch(function (err) {
        //     $(".fullScreenSpin").css("display", "none"); 
        //   });
      });
  };

  templateObject.getClockOnEmployee();
});


Template.clockedOnEmployees.helpers({
    includePayrollClockOnOffOnly: () => {
      return Template.instance().includePayrollClockOnOffOnly.get();
    },
    clockedOnEmpData: () => {
      return Template.instance()
        .clockedOnEmpData.get()
        .sort(function (a, b) {
          if (a.employeename == "NA") {
            return 1;
          } else if (b.employeename == "NA") {
            return -1;
          }
          return a.employeename.toUpperCase() > b.employeename.toUpperCase()
            ? 1
            : -1;
        });
    },
    edithours: () => {
      return localStorage.getItem("CloudEditTimesheetHours") || false;
    },
    clockOnOff: () => {
      return localStorage.getItem("CloudClockOnOff") || false;
    },
    launchClockOnOff: () => {
      return localStorage.getItem("launchClockOnOff") || false;
    },
    timesheetStartStop: () => {
      return localStorage.getItem("timesheetStartStop ") || false;
    },
    showTimesheet: () => {
      return localStorage.getItem("CloudShowTimesheet") || false;
    },
    tableheaderrecords: () => {
      return Template.instance().tableheaderrecords.get();
    },
    salesCloudPreferenceRec: () => {
      return CloudPreference.findOne({
        userid: localStorage.getItem("mycloudLogonID"),
        PrefName: "tblPayHistorylist",
      });
    },
    loggedCompany: () => {
      return localStorage.getItem("mySession") || "";
    },
  });
  