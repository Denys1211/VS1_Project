import { Template } from 'meteor/templating';
import './addfixedassetlinepop.html';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';

Template.addfixedassetlinepop.onCreated(function() {

})

Template.addfixedassetlinepop.onRendered(function() {
    $("#costTypeLine").editableSelect();
    

})

Template.addfixedassetlinepop.events({})

Template.addfixedassetlinepop.helpers({})
