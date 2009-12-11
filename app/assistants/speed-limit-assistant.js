// SpeedLimitAssistant - simple controller for adding new feeds to the list.
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
function SpeedLimitAssistant(sceneAssistant) {
  this.sceneAssistant = sceneAssistant;
}
SpeedLimitAssistant.prototype.setup = function(widget) {
  this.widget = widget;
  // Setup text field for the new feed's URL
  //
  this.sceneAssistant.controller.setupWidget("speedLimitText",
    this.attributes = {
      property: "value",
      modifierState: Mojo.Widget.numLock,
      focus: true,
      limitResize: true,
      textReplacement: false,
      enterSubmits: true
    },
    this.speedModel = {value : sabnzbd.lastRequest.speedlimit}
  );
  // Setup button and event handler
  //
  this.sceneAssistant.controller.setupWidget("speedLimitButton",
    this.attributes = {
        type: Mojo.Widget.activityButton
    },
    this.model = {
      buttonLabel: "Set Speed Limit",
      disabled: false
    }
  );
  Mojo.Event.listen($('speedLimitButton'), Mojo.Event.tap, this.setSpeedLimit.bindAsEventListener(this));
};

SpeedLimitAssistant.prototype.setSpeedLimit = function(event) {
    sabnzbd.setSpeedLimit(this.speedModel.value);
    this.widget.mojo.close();
};