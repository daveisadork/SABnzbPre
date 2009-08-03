function PreferencesAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}
PreferencesAssistant.prototype.setup = function () {
	/* this function is for setup tasks that have to happen when the scene is first created */
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	/* setup widgets here */
	/* add event handlers to listen to events from widgets */
	this.controller.setupWidget("hostname", this.attributes = {
		multiline: false,
		enterSubmits: false,
		textCase: Mojo.Widget.steModeLowerCase
	},
	this.hostModel = {
		value: config.host,
		disabled: false
	});
	this.controller.setupWidget("port", this.attributes = {
		multiline: false,
		enterSubmits: false
	},
	this.portModel = {
		value: config.port,
		disabled: false
	});
	this.controller.setupWidget("username", this.attributes = {
		multiline: false,
		enterSubmits: false,
		textCase: Mojo.Widget.steModeLowerCase
	},
	this.usernameModel = {
		value: config.username,
		disabled: false
	});
	this.controller.setupWidget("password", this.attributes = {
		multiline: false,
		enterSubmits: false
	},
	this.passwordModel = {
		value: config.password,
		disabled: false
	});
	this.controller.setupWidget("api_key", this.attributes = {
		multiline: false,
		enterSubmits: false,
		textCase: Mojo.Widget.steModeLowerCase
	},
	this.apiKeyModel = {
		value: config.api_key,
		disabled: false
	});
}
PreferencesAssistant.prototype.activate = function (event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}
PreferencesAssistant.prototype.deactivate = function (event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
	config.host = this.hostModel.value;
	config.port = this.portModel.value;
	config.username = this.usernameModel.value;
	config.password = this.passwordModel.value;
	config.api_key = this.apiKeyModel.value;
	prefsCookie.put({
		protocol: config.protocol,
		host: config.host,
		port: config.port,
		username: config.username,
		password: config.password,
		api_key: config.api_key,
		interval: config.interval,
		exists: config.exists
	});
}
PreferencesAssistant.prototype.cleanup = function (event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}