function StageAssistant() {
}

StageAssistant.prototype.setup = function() {
    Mojo.Log.info("Initializing preferences");
    preferences = new Preferences();
    Mojo.Log.info("Loading connection profile: " + preferences.Profiles[preferences.ActiveProfile]);
    profile = new ConnectionProfile(preferences.Profiles[preferences.ActiveProfile]);
    Mojo.Log.info("Initiating server connection.");
    sabnzbd = new Server(profile);
    this.controller.pushScene('queue-history-list');
    //this.controller.pushScene('preferences');
};