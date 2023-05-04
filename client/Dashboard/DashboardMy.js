import {ReactiveVar} from "meteor/reactive-var";

Template.dashboardmy.onCreated(function () {    
    const templateObject = Template.instance();
    templateObject.includeDashboard = new ReactiveVar(false);    
});

Template.dashboardmy.onRendered(function () {
    let templateObject = Template.instance();
    let isDashboard = localStorage.getItem("CloudDashboardModule");
    if (isDashboard) {
        templateObject.includeDashboard.set(true);
    }
});

Template.dashboardmy.helpers({
    includeDashboard: () => {
        return Template.instance().includeDashboard.get();
    }, 
});

// Listen to event to update reactive variable
Template.dashboardmy.events({

});