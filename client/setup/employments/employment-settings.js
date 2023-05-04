// @ts-nocheck
import './employment-settings.html'
import { ReactiveVar } from "meteor/reactive-var";
import { Template } from 'meteor/templating';
import "../../lib/global/indexdbstorage.js";
import LoadingOverlay from "../../LoadingOverlay";
import { UtilityService } from "../../utility-service";
import { ContactService } from "../../contacts/contact-service";
import { SideBarService } from '../../js/sidebar-service';

const utilityService = new UtilityService();
const contactService = new ContactService();
let sideBarService = new SideBarService();


Template.wizard_employment.onCreated(() => {
  const templateObject = Template.instance();
  templateObject.selectedFile = new ReactiveVar();
  templateObject.currentEmployees = new ReactiveVar([]);
  templateObject.editableEmployee = new ReactiveVar();
  templateObject.empuserrecord = new ReactiveVar();
  templateObject.datatablerecords = new ReactiveVar([]);
  templateObject.tableheaderrecords = new ReactiveVar([]);
  templateObject.displayfields = new ReactiveVar([]);
  templateObject.reset_data = new ReactiveVar([]);
  templateObject.setupFinished = new ReactiveVar();
  templateObject.employees = new ReactiveVar([]);

  templateObject.getDataTableList = function (data) {
    let linestatus = '';
    if (data.Active == true) {
        linestatus = "";
    } else if (data.Active == false) {
        linestatus = "In-Active";
    }
    ;
    var dataList = [
        data.EmployeeID || "",
        data.EmployeeName || "",
        data.FirstName || "",
        data.LastName || "",
        data.Phone || "",
        data.Email || '',
        linestatus,
        
    ];
    return dataList;
}

let headerStructure = [
    {index: 0, label: 'Emp #', class: 'colEmployeeNo', active: false, display: true, width: "10"},
    {index: 1, label: 'Employee Name', class: 'colEmployeeName', active: true, display: true, width: "200"},
    {index: 2, label: 'First Name', class: 'colFirstName', active: true, display: true, width: "100"},
    {index: 3, label: 'Last Name', class: 'colLastName', active: true, display: true, width: "100"},
    {index: 4, label: 'Phone', class: 'colPhone', active: true, display: true, width: "95"},
    {index: 5, label: 'Email', class: 'colEmail', active: true, display: true, width: "200"},
    {index: 6, label: 'Status', class: 'colStatus', active: true, display: true, width: "120"},
   
];
templateObject.tableheaderrecords.set(headerStructure);

  // templateObject.getEmployeeProfileImageData = function (employeeName) {
  //   const contactService = new ContactService();
  //   contactService.getEmployeeProfileImageByName(employeeName).then((data) => {
  //     let employeeProfile = "";
  //     for (let i = 0; i < data.temployeepicture.length; i++) {
  //       if (data.temployeepicture[i].EmployeeName === employeeName) {
  //         employeeProfile = data.temployeepicture[i].EncodedPic;
  //         $(".imageUpload").attr(
  //           "src",
  //           "data:image/jpeg;base64," + employeeProfile
  //         );
  //         $(".cloudEmpImgID").val(data.temployeepicture[i].Id);
  //         break;
  //       }
  //     }
  //   });
  // };

})

Template.wizard_employment.onRendered(() => [
  
])

Template.wizard_employment.helpers({
  currentEmployees: () => {
    return Template.instance().currentEmployees.get();
  },
  employeetableheaderrecords: () => {
    return Template.instance().employeetableheaderrecords.get();
  },
  salesCloudPreferenceRec: () => {
    return CloudPreference.findOne({
      userid: localStorage.getItem("mycloudLogonID"),
      PrefName: "tblEmployeelist",
    });
  },
  editableEmployee: () => {
    return Template.instance().editableEmployee.get();
  },
  datatablerecords: () => {
    return Template.instance().datatablerecords.get().sort(function (a, b) {
        if (a.employeename == 'NA') {
            return 1;
        } else if (b.employeename == 'NA') {
            return -1;
        }
        return (a.employeename.toUpperCase() > b.employeename.toUpperCase()) ? 1 : -1;
    });
  },
  tableheaderrecords: () => {
      return Template.instance().tableheaderrecords.get();
  },
  isSetupFinished: () => {
      return Template.instance().setupFinished.get();
  },
  getSkippedSteps() {
      let setupUrl = localStorage.getItem("VS1Cloud_SETUP_SKIPPED_STEP") || JSON.stringify().split();
      return setupUrl[1];
  },
  // custom fields displaysettings
  displayfields: () => {
      return Template.instance().displayfields.get();
  },
  employees: () => Template.instance().employees.get(),

  apiFunction: function () {
      let sideBarService = new SideBarService();
      return sideBarService.getAllTEmployeeList;
  },

  searchAPI: function () {
      return sideBarService.getAllEmployeesDataVS1ByName;
  },

  service: () => {
      let sideBarService = new SideBarService();
      return sideBarService;

  },

  datahandler: function () {
      let templateObject = Template.instance();
      return function (data) {
          let dataReturn = templateObject.getDataTableList(data)
          return dataReturn
      }
  },

  exDataHandler: function () {
      let templateObject = Template.instance();
      return function (data) {
          let dataReturn = templateObject.getDataTableList(data)
          return dataReturn
      }
  },

  apiParams: function () {
    return ['limitCount', 'limitFrom', 'deleteFilter'];
},
})
Template.wizard_employment.events({
  "click .btnSaveEmpPop"(e){
    playSaveAudio();
    setTimeout(function () {
      $("#addEmployeeModal").modal("toggle");
    }, delayTimeAfterSound);
  },
  "click .edit-employees-js"(e) {
    $("#addEmployeeModal").modal("toggle");
    let templateObject = Template.instance();
    LoadingOverlay.show();
    const employeeID = $(e.currentTarget).attr("id");
    if (!isNaN(employeeID)) {
      let employeeList = templateObject.currentEmployees.get();

      let data = employeeList.filter(
        (employee) => employee.fields.ID == employeeID
      );
      data = data[0];

      let editableEmployee = {
        id: data.fields.ID,
        lid: "Edit Employee",
        title: data.fields.Title || "",
        firstname: data.fields.FirstName || "",
        middlename: data.fields.MiddleName || "",
        lastname: data.fields.LastName || "",
        company: data.fields.EmployeeName || "",
        tfn: data.fields.TFN || "",
        priority: data.fields.CustFld5 || 0,
        color: data.fields.CustFld6 || "#00a3d3",
        email: data.fields.Email || "",
        phone: data.fields.Phone || "",
        mobile: data.fields.Mobile || "",
        fax: data.fields.FaxNumber || "",
        skype: data.fields.SkypeName || "",
        gender: data.fields.Sex || "",
        dob: data.fields.DOB
          ? moment(data.fields.DOB).format("DD/MM/YYYY")
          : "",
        startdate: data.fields.DateStarted
          ? moment(data.fields.DateStarted).format("DD/MM/YYYY")
          : "",
        datefinished: data.fields.DateFinished
          ? moment(data.fields.DateFinished).format("DD/MM/YYYY")
          : "",
        position: data.fields.Position || "",
        streetaddress: data.fields.Street || "",
        city: data.fields.Street2 || "",
        state: data.fields.State || "",
        postalcode: data.fields.PostCode || "",
        country: data.fields.Country || LoggedCountry,
        custfield1: data.fields.CustFld1 || "",
        custfield2: data.fields.CustFld2 || "",
        custfield3: data.fields.CustFld3 || "",
        custfield4: data.fields.CustFld4 || "",
        custfield14: data.fields.CustFld14 || "",
        website: "",
        notes: data.fields.Notes || "",
      };

      templateObject.editableEmployee.set(editableEmployee);
    }
    LoadingOverlay.hide();
  },
  "click #btnNewEmployee"(event){
    $("#addEmployeeModal").modal("toggle");

    let templateObject = Template.instance();
    LoadingOverlay.show();
    templateObject.editableEmployee.set(null);
    LoadingOverlay.hide();
  },
  "click .btnAddVS1User"(event) {
    swal({
      title: "Is this an existing Employee?",
      text: "",
      type: "question",
      showCancelButton: true,
      confirmButtonText: "Yes",
      cancelButtonText: "No",
    }).then((result) => {
      if (result.value) {
        swal("Please select the employee from the list below.", "", "info");
        $("#employeeListModal").modal("toggle");
      } else if (result.dismiss === "cancel") {
        $("#addEmployeeModal").modal("toggle");
      }
    });
  },
  // "click .chkDatatableEmployee"(event) {
  //   var columns = $("#tblEmployeelist th");
  //   let columnDataValue = $(event.target)
  //     .closest("div")
  //     .find(".divcolumnEmployee")
  //     .text();
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
  // "keyup #tblEmployeelist_filter input"(event) {
  //   if ($(event.target).val() != "") {
  //     $(".btnRefreshEmployees").addClass("btnSearchAlert");
  //   } else {
  //     $(".btnRefreshEmployees").removeClass("btnSearchAlert");
  //   }
  //   if (event.keyCode == 13) {
  //     $(".btnRefreshEmployees").trigger("click");
  //   }
  // },
  "click .btnRefreshEmployee"(event) {
    let templateObject = Template.instance();
    $(".fullScreenSpin").css("display", "inline-block");
    location.reload();
    // templateObject.loadEmployees(true);
  },
  "click .resetEmployeeTable"(event) {
    var getcurrentCloudDetails = CloudUser.findOne({
      _id: localStorage.getItem("mycloudLogonID"),
      clouddatabaseID: localStorage.getItem("mycloudLogonDBID"),
    });
    if (getcurrentCloudDetails) {
      if (getcurrentCloudDetails._id.length > 0) {
        var clientID = getcurrentCloudDetails._id;
        var checkPrefDetails = CloudPreference.findOne({
          userid: clientID,
          PrefName: "tblEmployeelist",
        });
        if (checkPrefDetails) {
          CloudPreference.remove(
            {
              _id: checkPrefDetails._id,
            },
            function (err, idTag) {
              if (err) {
              } else {
                // Meteor._reload.reload();
              }
            }
          );
        }
      }
    }
  },
  "click .saveEmployeeTable"(event) {
    let lineItems = [];
    $(".columnSettings").each(function (index) {
      var $tblrow = $(this);
      var colTitle = $tblrow.find(".divcolumnEmployee").text() || "";
      var colWidth = $tblrow.find(".custom-range").val() || 0;
      var colthClass =
        $tblrow.find(".divcolumnEmployee").attr("valueupdate") || "";
      var colHidden = false;
      if ($tblrow.find(".custom-control-input").is(":checked")) {
        colHidden = false;
      } else {
        colHidden = true;
      }
      let lineItemObj = {
        index: index,
        label: colTitle,
        hidden: colHidden,
        width: colWidth,
        thclass: colthClass,
      };

      lineItems.push(lineItemObj);
    });

    var getcurrentCloudDetails = CloudUser.findOne({
      _id: localStorage.getItem("mycloudLogonID"),
      clouddatabaseID: localStorage.getItem("mycloudLogonDBID"),
    });
    if (getcurrentCloudDetails) {
      if (getcurrentCloudDetails._id.length > 0) {
        var clientID = getcurrentCloudDetails._id;
        var clientUsername = getcurrentCloudDetails.cloudUsername;
        var clientEmail = getcurrentCloudDetails.cloudEmail;
        var checkPrefDetails = CloudPreference.findOne({
          userid: clientID,
          PrefName: "tblEmployeelist",
        });
        if (checkPrefDetails) {
          CloudPreference.update(
            {
              _id: checkPrefDetails._id,
            },
            {
              $set: {
                userid: clientID,
                username: clientUsername,
                useremail: clientEmail,
                PrefGroup: "salesform",
                PrefName: "tblEmployeelist",
                published: true,
                customFields: lineItems,
                updatedAt: new Date(),
              },
            },
            function (err, idTag) {
              if (err) {
                $("#btnOpenSettingsEmployee").modal("toggle");
              } else {
                $("#btnOpenSettingsEmployee").modal("toggle");
              }
            }
          );
        } else {
          CloudPreference.insert(
            {
              userid: clientID,
              username: clientUsername,
              useremail: clientEmail,
              PrefGroup: "salesform",
              PrefName: "tblEmployeelist",
              published: true,
              customFields: lineItems,
              createdAt: new Date(),
            },
            function (err, idTag) {
              if (err) {
                $("#btnOpenSettingsEmployee").modal("toggle");
              } else {
                $("#btnOpenSettingsEmployee").modal("toggle");
              }
            }
          );
        }
      }
    }
    $("#btnOpenSettingsEmployee").modal("toggle");
  },
  // "blur .divcolumnEmployee"(event) {
  //   let columData = $(event.target).text();

  //   let columnDatanIndex = $(event.target)
  //     .closest("div.columnSettings")
  //     .attr("id");
  //   // var datable = $("#tblEmployeelist").DataTable();
  //   var title = datable.column(columnDatanIndex).header();
  //   $(title).html(columData);
  // },
  // "change .rngRangeEmployee"(event) {
  //   let range = $(event.target).val();
  //   $(event.target)
  //     .closest("div.divColWidth")
  //     .find(".spWidth")
  //     .html(range + "px");

  //   let columData = $(event.target)
  //     .closest("div.divColWidth")
  //     .find(".spWidth")
  //     .attr("value");
  //   let columnDataValue = $(event.target)
  //     .closest("div")
  //     .prev()
  //     .find(".divcolumnEmployee")
  //     .text();
  //   var datable = $("#tblEmployeelist th");
  //   $.each(datable, function (i, v) {
  //     if (v.innerText == columnDataValue) {
  //       let className = v.className;
  //       let replaceClass = className.replace(/ /g, ".");
  //       $("." + replaceClass + "").css("width", range + "px");
  //     }
  //   });
  // },
  // "click .exportbtnEmployee"() {
  //   $(".fullScreenSpin").css("display", "inline-block");
  //   jQuery("#tblEmployeelist_wrapper .dt-buttons .btntabletocsv").click();
  //   LoadingOverlay.hide();
  // },
  // "click .exportbtnExcelEmployee"() {
  //   $(".fullScreenSpin").css("display", "inline-block");
  //   jQuery("#tblEmployeelist_wrapper .dt-buttons .btntabletoexcel").click();
  //   LoadingOverlay.hide();
  // },
  // "click .printConfirmEmployee"(event) {
  //   playPrintAudio();
  //   setTimeout(function () {
  //     $(".fullScreenSpin").css("display", "inline-block");
  //     jQuery("#tblEmployeelist_wrapper .dt-buttons .btntabletopdf").click();
  //     LoadingOverlay.hide();
  //   }, delayTimeAfterSound);
  // },
  'click .exportbtn': function () {
    $('.fullScreenSpin').css('display', 'inline-block');
    jQuery('#tblEmployeelist_wrapper .dt-buttons .btntabletocsv').click();
    $('.fullScreenSpin').css('display', 'none');

},
'click .exportbtnExcel': function () {
    $('.fullScreenSpin').css('display', 'inline-block');
    jQuery('#tblEmployeelist_wrapper .dt-buttons .btntabletoexcel').click();
    $('.fullScreenSpin').css('display', 'none');
},
'click .btnRefresh': (e, ui) => {
    // ui.initPage(true);
    $('.fullScreenSpin').css('display', 'inline-block');
    let templateObject = Template.instance();

    sideBarService.getAllEmployees(initialBaseDataLoad, 0).then(function (dataEmployee) {
        addVS1Data('TEmployee', JSON.stringify(dataEmployee));
    });

    sideBarService.getAllAppointmentPredList().then(function (dataPred) {
        addVS1Data('TAppointmentPreferences', JSON.stringify(dataPred)).then(function (datareturnPred) {
            sideBarService.getAllTEmployeeList(initialBaseDataLoad, 0, false).then(function (data) {
                addVS1Data('TEmployeeList', JSON.stringify(data)).then(function (datareturn) {
                    window.open('/employeelist', '_self');
                }).catch(function (err) {
                    window.open('/employeelist', '_self');
                });
            }).catch(function (err) {
                window.open('/employeelist', '_self');
            });
        }).catch(function (err) {
            window.open('/employeelist', '_self');
        });
    }).catch(function (err) {
        window.open('/employeelist', '_self');
    });

},
'click .printConfirm': function (event) {
    playPrintAudio();
    setTimeout(function () {
        $('.fullScreenSpin').css('display', 'inline-block');
        jQuery('#tblEmployeelist_wrapper .dt-buttons .btntabletopdf').click();
        $('.fullScreenSpin').css('display', 'none');
    }, delayTimeAfterSound);
},
'click .templateDownload': function () {
    let utilityService = new UtilityService();
    let rows = [];
    const filename = 'SampleEmployee' + '.csv';
    rows[0] = ['First Name', 'Last Name', 'Phone', 'Mobile', 'Email', 'Skype', 'Street', 'City/Suburb', 'State', 'Post Code', 'Country', 'Gender'];
    rows[1] = ['John', 'Smith', '9995551213', '9995551213', 'johnsmith@email.com', 'johnsmith', '123 Main Street', 'Brooklyn', 'New York', '1234', 'United States', 'M'];
    rows[1] = ['Jane', 'Smith', '9995551213', '9995551213', 'janesmith@email.com', 'janesmith', '123 Main Street', 'Brooklyn', 'New York', '1234', 'United States', 'F'];
    utilityService.exportToCsv(rows, filename, 'csv');
},
'click .templateDownloadXLSX': function (e) {

    e.preventDefault();  //stop the browser from following
    window.location.href = 'sample_imports/SampleEmployee.xlsx';
},
'click .btnUploadFile': function (event) {
    $('#attachment-upload').val('');
    $('.file-name').text('');
    //$(".btnImport").removeAttr("disabled");
    $('#attachment-upload').trigger('click');

},
'change #attachment-upload': function (e) {
    let templateObj = Template.instance();
    var filename = $('#attachment-upload')[0].files[0]['name'];
    var fileExtension = filename.split('.').pop().toLowerCase();
    var validExtensions = ["csv", "txt", "xlsx"];
    var validCSVExtensions = ["csv", "txt"];
    var validExcelExtensions = ["xlsx", "xls"];

    if (validExtensions.indexOf(fileExtension) == -1) {
        swal('Invalid Format', 'formats allowed are :' + validExtensions.join(', '), 'error');
        $('.file-name').text('');
        $(".btnImport").Attr("disabled");
    } else if (validCSVExtensions.indexOf(fileExtension) != -1) {

        $('.file-name').text(filename);
        let selectedFile = event.target.files[0];
        templateObj.selectedFile.set(selectedFile);
        if ($('.file-name').text() != "") {
            $(".btnImport").removeAttr("disabled");
        } else {
            $(".btnImport").Attr("disabled");
        }
    } else if (fileExtension == 'xlsx') {
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

        if ($('.file-name').text() != "") {
            $(".btnImport").removeAttr("disabled");
        } else {
            $(".btnImport").Attr("disabled");
        }

    }


},
'click .btnImport': function () {
    $('.fullScreenSpin').css('display', 'inline-block');
    let templateObject = Template.instance();
    let contactService = new ContactService();
    let objDetails;
    var saledateTime = new Date();
    //let empStartDate = new Date().format("YYYY-MM-DD");
    var empStartDate = moment(saledateTime).format("YYYY-MM-DD");
    Papa.parse(templateObject.selectedFile.get(), {
        complete: function (results) {

            if (results.data.length > 0) {
                if ((results.data[0][0] == "First Name")
                    && (results.data[0][1] == "Last Name") && (results.data[0][2] == "Phone")
                    && (results.data[0][3] == "Mobile") && (results.data[0][4] == "Email")
                    && (results.data[0][5] == "Skype") && (results.data[0][6] == "Street")
                    && ((results.data[0][7] == "Street2") || (results.data[0][7] == "City/Suburb")) && (results.data[0][8] == "State")
                    && (results.data[0][9] == "Post Code") && (results.data[0][10] == "Country")
                    && (results.data[0][11] == "Gender")) {

                    let dataLength = results.data.length * 500;
                    setTimeout(function () {
                        // $('#importModal').modal('toggle');
                        //Meteor._reload.reload();
                        window.open('/employeelist?success=true', '_self');
                    }, parseInt(dataLength));

                    for (let i = 0; i < results.data.length - 1; i++) {
                        objDetails = {
                            type: "TEmployee",
                            fields:
                                {
                                    FirstName: results.data[i + 1][0].trim(),
                                    LastName: results.data[i + 1][1].trim(),
                                    Phone: results.data[i + 1][2],
                                    Mobile: results.data[i + 1][3],
                                    DateStarted: empStartDate,
                                    DOB: empStartDate,
                                    Sex: results.data[i + 1][11] || "F",
                                    Email: results.data[i + 1][4],
                                    SkypeName: results.data[i + 1][5],
                                    Street: results.data[i + 1][6],
                                    Street2: results.data[i + 1][7],
                                    Suburb: results.data[i + 1][7],
                                    State: results.data[i + 1][8],
                                    PostCode: results.data[i + 1][9],
                                    Country: results.data[i + 1][10]

                                    // BillStreet: results.data[i+1][6],
                                    // BillStreet2: results.data[i+1][7],
                                    // BillState: results.data[i+1][8],
                                    // BillPostCode:results.data[i+1][9],
                                    // Billcountry:results.data[i+1][10]
                                }
                        };
                        if (results.data[i + 1][1]) {
                            if (results.data[i + 1][1] !== "") {
                                contactService.saveEmployee(objDetails).then(function (data) {
                                    ///$('.fullScreenSpin').css('display','none');
                                    //Meteor._reload.reload();
                                }).catch(function (err) {
                                    //$('.fullScreenSpin').css('display','none');
                                    swal({
                                        title: 'Oooops...',
                                        text: err,
                                        type: 'error',
                                        showCancelButton: false,
                                        confirmButtonText: 'Try Again'
                                    }).then((result) => {
                                        if (result.value) {
                                            Meteor._reload.reload();
                                        } else if (result.dismiss === 'cancel') {
                                        }
                                    });
                                });
                            }
                        }
                    }
                } else {
                    $('.fullScreenSpin').css('display', 'none');
                    swal('Invalid Data Mapping fields ', 'Please check that you are importing the correct file with the correct column headers.', 'error');
                }
            } else {
                $('.fullScreenSpin').css('display', 'none');
                swal('Invalid Data Mapping fields ', 'Please check that you are importing the correct file with the correct column headers.', 'error');
            }

        }
    });
},

  "click #tblEmployeelistpop tr td"(e) {
    $(e).preventDefault();
  },

})