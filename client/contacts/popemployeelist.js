import {ContactService} from "./contact-service";
import { ReactiveVar } from 'meteor/reactive-var';
import { CoreService } from '../js/core-service';
import {UtilityService} from "../utility-service";
import XLSX from 'xlsx';
import { SideBarService } from '../js/sidebar-service';
import '../lib/global/indexdbstorage.js';

import { Template } from 'meteor/templating';
import './popemployeelist.html';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

let sideBarService = new SideBarService();
let utilityService = new UtilityService();
let contactService = new ContactService();
Template.popemployeelist.onCreated(function(){
  const templateObject = Template.instance();
  templateObject.datatablerecords = new ReactiveVar([]);
  templateObject.tableheaderrecords = new ReactiveVar([]);

  templateObject.selectedFile = new ReactiveVar();

    templateObject.getDataTableList = function(data) {
        let mobile = contactService.changeMobileFormat(data.Mobile);
        var dataList = [
            //id: data.Id || '',
            //employeeno: data.EmployeeNo || '',
            data.EmployeeName || '',
            data.FirstName || '',
            data.LastName || '',
            data.Phone || '',
            mobile || '',
            data.Email || '',
            data.DefaultClassName || '',
            data.Country || '',
            data.CustFld1 || '',
            data.CustFld2 || '',
            data.Street || '',
            data.EmployeeID || '',
            data.Active ? "" : "In-Active",
            //custFld3: data.CustFld3 || '',
            //custFld4: data.CustFld4 || ''
        ];
        return dataList;
    }

    let headerStructure = [
        { index: 0, label: 'Employee Name', class: 'colEmployeeName', active: true, display: true, width: "80" },
        { index: 1, label: 'First Name', class: 'colFirstName', active: true, display: true, width: "50" },
        { index: 2, label: 'Last Name', class: 'colLastName', active: true, display: true, width: "100" },
        { index: 3, label: 'Phone', class: 'colPhone', active: true, display: true, width: "100" },
        { index: 4, label: 'Mobile', class: 'colMobile', active: true, display: true, width: "100" },
        { index: 5, label: 'Email', class: 'colEmail', active: true, display: true, width: "100" },
        { index: 6, label: 'Department', class: 'colDepartment', active: true, display: true, width: "100" },
        { index: 7, label: 'Country', class: 'colCountry', active: true, display: true, width: "100" },
        { index: 8, label: 'Custom Field 1', class: 'colCustFld1', active: false, display: true, width: "80" },
        { index: 9, label: 'Custom Field 2', class: 'colCustFld2', active: false, display: true, width: "80" },
        { index: 10, label: 'Address', class: 'colAddress', active: true, display: true, width: "100" },
        { index: 11, label: 'ID', class: 'colID', active: false, display: false, width: "30" },
        { index: 12, label: 'Status', class: 'colStatus', active: true, display: true, width: "60" },
    ];
    templateObject.tableheaderrecords.set(headerStructure);
});

Template.popemployeelist.onRendered(function() {
    // $('.fullScreenSpin').css('display','inline-block');
    let templateObject = Template.instance();
    let contactService = new ContactService();
    const customerList = [];
    let salesOrderTable;
    var splashArray = new Array();
    const dataTableList = [];
    const tableHeaderList = [];

    // Meteor.call('readPrefMethod',localStorage.getItem('mycloudLogonID'),'tblEmployeelistpop', function(error, result){
    // if(error){
    //
    // }else{
    //   if(result){
    //     for (let i = 0; i < result.customFields.length; i++) {
    //       let customcolumn = result.customFields;
    //       let columData = customcolumn[i].label;
    //       let columHeaderUpdate = customcolumn[i].thclass.replace(/ /g, ".");
    //       let hiddenColumn = customcolumn[i].hidden;
    //       let columnClass = columHeaderUpdate.split('.')[1];
    //       let columnWidth = customcolumn[i].width;
    //       // let columnindex = customcolumn[i].index + 1;
    //        $("th."+columnClass+"").html(columData);
    //         $("th."+columnClass+"").css('width',""+columnWidth+"px");
    //
    //     }
    //   }
    //
    // }
    // });

    templateObject.getEmployees = function () {
      getVS1Data('TEmployee').then(function (dataObject) {

        if(dataObject.length == 0){
          contactService.getAllEmployeesData().then(function (data) {
            let lineItems = [];
            let lineItemObj = {};
            for(let i=0; i<data.temployee.length; i++){
              let mobile = contactService.changeMobileFormat(data.temployee[i].Mobile);
                 var dataList = {
                   id: data.temployee[i].Id || '',
                   employeeno: data.temployee[i].EmployeeNo || '',
                   employeename:data.temployee[i].EmployeeName || '',
                   firstname: data.temployee[i].FirstName || '',
                   lastname: data.temployee[i].LastName || '',
                   phone: data.temployee[i].Phone || '',
                   mobile: mobile || '',
                   email: data.temployee[i].Email || '',
                   address: data.temployee[i].Street || '',
                   country: data.temployee[i].Country || '',
                   department: data.temployee[i].DefaultClassName || '',
                   custFld1: data.temployee[i].CustFld1 || '',
                   custFld2: data.temployee[i].CustFld2 || '',
                   custFld3: data.temployee[i].CustFld3 || '',
                   custFld4: data.temployee[i].CustFld4 || ''
               };

               if(data.temployee[i].EmployeeName.replace(/\s/g, '') != ''){
                dataTableList.push(dataList);
              }
                //}
            }

            templateObject.datatablerecords.set(dataTableList);

            if(templateObject.datatablerecords.get()){

              Meteor.call('readPrefMethod',localStorage.getItem('mycloudLogonID'),'tblEmployeelistpop', function(error, result){
              if(error){

              }else{
                if(result){
                  for (let i = 0; i < result.customFields.length; i++) {
                    let customcolumn = result.customFields;
                    let columData = customcolumn[i].label;
                    let columHeaderUpdate = customcolumn[i].thclass.replace(/ /g, ".");
                    let hiddenColumn = customcolumn[i].hidden;
                    let columnClass = columHeaderUpdate.split('.')[1];
                    let columnWidth = customcolumn[i].width;
                    let columnindex = customcolumn[i].index + 1;

                    if(hiddenColumn == true){

                      $("."+columnClass+"").addClass('hiddenColumn');
                      $("."+columnClass+"").removeClass('showColumn');
                    }else if(hiddenColumn == false){
                      $("."+columnClass+"").removeClass('hiddenColumn');
                      $("."+columnClass+"").addClass('showColumn');
                    }

                  }
                }

              }
              });
            }


            setTimeout(function () {
                $('#tblEmployeelistpop').DataTable({

                  "sDom": "<'row'><'row'<'col-sm-12 col-md-6'f><'col-sm-12 col-md-6'l>r>t<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>B",
                  buttons: [
                        {
                     extend: 'csvHtml5',
                     text: '',
                     download: 'open',
                     className: "btntabletocsv hiddenColumn",
                     filename: "employeelist_"+ moment().format(),
                     orientation:'portrait',
                      exportOptions: {
                      columns: ':visible'
                    }
                  },{
                      extend: 'print',
                      download: 'open',
                      className: "btntabletopdf hiddenColumn",
                      text: '',
                      title: 'Employee List',
                      filename: "employeelist_"+ moment().format(),
                      exportOptions: {
                      columns: ':visible'
                    }
                  },
                  {
                   extend: 'excelHtml5',
                   title: '',
                   download: 'open',
                   className: "btntabletoexcel hiddenColumn",
                   filename: "employeelist_"+ moment().format(),
                   orientation:'portrait',
                    exportOptions: {
                    columns: ':visible'
                  }

                  }],
                      select: true,
                      destroy: true,
                      colReorder: true,
                      // bStateSave: true,
                      // rowId: 0,
                      pageLength: initialDatatableLoad,
                      lengthMenu: [ [initialDatatableLoad, -1], [initialDatatableLoad, "All"] ],
                      info: true,
                      responsive: true,
                      "order": [[ 0, "asc" ]],
                      action: function () {
                          $('#tblEmployeelistpop').DataTable().ajax.reload();
                      },
                      language: { search: "",searchPlaceholder: "Search List..." },
                  }).on('page', function () {

                      let draftRecord = templateObject.datatablerecords.get();
                      templateObject.datatablerecords.set(draftRecord);
                  }).on('column-reorder', function () {

                  });

                  // $('#tblEmployeelistpop').DataTable().column( 0 ).visible( true );
                  //$('.fullScreenSpin').css('display','none');
              }, 0);

              var columns = $('#tblEmployeelistpop th');
              let sTible = "";
              let sWidth = "";
              let sIndex = "";
              let sVisible = "";
              let columVisible = false;
              let sClass = "";
              $.each(columns, function(i,v) {
                if(v.hidden == false){
                  columVisible =  true;
                }
                if((v.className.includes("hiddenColumn"))){
                  columVisible = false;
                }
                sWidth = v.style.width.replace('px', "");
                let datatablerecordObj = {
                  sTitle: v.innerText || '',
                  sWidth: sWidth || '',
                  sIndex: v.cellIndex || 0,
                  sVisible: columVisible || false,
                  sClass: v.className || ''
                };
                tableHeaderList.push(datatablerecordObj);
              });
            templateObject.tableheaderrecords.set(tableHeaderList);
             $('div.dataTables_filter input').addClass('form-control form-control-sm');
             $('#tblEmployeelistpop tbody').on( 'click', 'tr', function () {
             var listData = $(this).closest('tr').attr('id');
             if(listData){
               FlowRouter.go('/employeescard?id=' + listData+'&addvs1user=true');
             }
           });

          }).catch(function (err) {
              // Bert.alert('<strong>' + err + '</strong>!', 'danger');
              //$('.fullScreenSpin').css('display','none');
              // Meteor._reload.reload();
          });
        }else{
          let data = JSON.parse(dataObject[0].data);
          let useData = data.temployee;
          let lineItems = [];
          let lineItemObj = {};
          for(let i=0; i<useData.length; i++){
            let mobile = contactService.changeMobileFormat(useData[i].fields.Mobile);
            var dataList = {
              id: useData[i].fields.ID || '',
              employeeno: useData[i].fields.EmployeeNo || '',
              employeename:useData[i].fields.EmployeeName || '',
              firstname: useData[i].fields.FirstName || '',
              lastname: useData[i].fields.LastName || '',
              phone: useData[i].fields.Phone || '',
              mobile: mobile || '',
              email: useData[i].fields.Email || '',
              address: useData[i].fields.Street || '',
              country: useData[i].fields.Country || '',
              department: useData[i].fields.DefaultClassName || '',
              custFld1: useData[i].fields.CustFld1 || '',
              custFld2: useData[i].fields.CustFld2 || '',
              custFld3: useData[i].fields.CustFld3 || '',
              custFld4: useData[i].fields.CustFld4 || ''
            };

            if(useData[i].fields.EmployeeName.replace(/\s/g, '') != ''){
              dataTableList.push(dataList);
            }
        //}
          }

          templateObject.datatablerecords.set(dataTableList);

          if(templateObject.datatablerecords.get()){

              Meteor.call('readPrefMethod',localStorage.getItem('mycloudLogonID'),'tblEmployeelistpop', function(error, result){
  if(error){

  }else{
    if(result){
      for (let i = 0; i < result.customFields.length; i++) {
        let customcolumn = result.customFields;
        let columData = customcolumn[i].label;
        let columHeaderUpdate = customcolumn[i].thclass.replace(/ /g, ".");
        let hiddenColumn = customcolumn[i].hidden;
        let columnClass = columHeaderUpdate.split('.')[1];
        let columnWidth = customcolumn[i].width;
        let columnindex = customcolumn[i].index + 1;

        if(hiddenColumn == true){

          $("."+columnClass+"").addClass('hiddenColumn');
          $("."+columnClass+"").removeClass('showColumn');
        }else if(hiddenColumn == false){
          $("."+columnClass+"").removeClass('hiddenColumn');
          $("."+columnClass+"").addClass('showColumn');
        }

      }
    }

  }
  });
  }


  setTimeout(function () {
    $('#tblEmployeelistpop').DataTable({

      "sDom": "<'row'><'row'<'col-sm-12 col-md-6'f><'col-sm-12 col-md-6'l>r>t<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>B",
      buttons: [
            {
         extend: 'csvHtml5',
         text: '',
         download: 'open',
         className: "btntabletocsv hiddenColumn",
         filename: "employeelist_"+ moment().format(),
         orientation:'portrait',
          exportOptions: {
          columns: ':visible'
        }
      },{
          extend: 'print',
          download: 'open',
          className: "btntabletopdf hiddenColumn",
          text: '',
          title: 'Employee List',
          filename: "employeelist_"+ moment().format(),
          exportOptions: {
          columns: ':visible'
        }
      },
      {
       extend: 'excelHtml5',
       title: '',
       download: 'open',
       className: "btntabletoexcel hiddenColumn",
       filename: "employeelist_"+ moment().format(),
       orientation:'portrait',
        exportOptions: {
        columns: ':visible'
      }

      }],
          select: true,
          destroy: true,
          colReorder: true,
          // bStateSave: true,
          // rowId: 0,
          pageLength: initialDatatableLoad,
          lengthMenu: [ [initialDatatableLoad, -1], [initialDatatableLoad, "All"] ],
          info: true,
          responsive: true,
          "order": [[ 0, "asc" ]],
          action: function () {
              $('#tblEmployeelistpop').DataTable().ajax.reload();
          },
          language: { search: "",searchPlaceholder: "Search List..." },
      }).on('page', function () {

          let draftRecord = templateObject.datatablerecords.get();
          templateObject.datatablerecords.set(draftRecord);
      }).on('column-reorder', function () {

      });

      // $('#tblEmployeelistpop').DataTable().column( 0 ).visible( true );
      //$('.fullScreenSpin').css('display','none');
  }, 0);

  var columns = $('#tblEmployeelistpop th');
  let sTible = "";
  let sWidth = "";
  let sIndex = "";
  let sVisible = "";
  let columVisible = false;
  let sClass = "";
  $.each(columns, function(i,v) {
    if(v.hidden == false){
      columVisible =  true;
    }
    if((v.className.includes("hiddenColumn"))){
      columVisible = false;
    }
    sWidth = v.style.width.replace('px', "");
    let datatablerecordObj = {
      sTitle: v.innerText || '',
      sWidth: sWidth || '',
      sIndex: v.cellIndex || 0,
      sVisible: columVisible || false,
      sClass: v.className || ''
    };
    tableHeaderList.push(datatablerecordObj);
  });
  templateObject.tableheaderrecords.set(tableHeaderList);
  $('div.dataTables_filter input').addClass('form-control form-control-sm');
  $('#tblEmployeelistpop tbody').on( 'click', 'tr', function () {
  var listData = $(this).closest('tr').attr('id');
  if(listData){
   FlowRouter.go('/employeescard?id=' + listData+'&addvs1user=true');
  }
  });
        }
      }).catch(function (err) {
        contactService.getAllEmployeesData().then(function (data) {
          let lineItems = [];
          let lineItemObj = {};
          for(let i=0; i<data.temployee.length; i++){
              let mobile = contactService.changeMobileFormat(data.temployee[i].Mobile);
               var dataList = {
                 id: data.temployee[i].Id || '',
                 employeeno: data.temployee[i].EmployeeNo || '',
                 employeename:data.temployee[i].EmployeeName || '',
                 firstname: data.temployee[i].FirstName || '',
                 lastname: data.temployee[i].LastName || '',
                 phone: data.temployee[i].Phone || '',
                 mobile: mobile || '',
                 email: data.temployee[i].Email || '',
                 address: data.temployee[i].Street || '',
                 country: data.temployee[i].Country || '',
                 department: data.temployee[i].DefaultClassName || '',
                 custFld1: data.temployee[i].CustFld1 || '',
                 custFld2: data.temployee[i].CustFld2 || '',
                 custFld3: data.temployee[i].CustFld3 || '',
                 custFld4: data.temployee[i].CustFld4 || ''
             };

             if(data.temployee[i].EmployeeName.replace(/\s/g, '') != ''){
              dataTableList.push(dataList);
            }
              //}
          }

          templateObject.datatablerecords.set(dataTableList);

          if(templateObject.datatablerecords.get()){

            Meteor.call('readPrefMethod',localStorage.getItem('mycloudLogonID'),'tblEmployeelistpop', function(error, result){
            if(error){

            }else{
              if(result){
                for (let i = 0; i < result.customFields.length; i++) {
                  let customcolumn = result.customFields;
                  let columData = customcolumn[i].label;
                  let columHeaderUpdate = customcolumn[i].thclass.replace(/ /g, ".");
                  let hiddenColumn = customcolumn[i].hidden;
                  let columnClass = columHeaderUpdate.split('.')[1];
                  let columnWidth = customcolumn[i].width;
                  let columnindex = customcolumn[i].index + 1;

                  if(hiddenColumn == true){

                    $("."+columnClass+"").addClass('hiddenColumn');
                    $("."+columnClass+"").removeClass('showColumn');
                  }else if(hiddenColumn == false){
                    $("."+columnClass+"").removeClass('hiddenColumn');
                    $("."+columnClass+"").addClass('showColumn');
                  }

                }
              }

            }
            });
          }


          setTimeout(function () {
              $('#tblEmployeelistpop').DataTable({

                "sDom": "<'row'><'row'<'col-sm-12 col-md-6'f><'col-sm-12 col-md-6'l>r>t<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>B",
                buttons: [
                      {
                   extend: 'csvHtml5',
                   text: '',
                   download: 'open',
                   className: "btntabletocsv hiddenColumn",
                   filename: "employeelist_"+ moment().format(),
                   orientation:'portrait',
                    exportOptions: {
                    columns: ':visible'
                  }
                },{
                    extend: 'print',
                    download: 'open',
                    className: "btntabletopdf hiddenColumn",
                    text: '',
                    title: 'Employee List',
                    filename: "employeelist_"+ moment().format(),
                    exportOptions: {
                    columns: ':visible'
                  }
                },
                {
                 extend: 'excelHtml5',
                 title: '',
                 download: 'open',
                 className: "btntabletoexcel hiddenColumn",
                 filename: "employeelist_"+ moment().format(),
                 orientation:'portrait',
                  exportOptions: {
                  columns: ':visible'
                }

                }],
                    select: true,
                    destroy: true,
                    colReorder: true,
                    // bStateSave: true,
                    // rowId: 0,
                    pageLength: initialDatatableLoad,
                    lengthMenu: [ [initialDatatableLoad, -1], [initialDatatableLoad, "All"] ],
                    info: true,
                    responsive: true,
                    "order": [[ 0, "asc" ]],
                    action: function () {
                        $('#tblEmployeelistpop').DataTable().ajax.reload();
                    },
                    language: { search: "",searchPlaceholder: "Search List..." },
                }).on('page', function () {

                    let draftRecord = templateObject.datatablerecords.get();
                    templateObject.datatablerecords.set(draftRecord);
                }).on('column-reorder', function () {

                });

                // $('#tblEmployeelistpop').DataTable().column( 0 ).visible( true );
               // $('.fullScreenSpin').css('display','none');
            }, 0);

            var columns = $('#tblEmployeelistpop th');
            let sTible = "";
            let sWidth = "";
            let sIndex = "";
            let sVisible = "";
            let columVisible = false;
            let sClass = "";
            $.each(columns, function(i,v) {
              if(v.hidden == false){
                columVisible =  true;
              }
              if((v.className.includes("hiddenColumn"))){
                columVisible = false;
              }
              sWidth = v.style.width.replace('px', "");
              let datatablerecordObj = {
                sTitle: v.innerText || '',
                sWidth: sWidth || '',
                sIndex: v.cellIndex || 0,
                sVisible: columVisible || false,
                sClass: v.className || ''
              };
              tableHeaderList.push(datatablerecordObj);
            });
          templateObject.tableheaderrecords.set(tableHeaderList);
           $('div.dataTables_filter input').addClass('form-control form-control-sm');
           $('#tblEmployeelistpop tbody').on( 'click', 'tr', function () {
           var listData = $(this).closest('tr').attr('id');
           if(listData){
             FlowRouter.go('/employeescard?id=' + listData+'&addvs1user=true');
           }
         });

        }).catch(function (err) {
            // Bert.alert('<strong>' + err + '</strong>!', 'danger');
            //$('.fullScreenSpin').css('display','none');
            // Meteor._reload.reload();
        });
      });
    }

    //templateObject.getEmployees();

    $('#tblEmployeelistpop tbody').on( 'click', 'tr', function () {
    var listData = $(this).closest('tr').find('.colID').text();
    if(listData){
      FlowRouter.go('/employeescard?addvs1user=true&id=' + listData);
    }

  });


});


Template.popemployeelist.events({
    'click #btnNewEmployee':function(event){
        // FlowRouter.go('/employeescard');
        FlowRouter.go('/employeescard?addvs1user=true');
    },
    'click .btnAddVS1User':function(event){
     FlowRouter.go('/employeescard');
    },
    'click .chkDatatable' : function(event){
      var columns = $('#tblEmployeelistpop th');
      let columnDataValue = $(event.target).closest("div").find(".divcolumn").text();

      $.each(columns, function(i,v) {
        let className = v.classList;
        let replaceClass = className[1];

      if(v.innerText == columnDataValue){
      if($(event.target).is(':checked')){
        $("."+replaceClass+"").css('display','table-cell');
        $("."+replaceClass+"").css('padding','.75rem');
        $("."+replaceClass+"").css('vertical-align','top');
      }else{
        $("."+replaceClass+"").css('display','none');
      }
      }
      });
    },
    'click .resetTable' : function(event){
      var getcurrentCloudDetails = CloudUser.findOne({_id:localStorage.getItem('mycloudLogonID'),clouddatabaseID:localStorage.getItem('mycloudLogonDBID')});
      if(getcurrentCloudDetails){
        if (getcurrentCloudDetails._id.length > 0) {
          var clientID = getcurrentCloudDetails._id;
          var clientUsername = getcurrentCloudDetails.cloudUsername;
          var clientEmail = getcurrentCloudDetails.cloudEmail;
          var checkPrefDetails = CloudPreference.findOne({userid:clientID,PrefName:'tblEmployeelistpop'});
          if (checkPrefDetails) {
            CloudPreference.remove({_id:checkPrefDetails._id}, function(err, idTag) {
            if (err) {

            }else{
              Meteor._reload.reload();
            }
            });

          }
        }
      }
    },
    'click .saveTable' : function(event){
      let lineItems = [];
      $('.columnSettings').each(function (index) {
        var $tblrow = $(this);
        var colTitle = $tblrow.find(".divcolumn").text()||'';
        var colWidth = $tblrow.find(".custom-range").val()||0;
        var colthClass = $tblrow.find(".divcolumn").attr("valueupdate")||'';
        var colHidden = false;
        if($tblrow.find(".custom-control-input").is(':checked')){
          colHidden = false;
        }else{
          colHidden = true;
        }
        let lineItemObj = {
          index: index,
          label: colTitle,
          hidden: colHidden,
          width: colWidth,
          thclass: colthClass
        }

        lineItems.push(lineItemObj);
      });

      var getcurrentCloudDetails = CloudUser.findOne({_id:localStorage.getItem('mycloudLogonID'),clouddatabaseID:localStorage.getItem('mycloudLogonDBID')});
      if(getcurrentCloudDetails){
        if (getcurrentCloudDetails._id.length > 0) {
          var clientID = getcurrentCloudDetails._id;
          var clientUsername = getcurrentCloudDetails.cloudUsername;
          var clientEmail = getcurrentCloudDetails.cloudEmail;
          var checkPrefDetails = CloudPreference.findOne({userid:clientID,PrefName:'tblEmployeelistpop'});
          if (checkPrefDetails) {
            CloudPreference.update({_id: checkPrefDetails._id},{$set: { userid: clientID,username:clientUsername,useremail:clientEmail,
              PrefGroup:'salesform',PrefName:'tblEmployeelistpop',published:true,
              customFields:lineItems,
              updatedAt: new Date() }}, function(err, idTag) {
              if (err) {
                $('#myModal2').modal('toggle');
              } else {
                $('#myModal2').modal('toggle');
              }
            });

          }else{
            CloudPreference.insert({ userid: clientID,username:clientUsername,useremail:clientEmail,
              PrefGroup:'salesform',PrefName:'tblEmployeelistpop',published:true,
              customFields:lineItems,
              createdAt: new Date() }, function(err, idTag) {
              if (err) {
                $('#myModal2').modal('toggle');
              } else {
                $('#myModal2').modal('toggle');

              }
            });
          }
        }
      }
      $('#myModal2').modal('toggle');
    },
    'blur .divcolumn' : function(event){
      let columData = $(event.target).text();

      let columnDatanIndex = $(event.target).closest("div.columnSettings").attr('id');
      var datable = $('#tblEmployeelistpop').DataTable();
      var title = datable.column( columnDatanIndex ).header();
      $(title).html(columData);

    },
    'change .rngRange' : function(event){
      let range = $(event.target).val();
      $(event.target).closest("div.divColWidth").find(".spWidth").html(range+'px');

      let columData = $(event.target).closest("div.divColWidth").find(".spWidth").attr("value");
      let columnDataValue = $(event.target).closest("div").prev().find(".divcolumn").text();
      var datable = $('#tblEmployeelistpop th');
      $.each(datable, function(i,v) {

      if(v.innerText == columnDataValue){
          let className = v.className;
          let replaceClass = className.replace(/ /g, ".");
        $("."+replaceClass+"").css('width',range+'px');

      }
      });

    },
    'click .btnOpenSettings' : function(event){
      let templateObject = Template.instance();
      var columns = $('#tblEmployeelistpop th');

      const tableHeaderList = [];
      let sTible = "";
      let sWidth = "";
      let sIndex = "";
      let sVisible = "";
      let columVisible = false;
      let sClass = "";
      $.each(columns, function(i,v) {
        if(v.hidden == false){
          columVisible =  true;
        }
        if((v.className.includes("hiddenColumn"))){
          columVisible = false;
        }
        sWidth = v.style.width.replace('px', "");
        let datatablerecordObj = {
          sTitle: v.innerText || '',
          sWidth: sWidth || '',
          sIndex: v.cellIndex || 0,
          sVisible: columVisible || false,
          sClass: v.className || ''
        };
        tableHeaderList.push(datatablerecordObj);
      });
      templateObject.tableheaderrecords.set(tableHeaderList);
    },
  'click .exportbtn': function () {
    $('.fullScreenSpin').css('display','inline-block');
    jQuery('#tblEmployeelistpop_wrapper .dt-buttons .btntabletocsv').click();
     $('.fullScreenSpin').css('display','none');

  },
  'click .exportbtnExcel': function () {
    $('.fullScreenSpin').css('display','inline-block');
    jQuery('#tblEmployeelistpop_wrapper .dt-buttons .btntabletoexcel').click();
     $('.fullScreenSpin').css('display','none');
  },
  'click .btnRefresh': function () {
    $('.fullScreenSpin').css('display','inline-block');
    let templateObject = Template.instance();
    sideBarService.getAllEmployees(initialBaseDataLoad,0).then(function(data) {
      addVS1Data('TEmployee',JSON.stringify(data)).then(function (datareturn) {
        location.reload(true);
      }).catch(function (err) {
        location.reload(true);
      });
    }).catch(function(err) {
      location.reload(true);
    });
  },
  'click .printConfirm' : function(event){
    playPrintAudio();
    setTimeout(function(){
    $('.fullScreenSpin').css('display','inline-block');
    jQuery('#tblEmployeelistpop_wrapper .dt-buttons .btntabletopdf').click();
     $('.fullScreenSpin').css('display','none');
    }, delayTimeAfterSound);
   },
   'click .templateDownload': function () {
           let utilityService = new UtilityService();
           let rows =[];
           const filename = 'SampleEmployee'+'.csv';
           rows[0]= ['First Name', 'Last Name', 'Phone','Mobile', 'Email','Skype', 'Street', 'Street2', 'State', 'Post Code', 'Country'];
           rows[1]= ['John', 'Smith', '9995551213','9995551213', 'johnsmith@email.com','johnsmith', '123 Main Street', 'Main Street', 'New York', '1234', 'United States'];
               utilityService.exportToCsv(rows, filename, 'csv');
   },
   'click .templateDownloadXLSX': function (e) {

     e.preventDefault();  //stop the browser from following
     window.location.href = 'sample_imports/SampleEmployee.xlsx';
   },
     'click .btnUploadFile':function(event){
       $('#attachment-upload').val('');
       $('.file-name').text('');
       //$(".btnImport").removeAttr("disabled");
        $('#attachment-upload').trigger('click');

   },
   'change #attachment-upload': function (e) {
       let templateObj = Template.instance();
       var filename = $('#attachment-upload')[0].files[0]['name'];
       var fileExtension = filename.split('.').pop().toLowerCase();
       var validExtensions = ["csv","txt","xlsx"];
       var validCSVExtensions = ["csv","txt"];
       var validExcelExtensions = ["xlsx","xls"];

       if (validExtensions.indexOf(fileExtension) == -1) {
           swal('Invalid Format', 'formats allowed are :' + validExtensions.join(', '), 'error');
           $('.file-name').text('');
           $(".btnImport").Attr("disabled");
       }else if(validCSVExtensions.indexOf(fileExtension) != -1){

         $('.file-name').text(filename);
         let selectedFile = event.target.files[0];

         templateObj.selectedFile.set(selectedFile);
         if($('.file-name').text() != ""){
           $(".btnImport").removeAttr("disabled");
         }else{
           $(".btnImport").Attr("disabled");
         }
       }else if(fileExtension == 'xlsx'){
         $('.file-name').text(filename);
         let selectedFile = event.target.files[0];
         var oFileIn;
       var oFile = selectedFile;
       var sFilename = oFile.name;
       // Create A File Reader HTML5
       var reader = new FileReader();

       // Ready The Event For When A File Gets Selected
       reader.onload = function (e) {
                   var data = e.target.result;
                   data = new Uint8Array(data);
                   var workbook = XLSX.read(data, {type: 'array'});

                   var result = {};
                   workbook.SheetNames.forEach(function (sheetName) {
                       var roa = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {header: 1});
                       var sCSV = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
                       templateObj.selectedFile.set(sCSV);

                       if (roa.length) result[sheetName] = roa;
                   });
                   // see the result, caution: it works after reader event is done.

               };
               reader.readAsArrayBuffer(oFile);

               if($('.file-name').text() != ""){
                 $(".btnImport").removeAttr("disabled");
               }else{
                 $(".btnImport").Attr("disabled");
               }

       }



   },
   'click .btnImport' : function () {
     $('.fullScreenSpin').css('display','inline-block');
     let templateObject = Template.instance();
     let contactService = new ContactService();
       let objDetails;
       Papa.parse(templateObject.selectedFile.get(), {
           complete: function(results) {

             if(results.data.length > 0){
               if( (results.data[0][0] == "First Name")
               && (results.data[0][1] == "Last Name") && (results.data[0][2] == "Phone")
               && (results.data[0][3] == "Mobile") && (results.data[0][4] == "Email")
               && (results.data[0][5] == "Skype") && (results.data[0][6] == "Street")
               && (results.data[0][7] == "Street2") && (results.data[0][8] == "State")
               && (results.data[0][9] == "Post Code") && (results.data[0][10] == "Country")) {

         let dataLength = results.data.length * 500;
         setTimeout(function(){
          // $('#importModal').modal('toggle');
          Meteor._reload.reload();
        },parseInt(dataLength));

               for (let i = 0; i < results.data.length -1; i++) {
                       objDetails = {
                           type: "TEmployee",
                           fields:
                               {
                                 FirstName: results.data[i+1][0],
                                 LastName: results.data[i+1][1],
                                 Phone: results.data[i+1][2],
                                 Mobile: results.data[i+1][3],
                                 Email: results.data[i+1][4],
                                 SkypeName: results.data[i+1][5],
                                 Street: results.data[i+1][6],
                                 Street2: results.data[i+1][7],
                                 State: results.data[i+1][8],
                                 PostCode:results.data[i+1][9],
                                 Country:results.data[i+1][10]

                                 // BillStreet: results.data[i+1][6],
                                 // BillStreet2: results.data[i+1][7],
                                 // BillState: results.data[i+1][8],
                                 // BillPostCode:results.data[i+1][9],
                                 // Billcountry:results.data[i+1][10]
                               }
                       };
                 if(results.data[i+1][1]){
                 if(results.data[i+1][1] !== "") {
                   contactService.saveEmployee(objDetails).then(function (data) {
                     ///$('.fullScreenSpin').css('display','none');
                      //Meteor._reload.reload();
                   }).catch(function (err) {
                     //$('.fullScreenSpin').css('display','none');
                       swal({ title: 'Oooops...', text: err, type: 'error', showCancelButton: false, confirmButtonText: 'Try Again' }).then((result) => { if (result.value) { Meteor._reload.reload(); } else if (result.dismiss === 'cancel') {}});
                   });
                 }
               }
               }
             }else{
               $('.fullScreenSpin').css('display','none');
               swal('Invalid Data Mapping fields ', 'Please check that you are importing the correct file with the correct column headers.', 'error');
             }
           }else{
             $('.fullScreenSpin').css('display','none');
             swal('Invalid Data Mapping fields ', 'Please check that you are importing the correct file with the correct column headers.', 'error');
           }

           }
       });
   }


});

Template.popemployeelist.helpers({
  datatablerecords : () => {
     return Template.instance().datatablerecords.get().sort(function(a, b){
       if (a.employeename == 'NA') {
     return 1;
         }
     else if (b.employeename == 'NA') {
       return -1;
     }
   return (a.employeename.toUpperCase() > b.employeename.toUpperCase()) ? 1 : -1;
   });
  },
  tableheaderrecords: () => {
     return Template.instance().tableheaderrecords.get();
  },
  salesCloudPreferenceRec: () => {
  return CloudPreference.findOne({userid:localStorage.getItem('mycloudLogonID'),PrefName:'tblEmployeelistpop'});
},

    apiFunction:function() {
        let sideBarService = new SideBarService();
        return sideBarService.getAllTEmployeeList;
    },

    searchAPI: function() {
        return sideBarService.getAllEmployeesDataVS1ByName;
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
    let selCustID = templateObject.data.custid ? templateObject.data.custid:'';
  	return 'tblEmployeelistpop'+selCustID;
   }
});
