import {VS1ChartService} from "../vs1charts-service";
import "jQuery.print/jQuery.print.js";
import {UtilityService} from "../../utility-service";
import {SideBarService} from "../../js/sidebar-service";
import { Template } from "meteor/templating";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import './employeeLeave.html';

let vs1chartService = new VS1ChartService();
let utilityService = new UtilityService();
let sideBarService = new SideBarService();

Template.employeeLeave.onCreated(() => {
  const templateObject = Template.instance();
  templateObject.records = new ReactiveVar([]);
  templateObject.dateAsAt = new ReactiveVar();
  templateObject.deptrecords = new ReactiveVar();
  templateObject.timesheetrecords = new ReactiveVar([]);
  templateObject.salesperc = new ReactiveVar();
  templateObject.expenseperc = new ReactiveVar();
  templateObject.salespercTotal = new ReactiveVar();
  templateObject.expensepercTotal = new ReactiveVar();
  templateObject.topTenData = new ReactiveVar([]);
});

Template.employeeLeave.onRendered(() => {
  const templateObject = Template.instance();

	function setFullScreenSpin(){
		$(".fullScreenSpin").css("display", "none");
	}

	function setChart(data){
		let clockedOnEmpList = [], max = {}, max_tmp = 0;
		let empName = [], empClockedCount = [], backgroundColor = [], borderColor = [];

		for (let t = 0; t < data.ttimesheet.length; t++) {
			if (data.ttimesheet[t].fields.Logs != null) {
				if (
					data.ttimesheet[t].fields.InvoiceNotes == "Clocked On" ||
					data.ttimesheet[t].fields.InvoiceNotes == "paused"
				) {
					clockedOnEmpList[data.ttimesheet[t].fields.EmployeeName] ? clockedOnEmpList[data.ttimesheet[t].fields.EmployeeName] ++ : clockedOnEmpList[data.ttimesheet[t].fields.EmployeeName] = 1;
				}else{
					clockedOnEmpList[data.ttimesheet[t].fields.EmployeeName] = 1;
				}

				if (max_tmp < clockedOnEmpList[data.ttimesheet[t].fields.EmployeeName]) {
					max     = data.ttimesheet;
					max_tmp = clockedOnEmpList[data.ttimesheet[t].fields.EmployeeName];
				}
			}
		}

		var sortArray = [];
		for (var emp in clockedOnEmpList) {
			let dataObj = {
				name: emp,
				clockedOn: clockedOnEmpList[emp],
				backgroundColor: "#f6c23e",
				borderColor: "rgba(78,115,223,0)"
			};
			sortArray.push(dataObj);
		}

		sortArray.sort(function (a, b) {
			return b.clockedOn > a.clockedOn ? 1 : -1;
		});

		for (let j = 0; j < sortArray.length; j++) {
			empName.push(sortArray[j].name);
			empClockedCount.push(sortArray[j].clockedOn);
			backgroundColor.push(sortArray[j].backgroundColor);
			borderColor.push(sortArray[j].borderColor);
		}

		empName.reverse();
		empClockedCount.reverse();

		var ctx = document.getElementById("employeeLeavechart").getContext("2d");
		var myChart = new Chart(ctx, {
			type: "horizontalBar",
			data: {
				labels: empName,
				datasets: [
				{
					label: "Employee #" + this.empName,
					data: empClockedCount,
					backgroundColor: backgroundColor,
					borderColor: borderColor,
					borderWidth: 1
				}
				]
			},
			options: {
				onClick: chartClickEvent,
				maintainAspectRatio: false,
				responsive: true,
				tooltips: {
				callbacks: {
					label: function (tooltipItem, data) {
					return tooltipItem.xLabel;
					}
				}
				},
				legend: {
				display: false
				},
				title: {},
				scales: {
				xAxes: [
					{
					gridLines: {
						color: "rgb(234, 236, 244)",
						zeroLineColor: "rgb(234, 236, 244)",
						drawBorder: false,
						drawTicks: false,
						borderDash: ["2"],
						zeroLineBorderDash: ["2"],
						drawOnChartArea: false
					},
					ticks: {
						fontColor: "#858796",
						beginAtZero: true,
						padding: 20
					}
					}
				],
				yAxes: [
					{
					gridLines: {
						color: "rgb(234, 236, 244)",
						zeroLineColor: "rgb(234, 236, 244)",
						drawBorder: false,
						drawTicks: false,
						borderDash: ["2"],
						zeroLineBorderDash: ["2"]
					},
					ticks: {
						fontColor: "#858796",
						beginAtZero: true,
						padding: 20
					}
					}
				]
				}
			}
		});

		setFullScreenSpin();
	}

	function chartClickEvent() {
		FlowRouter.go("/crmoverview?viewcompleted=true");
	}

	templateObject.getAllTimeSheetDataClock = function () {
		$('.sortable-chart-widget-js').addClass("hideelement");
		getVS1Data("TTimeSheet").then(function (dataObject) {
			if (dataObject == 0) {
					sideBarService
						.getAllTimeSheetList()
						.then(function (data) {
							setTimeout(function () {
								setChart(data);
							}, 0);
					}).catch(function (err) {
						setFullScreenSpin();
					});
			} else {
				setTimeout(function () {
					let data = JSON.parse(dataObject[0].data);
					setChart(data);
				}, 0);
				setFullScreenSpin();
			}
		}).catch(function (err) {
			sideBarService.getAllTimeSheetList().then(function (data) {
				setTimeout(function () {
					setChart(data);
				}, 0);
				setFullScreenSpin();
			}).catch(function (err) {
				setFullScreenSpin();
			});
		});
	};

	templateObject.getAllTimeSheetDataClock();
});

Template.employeeLeave.helpers({
  dateAsAt: () => {
    return Template.instance().dateAsAt.get() || "-";
  },
  topTenData: () => {
    return Template.instance().topTenData.get();
  },
  Currency: () => {
    return Currency;
  },
  companyname: () => {
    return loggedCompany;
  },
  salesperc: () => {
    return Template.instance().salesperc.get() || 0;
  },
  expenseperc: () => {
    return Template.instance().expenseperc.get() || 0;
  },
  salespercTotal: () => {
    return Template.instance().salespercTotal.get() || 0;
  },
  expensepercTotal: () => {
    return Template.instance().expensepercTotal.get() || 0;
  },
  timesheetrecords: () => {
    return Template.instance().timesheetrecords.get().sort(function (a, b) {
      if (a.employee == "NA") {
        return 1;
      } else if (b.employee == "NA") {
        return -1;
      }
      return a.employee.toUpperCase() > b.employee.toUpperCase()
        ? 1
        : -1;
    });
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
