function ConnectionsAssistant() {
    /* this is the creator function for your scene assistant object. It will be passed all the 
       additional parameters (after the scene name) that were passed to pushScene. The reference
       to the scene controller (this.controller) has not be established yet, so any initialization
       that needs the scene controller should be done in the setup function below. */
}

ConnectionsAssistant.prototype.setup = function() {
    /* this function is for setup tasks that have to happen when the scene is first created */
        
    /* use Mojo.View.render to render view templates and add them to the scene, if needed. */
    
    /* setup widgets here */
    this.controller.setupWidget("name",
        this.attributes = {
        },
        this.nameModel = {
            value: profile.Name
        }
    );
    this.controller.setupWidget("host",
        this.attributes = {
            textCase: Mojo.Widget.steModeLowerCase
        },
        this.hostModel = {
            value: profile.Host
        }
    );
    this.controller.setupWidget("port",
        this.attributes = {
            modifierState: Mojo.Widget.numLock
        },
        this.portModel = {
            value: profile.Port
        }
        );
    this.controller.setupWidget("path",
        this.attributes = {
            textCase: Mojo.Widget.steModeLowerCase
        },
        this.pathModel = {
            value: profile.Path.substring(1, profile.Path.length - 1)
        }
        );
    //this.controller.setupWidget("useEncryption",
    //    this.attributes = {
    //        trueValue: 'https',
    //        falseValue: 'http' 
    //    },
    //    this.protocolModel = {
    //        value: profile.Protocol,
    //        disabled: true
    //    });
    this.controller.setupWidget("username",
        this.attributes = {
            textCase: Mojo.Widget.steModeLowerCase
        },
        this.usernameModel = {
            value: profile.Username
        }
        );
    this.controller.setupWidget("password",
        this.attributes = {
            textCase: Mojo.Widget.steModeLowerCase
        },
        this.passwordModel = {
            value: profile.Password
        }
        );
    this.controller.setupWidget("api_key",
        this.attributes = {
            textCase: Mojo.Widget.steModeLowerCase
        },
        this.apiKeyModel = {
            value: profile.APIKey
        }
    );
    this.controller.setupWidget("statusIndicatorSpinner",
	 this.attributes = {
	     spinnerSize: 'small'
	 },
	 this.model = {
	     spinning: false 
	 });
    this.controller.setupWidget("testConnection",
        this.attributes = {
            label: "Test These Settings"
        },
        this.testConnectionModel = {
            disabled: false
        }
    );
    this.controller.setupWidget("connectionName",
        this.attributes = {
            },
        this.model = {
            label : "BUTTON",
            disabled: false
        }
    );
    this.controller.setupWidget("removeProfile",
        this.attributes = {
            label: "Remove Profile"
        },
        this.removeProfileModel = {
            disabled: false
        }
    );
    /* add event handlers to listen to events from widgets */
    if (sabnzbd.Error) {
	$('connectionStatusIndicator').addClassName('error-32');
	$('connectionStatusText').update('Error');
    } else {
        if (sabnzbd.Connected) {
            $('connectionStatusIndicator').addClassName('ok-32');
            $('connectionStatusText').update('Connected');
        } else {
            $('connectionStatusIndicator').addClassName('unknown-32');
            $('connectionStatusText').update('Unknown');
        }
    }
    Mojo.Event.listen(this.controller.get('testConnection'), Mojo.Event.tap, this.handleTestConnection.bind(this));
    Mojo.Event.listen(this.controller.get('removeProfile'), Mojo.Event.tap, this.removeProfile.bind(this));
    Mojo.Event.listen(this.controller.get('name'), Mojo.Event.propertyChange, this.applyConnectionSettings.bind(this));
    this.controller.listen("connectionName", Mojo.Event.tap, this.selectProfile.bind(this));
};

ConnectionsAssistant.prototype.activate = function(event) {
    /* put in event handlers here that should only be in effect when this scene is active. For
       example, key handlers that are observing the document */
    $('connectionName').update(profile.Name);
    this.loadValues();
};


ConnectionsAssistant.prototype.deactivate = function(event) {
    /* remove any event handlers you added in activate and do any other cleanup that should happen before
       this scene is popped or another scene is pushed on top */
    Mojo.Event.stopListening(this.controller.get('testConnection'), Mojo.Event.tap, this.handleTestConnection.bind(this));
    this.applyConnectionSettings();
    //refresh();
};

ConnectionsAssistant.prototype.cleanup = function(event) {
    /* this function should do any cleanup needed before the scene is destroyed as 
       a result of being popped off the scene stack */
};

ConnectionsAssistant.prototype.handleTestConnection = function (event) {
    event.stopPropagation();
    Mojo.Log.info("**********************ConnectionsAssistant.prototype.handleTestConnection");
    duplicate = this.duplicateName();
    if (!duplicate) {
        if (this.hostModel.value === "") {
            Mojo.Controller.errorDialog("It might help to enter a host.");
        } else {
            this.applyConnectionSettings();
            this.pathModel.value = profile.Path;
            $('connectionStatusIndicator').removeClassName('unknown-32');
            $('connectionStatusIndicator').removeClassName('ok-32');
            $('connectionStatusIndicator').removeClassName('error-32').hide();
            $('connectionStatusIndicator').hide();
            $('connectionStatusText').update('Connecting...');
            statusIndicatorSpinner.mojo.start();
            sabnzbd.testConnection("updateConnectionStatus()");
            //this.testConnectionModel.disabled = true;
        }
    } else {
        Mojo.Controller.errorDialog("Please give this profile a unique name.");
        this.nameModel.value = profile.Name;
        this.controller.modelChanged(this.nameModel);
    }
};
ConnectionsAssistant.prototype.applyConnectionSettings = function() {
    Mojo.Log.info("**********************ConnectionsAssistant.prototype.applyConnectionSettings");
    duplicate = this.duplicateName();
    if (duplicate) {
	this.nameModel.value = profile.Name;
	//Mojo.Controller.errorDialog("Please give this profile a unique name.");
    }
    sabnzbd.closeConnection();
    preferences.Profiles[preferences.ActiveProfile] = profile.Name;
    profile.initialize(preferences.Profiles[preferences.ActiveProfile]);
    this.setValues();
    this.loadValues();
    sabnzbd.initialize(profile);
    $('connectionName').update(profile.Name);  
};

ConnectionsAssistant.prototype.selectProfile = function(event) {
    Mojo.Log.info("**********************ConnectionsAssistant.prototype.selectProfile");
    profiles = [];
    for (var index = 0; index < preferences.Profiles.length; index++) {
        profiles[index] = {label: preferences.Profiles[index], command: index};
    }
    profiles.push({label: 'Add a new profile...', command: 'add-new-profile'});
        this.controller.popupSubmenu(
	    this.attributes = {
		onChoose: this.popupHandler,
		placeNear: event.target,
		items: profiles
	    },
            this.selectProfilemodel = {
		value: preferences.ActiveProfile
	    }
	);
};
ConnectionsAssistant.prototype.popupHandler = function(command) {
    Mojo.Log.info("**********************ConnectionsAssistant.prototype.popupHandler");
    duplicate = this.duplicateName();
    if (!duplicate) {
        if (command === 'add-new-profile') {
            this.createNewProfile();
        } else if (command !== undefined) {
	    this.setValues();
	    preferences.ActiveProfile = command;
	    profile.initialize(preferences.Profiles[preferences.ActiveProfile]);
	    sabnzbd.initialize(profile);
	    this.loadValues();
	    $('connectionName').update(profile.Name);   
        }
    } else {
        Mojo.Controller.errorDialog("Please give this profile a unique name.");
        this.nameModel.value = profile.Name;
        this.controller.modelChanged(this.nameModel);
    }
};
ConnectionsAssistant.prototype.createNewProfile = function () {
    Mojo.Log.info("**********************ConnectionsAssistant.prototype.createNewProfile");
        this.setValues();
        sabnzbd.closeConnection();
        //this.nameModel.value = "Profile " + preferences.Profiles.length;
        //this.protocolModel.value = "http";
        //this.hostModel.value = "";
        //this.portModel.value = "8080";
        //this.pathModel.value = "sabnzbd";
        //this.usernameModel.value = "";
        //this.passwordModel.value = "";
        //this.apiKeyModel.value = "";
	profile.initialize("Default Profile " + (preferences.Profiles.length + 1));
        preferences.Profiles.push(profile.Name);
        preferences.ActiveProfile = preferences.Profiles.length - 1;
	this.loadValues();
        this.applyConnectionSettings();
};

ConnectionsAssistant.prototype.loadValues = function () {
    Mojo.Log.info("**********************ConnectionsAssistant.prototype.loadValues");
    this.nameModel.value = profile.Name;
    //this.protocolModel.value = profile.Protocol;
    this.hostModel.value = profile.Host;
    this.portModel.value = profile.Port;
    this.pathModel.value = profile.Path.substring(1, profile.Path.length - 1);
    this.usernameModel.value = profile.Username;
    this.passwordModel.value = profile.Password;
    this.apiKeyModel.value = profile.APIKey;
    this.controller.modelChanged(this.nameModel);
    //this.controller.modelChanged(this.protocolModel);
    this.controller.modelChanged(this.hostModel);
    this.controller.modelChanged(this.portModel);
    this.controller.modelChanged(this.pathModel);
    this.controller.modelChanged(this.usernameModel);
    this.controller.modelChanged(this.passwordModel);
    this.controller.modelChanged(this.apiKeyModel);
    $('connectionStatusIndicator').addClassName('unknown-32');
    $('connectionStatusText').update('Unknown');
    $('connectionName').update(profile.Name);
    if (preferences.Profiles.length === 1) {
	this.removeProfileModel.disabled = true;
    } else {
	this.removeProfileModel.disabled = false;
    }
    this.controller.modelChanged(this.removeProfileModel);
};

ConnectionsAssistant.prototype.setValues = function () {
    Mojo.Log.info("**********************ConnectionsAssistant.prototype.setValues");
    profile.Name = this.nameModel.value;
    profile.Host = this.hostModel.value;
    profile.Port = this.portModel.value;
    profile.Path = this.pathModel.value;
    //profile.Protocol = this.protocolModel.value;
    profile.Username = this.usernameModel.value;
    profile.Password = this.passwordModel.value;
    profile.APIKey = this.apiKeyModel.value;
    preferences.Profiles[preferences.ActiveProfile] = profile.Name;
    profile.save();
    preferences.save();
};

ConnectionsAssistant.prototype.duplicateName = function() {
    Mojo.Log.info("**********************ConnectionsAssistant.prototype.duplicateName");
    var duplicate = false;
    for (var index = 0; index < preferences.Profiles.length; index++) {
        Mojo.Log.info("if (" + preferences.Profiles[index] + " === " + this.nameModel.value + " && " + index + " !== " + preferences.ActiveProfile + ") returns", (preferences.Profiles[index] == this.nameModel.value && index != preferences.ActiveProfile));
        if (preferences.Profiles[index] == this.nameModel.value && index != preferences.ActiveProfile) {
                duplicate = true;
            }
        }
    Mojo.Log.info("**********************Duplicate value is", duplicate);
    return duplicate;
};

ConnectionsAssistant.prototype.removeProfile = function () {
    if (preferences.Profiles.length === 1) {
        Mojo.Controller.errorDialog("You have to have at least one profile.");
    } else {
        preferences.Profiles.splice(preferences.ActiveProfile);
	if (preferences.ActiveProfile > 0) {
	    preferences.ActiveProfile = preferences.ActiveProfile - 1;
	} else {
	    preferences.ActiveProfile = 0;
	}
        profile.Cookie.remove();
        profile.initialize(preferences.Profiles[preferences.ActiveProfile]);
        this.loadValues();
    }
};

updateConnectionStatus = function () {
    statusIndicatorSpinner.mojo.stop();
    $('connectionStatusIndicator').show();
    Mojo.Log.info("Finished connection test!!!:", sabnzbd.Connected, sabnzbd.Error);
    if (!sabnzbd.Error) {
        if (sabnzbd.Connected) {
            $('connectionStatusIndicator').addClassName('ok-32');
            $('connectionStatusText').update('Connected');
        } else {
            $('connectionStatusIndicator').addClassName('unknown-32');
            $('connectionStatusText').update('Unknown');
        }
    } else {
	$('connectionStatusIndicator').addClassName('error-32');
	$('connectionStatusText').update('Error');
    }
    if (profile.Host === "") {
        //Mojo.Controller.errorDialog("It might help to enter a host.");
    }
};

