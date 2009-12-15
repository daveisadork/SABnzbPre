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
    this.controller.setupWidget("hostname",
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
    this.controller.setupWidget("useEncryption",
        this.attributes = {
            trueValue: 'https',
            falseValue: 'http' 
        },
        this.protocolModel = {
            value: profile.Protocol,
            disabled: true
        });
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
    
};

ConnectionsAssistant.prototype.activate = function(event) {
    /* put in event handlers here that should only be in effect when this scene is active. For
       example, key handlers that are observing the document */
};


ConnectionsAssistant.prototype.deactivate = function(event) {
    /* remove any event handlers you added in activate and do any other cleanup that should happen before
       this scene is popped or another scene is pushed on top */
    Mojo.Event.stopListening(this.controller.get('testConnection'), Mojo.Event.tap, this.handleTestConnection.bind(this));
    this.applyConnectionSettings();
    refresh();
};

ConnectionsAssistant.prototype.cleanup = function(event) {
    /* this function should do any cleanup needed before the scene is destroyed as 
       a result of being popped off the scene stack */
};

ConnectionsAssistant.prototype.handleTestConnection = function (event) {
    event.stopPropagation();
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
};
ConnectionsAssistant.prototype.applyConnectionSettings = function() {
    profile.Host = this.hostModel.value;
    profile.Port = this.portModel.value;
    profile.Path = this.pathModel.value;
    profile.Protocol = this.protocolModel.value;
    profile.Username = this.usernameModel.value;
    profile.Password = this.passwordModel.value;
    profile.APIKey = this.apiKeyModel.value;
    profile.save();
    preferences.save();
    sabnzbd.closeConnection();
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
        Mojo.Controller.errorDialog("It might help to enter a host.");
    }
};

