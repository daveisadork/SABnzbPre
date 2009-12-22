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
function PauseForAssistant(sceneAssistant) {
  this.sceneAssistant = sceneAssistant;
}
PauseForAssistant.prototype.setup = function(widget) {
  this.widget = widget;
  // Setup text field for the new feed's URL
  //
  this.sceneAssistant.controller.setupWidget("pauseForText",
    this.attributes = {
      property: "value",
      modifierState: Mojo.Widget.numLock,
      focus: true,
      limitResize: true,
      textReplacement: false,
      enterSubmits: true
    },
    this.pauseModel = {value : ""}
  );
  // Setup button and event handler
  //
  this.sceneAssistant.controller.setupWidget("pauseForButton",
    this.attributes = {
        type: Mojo.Widget.activityButton
    },
    this.model = {
      buttonLabel: "Set Pause Time",
      disabled: false
    }
  );
  Mojo.Event.listen($('pauseForButton'), Mojo.Event.tap, this.setPause.bindAsEventListener(this));
};

PauseForAssistant.prototype.setPause = function(event) {
    sabnzbd.pauseFor(this.pauseModel.value);
    this.widget.mojo.close();
};