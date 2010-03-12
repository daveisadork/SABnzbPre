// PauseForAssistant - simple controller for adding new feeds to the list.
// Invoked by the FeedListAssistant when the "Add..." list item is selected
// on the feed list.
//
// The dialog displays two text fields (URL and Name) and an OK button.
// Either the user enters a feed URL and a name, followed by OK or a
// back swipe to close. If OK, the feed header is checked through an Ajax
// request and if valid, the feed updated and dialog closed. If an error,
// the posted in place of title and dialog remains open.
// Swipe back cancels and returns back to the FeedListAssistant.
//
function OnQueueFinishAssistant(sceneAssistant) {
  this.sceneAssistant = sceneAssistant;
}
OnQueueFinishAssistant.prototype.setup = function(widget) {
  this.widget = widget;

  this.finishActionAttributes = {
    choices: [
    {label: $L("None"), value: ""},
    {label: $L("Shutdown PC"), value: "shutdown_pc"},
    {label: $L("Standby PC"), value: "standby_pc"},
    {label: $L("Hibernate PC"), value: "hibernate_pc"},
    {label: $L("Shutdown SABnzbd"), value: "shutdown_program"}
    ]
  }
    
  sabnzbd.Scripts.slice(1, sabnzbd.Scripts.length).forEach(
    function (script) {
      this.finishActionAttributes.choices.push(
        {label: script.label, value: "script_#{value}".interpolate(script)}
      )
    }.bind(this)
  )
  //if (sabnzbd.lastRequest.scripts.length !== 0) {
  //    sabnzbd.lastRequest.scripts.forEach(
  //      function(script) {
  //        this.finishActionAttributes.choices.push(
  //          {label: script, value: script}
  //        )
  //      }
  //    )
  //}
  
  this.finishActionModel = {
      value: sabnzbd.finishAction,
      disabled: false
  }
    this.sceneAssistant.controller.setupWidget("finishActionSelector",
        this.finishActionAttributes,
        this.finishActionModel
    ); 
  // Setup button and event handler
  //
  this.sceneAssistant.controller.listen("finishActionSelector", Mojo.Event.propertyChange, this.setPause.bind(this));
};



OnQueueFinishAssistant.prototype.setPause = function(event) {
    sabnzbd.setCompleteAction(this.finishActionModel.value);
    this.widget.mojo.close();
};