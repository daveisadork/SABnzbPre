var ConnectionProfile = Class.create({
    initialize: function(name) {
        this.Name = name;
        this.Protocol = "http";
        this.Host = "";
        this.Port = "8080";
        this.Path = "sabnzbd";
        this.Username = "";
        this.Password = "";
        this.APIKey = "";
        this.Cookie = new Mojo.Model.Cookie("SABnzbPre.ServerProfile." + this.name);
	//this.Cookie.remove();
	Mojo.Log.info("Looking for profile cookie:", this.Name);
        this.oldPrefs = this.Cookie.get();
        if (this.oldPrefs && this.oldPrefs.Name === this.Name) {
	    Mojo.Log.info("Cookie found, loading profile:", this.Name);
            this.Protocol = this.oldPrefs.Protocol;
            this.Host = this.oldPrefs.Host;
            this.Port = this.oldPrefs.Port;
            this.Path = this.oldPrefs.Path;
            this.Username = this.oldPrefs.Username;
            this.Password = this.oldPrefs.Password;
            this.APIKey = this.oldPrefs.APIKey;
        } else {
	    Mojo.Log.info("No cookie found, saving a new one.");
            this.save();
        }
    },
    
    save: function() {
        Mojo.Log.info("Saving profile: " + this.Name);
	var pre_slash = "";
	var post_slash = "";
	if (this.Path === "") {
            pre_slash = "/";
            post_slash = "";
        } else {
            if (this.Path.charAt(0) !== "/") {
                pre_slash = "/";
            } else {
		pre_slash = "";
	    }
            if (this.Path.charAt(this.Path.length - 1) !== "/") {
                post_slash = "/";
            } else {
		post_slash = "";
	    }
        }
	this.Path = pre_slash + this.Path + post_slash;
	this.Cookie.remove();
        this.Cookie.put({
            Name: this.Name,
            Protocol: this.Protocol,
            Host: this.Host,
            Port: this.Port,
            Path: this.Path,
            Username: this.Username,
            Password: this.Password,
            APIKey: this.APIKey
        });
    }
});

var Preferences = Class.create({
    initialize: function() {
        this.Profiles = ["Default"];
        this.ActiveProfile = 0;
        this.Version = [1, 0, 0];
        this.Interval = 5000;
        this.Configured = true;
        this.Cookie = new Mojo.Model.Cookie("SABnzbPre.Preferences");
        Mojo.Log.info("Looking for preferences cookie.");
        this.oldPrefs = this.Cookie.get();
        if (this.oldPrefs && this.oldPrefs.Configured === true) {
            Mojo.Log.info("Cookie found, loading preferences.");
            this.Profiles = this.oldPrefs.Profiles;
            this.ActiveProfile = this.oldPrefs.ActiveProfile;
            this.Version = this.oldPrefs.Version;
            this.Interval = this.oldPrefs.Interval;
            this.Configured = this.oldPrefs.Configured;
        } else {
	    Mojo.Log.info("No cookie found, saving a new one.");
            this.save();
        }
    },
    
    save: function() {
        Mojo.Log.info("Saving preferences.");
	this.Cookie.remove();
        this.Cookie.put({
            Profiles: this.Profiles,
            ActiveProfile: this.ActiveProfile,
            Version: this.Version,
            Interval: this.Interval,
            Configured: this.Configured
        });
    }
});

var Server = Class.create({
    initialize: function(profile) {
        this.BaseURL = profile.Protocol + "://" + profile.Host + ":" + profile.Port + profile.Path + "api";
        this.Connected = false;
	this.Error = false;
        this.queue = [];
        this.history = [];
        this.tasks = 0;
        this.taskList = [];
        this.taskProcessorIdle = true;
	this.Scripts = [{label: $L('Default'), value: "default"}];
	this.Categories = [{label: $L('Default'), value: "default"}];
	this.speedLimit = "";
	this.lastRequest = null;
	this.ServerConfig = null;
	this.timeout = null;
    },
    
    genAuthStr: function() {
        auth = "";
	if (profile.Username !== "" && profile.Password !== "") {
		auth = auth + "&ma_username=" + profile.Username + "&ma_password=" + profile.Password;
	}
	if (profile.APIKey !== "") {
		auth = auth + "&apikey=" + profile.APIKey;
	}
        return auth;
    },
    
    getQueue: function(widget) {
	this.addTask({
	    parameters: {
		mode: 'queue'
	    },
	    widget: widget,
	    urgent: true
	});
    },
    
    getHistory: function(widget) {
	widget = widget || false;
	this.addTask({
	    parameters: {
		mode: 'history'
	    },
	    widget: widget,
	    urgent: true
	});
    },
    
    authenticate: function(parameters) {
	parameters.output = 'json';
	parameters.ma_username = profile.Username;
	parameters.ma_password = profile.Password;
	parameters.apikey = profile.APIKey;
	return parameters;
    },

    doRequest: function (task) {
	if (profile.Host !== "") {
	    task.parameters = this.authenticate(task.parameters);
	    request = new Ajax.Request(this.BaseURL, {
		method: 'get',
		parameters: task.parameters,
		//evalJSON: 'true',
		requestHeaders: {Accept: 'application/json'},
		onSuccess: function (transport) {
		    clearTimeout(this.timeout);
		    Mojo.Log.error("********Response Headers:", transport.getAllResponseHeaders());
		    this.finalizeRequest(task, transport);
		}.bind(this),
		onCreate: function (instance) {
		    Mojo.Log.error("Request created:", task.parameters.mode);
		    timeoutObject = setTimeout(this.onTimeout, 10000, instance, task);
		},
		onFailure: function (transport) {
		    clearTimeout(timeoutObject);
		    this.Connected = false;
		    this.Error = true;
		    //Mojo.Controller.errorDialog("The server reported error " + transport.status + ".");
		    $('warning-text').update("The server reported error " + transport.status + ".");
		    $('warning-icon').setStyle({
			backgroundImage : "url('images/error-22.png')"
		    });
		    warningsDrawer.mojo.setOpenState(true);
		    Mojo.Log.error(transport.status);
		    Mojo.Log.error("Callback:", task.callback);
		    if (task.callback) {
			Mojo.Log.error("Callback:", task.callback);
			eval(task.callback);
		    }
		    this.purgeTasks();
		}.bind(this),
		onException: function (instance, exception) {
		    clearTimeout(timeoutObject);
		    this.Connected = false;
		    this.Error = true;
		    //Mojo.Controller.errorDialog("There was a problem connecting to the specified host.");
		    //Mojo.Controller.errorDialog(exception)
		    $('warning-icon').setStyle({
			backgroundImage: "url('images/error-22.png')"
		    });
		    $('warning-text').update("Can't communicate with the host.");
		    warningsDrawer.mojo.setOpenState(true);
		    Mojo.Log.error(exception);
		    if (task.callback) {
			Mojo.Log.error("Callback:", task.callback);
			eval(task.callback);
		    }
		    this.purgeTasks();
		    //this.finalizeTask();
		}.bind(this),
		onTimeout: function(instance, task) {
		    Mojo.Log.error("Timeout reached!!!!!!");
		    Mojo.Log.error("Timeout status:", instance.transport.readyState);
		    if (instance.transport.readyState !== 4) {
			instance.transport.abort();
			this.Connected = false;
			this.Error = true;
			//Mojo.Controller.errorDialog("The specified host is taking too long to respond or could not be found.");
			$('warning-text').update("The host is taking too long to respond.");
			$('warning-icon').setStyle({
			    backgroundImage : "url('images/error-22.png')"
			});
			warningsDrawer.mojo.setOpenState(true);
			Mojo.Log.error("Timeout reached, OUCH!");
			Mojo.Log.error("Callback:", task.callback);
			if (task.callback) {
			    Mojo.Log.info("Callback:", task.callback);
			    eval(task.callback);
			}
			this.purgeTasks();
			this.finalizeTask();
		    }
		}.bind(this),
		onComplete: function() {
		    clearTimeout(timeoutObject);
		    Mojo.Log.error("Request complete!!!!!!!!!!!!!!!!!!");
		    if (task.callback) {
			Mojo.Log.error("Callback:", task.callback);
			eval(task.callback);
		    }
		    this.finalizeTask();
		}.bind(this)
	    });
	} else {
	    this.Connected = false;
	    this.Error = false;
	    if (task.callback) {
		Mojo.Log.info("Callback:", task.callback);
		eval(task.callback);
	    }
	    this.finalizeTask();
	}
    },

    buildURL: function(mode) {
        return this.BaseURL + mode + this.AuthString + "&output=json";
    },

    finalizeRequest: function(task, transport) {
	if (transport.responseText === "ok") {
	    this.Connected = true;
	    this.Error = false;
	    warningsDrawer.mojo.setOpenState(false);
	} else if (!transport.responseJSON.status && transport.responseJSON.error) {
	    this.Connected = false;
	    this.Error = true;
	    //Mojo.Controller.errorDialog(transport.responseJSON.error);
	    $('warning-icon').setStyle({
		backgroundImage: "url('images/error-22.png')"
	    });
	    $('warning-text').update(transport.responseJSON.error);
	    warningsDrawer.mojo.setOpenState(true);
	    if (task.callback) {
		Mojo.Log.error("Callback:", task.callback);
		eval(task.callback);
	    }
	} else if (transport.responseJSON[task.parameters.mode]) {
	    this.Connected = true;
	    this.Error = false;
	    this.lastRequest = transport.responseJSON[task.parameters.mode];
	    Mojo.Log.info("Updating header:", this.lastRequest.status, this.lastRequest.speed);
	    $('speed').update(this.lastRequest.speed);
	    $('status').update(this.lastRequest.status);
	    $('pause-int').update(this.lastRequest.pause_int);
	    if (this.lastRequest.paused && this.lastRequest.pause_int !== "0") {
		$('paused-for').show()
	    } else {
		$('paused-for').hide()
	    }
	    if (task.widget) {
		this[task.parameters.mode] = this.lastRequest.slots;
		Mojo.Log.info("Updating widget:", task.widget.id);
		task.widget.mojo.setLengthAndInvalidate(this.lastRequest.noofslots);
	    }
	    if (this.lastRequest.categories && this.lastRequest.scripts) {
		this.Scripts = [{label: $L('Default'), value: "default"}];
		this.Categories = [{label: $L('Default'), value: "default"}];
		if (this.lastRequest.categories.length !== 0) {
		    this.lastRequest.categories.forEach(this.appendCategory.bind(this));
		}
		if (this.lastRequest.scripts.length !== 0) {
		    this.lastRequest.scripts.forEach(this.appendScript.bind(this));
		}
	    }
	    warningsDrawer.mojo.setOpenState(false);
	} else if (task.parameters.mode === 'get_config') {
	    this.Connected = true;
	    this.Error = false;
	    this.ServerConfig = transport.responseJSON.config;
	    Mojo.Log.info("GOT CONFIGS!!!!!")
	    warningsDrawer.mojo.setOpenState(false);
	}
    },
    
    appendCategory: function(name) {
	this.Categories.push({label: $L(name), value: name});
    },
    
    appendScript: function(name) {
	this.Scripts.push({label: $L(name), value: name});
    },
    
    getQueueRange: function(widget, offset, limit) {
	this.listUpdate(widget, offset, limit, "queue");
    },
    
    getHistoryRange: function(widget, offset, limit) {
	this.listUpdate(widget, offset, limit, "history");
    },

    listUpdate: function (widget, offset, limit, mode) {
	Mojo.Log.info("Updating list:", offset, limit, mode);
	if (!this.Connected) {
	    this.addTask({
		parameters: {
		    mode: mode
		},
		urgent: true,
		widget: widget
		//callback: "this.listUpdate(task.widget" + ", " + offset + ", " + limit + ", " + mode + ")"
	    });
	} else {
	    var requestedItems = [];
	    for (var index = offset; index <= (offset + limit); index++) {
		if (this[mode][index]) {
		    requestedItems.push(this[mode][index]);
		}
	    }
	    widget.mojo.noticeUpdatedItems(offset, requestedItems);
	}
    },

    addTask: function(task) {
	this.tasks += 1;
        if (task.urgent) {
            this.taskList.push(task);
        } else {
            this.taskList.unshift(task);
        }
	if (this.tasks === 1) {
	    this.doNextTask();
	}
    },

    doNextTask: function() {
        if (this.tasks > 0 && this.taskProcessorIdle) {
	    this.taskProcessorIdle = false;
            this.doRequest(this.taskList.shift());
        }
    },

    purgeTasks: function() {
	while (this.taskList.length > 0) {
	    Mojo.Log.info("Purging:", this.taskList.shift());
	}
	this.tasks = 1;
    },

    finalizeTask: function() {
        this.tasks -= 1;
        this.taskProcessorIdle = true;
	Mojo.Log.info("Task completed, remaining:", this.tasks);
        this.doNextTask();
    },
    
    closeConnection: function() {
	this.Connected = false;
        this.initialize(profile);
	this.getConfig();
    },
    
    toggleStatus: function() {
	if (this.Connected) {
	    if (this.lastRequest.status === "Downloading" || this.lastRequest.status === "Idle") {
		this.pause();
	    } else if (this.lastRequest.status === "Paused") {
		this.resume();
	    }
	}
    },
    
    pause: function() {
	this.addTask({
	    parameters: {
		mode: 'pause'
	    },
	    urgent: true,
	    callback: "refresh()"
	});
    },
    
    resume: function() {
	this.addTask({
	    parameters: {
		mode: 'resume'
	    },
	    urgent: true,
	    callback: "refresh()"
	});
    },
    
    deleteFromQueue: function(nzo_id) {
	this.addTask({
	    parameters: {
		mode: 'queue',
		name: 'delete',
		value: nzo_id
	    },
	    urgent: true,
	    callback: "refresh()"
	});
    },
    
    deleteFromHistory: function(nzo_id) {
	this.addTask({
	    parameters: {
		mode: 'history',
		name: 'delete',
		value: nzo_id
	    },
	    urgent: true,
	    callback: "refresh()"
	});
    },
    
    clearHistory: function() {
	
    },
    
    moveItem: function(nzo_id, index) {
	this.addTask({
	    parameters: {
		mode: 'switch',
		value: nzo_id,
		value2: index
	    },
	    urgent: true,
	    callback: "refresh()"
	});
    },
    
    enqueueNzbUrl: function(nzbUrl, category, processing, script, priority) {
	this.addTask({
	    parameters: {
		mode: 'addid',
		name: nzbUrl,
		cat: category,
		pp: processing,
		script: script,
		priority: priority
	    },
	    urgent: true,
	    callback: "addNzbCallback()"
	});
    },
    
    getScripts: function() {
	this.addTask({
	    parameters: {
		mode: 'get_scripts'
	    }
	});
    },
    
    getCategories: function() {
	this.addTask({
	    parameters: {
		mode: 'get_cats'
	    }
	});
    },
    
    getVersion: function() {
	this.addTask({
	    parameters: {
		mode: 'version'
	    },
	    callback: 'Mojo.Log.info("Connected to SABnzbd+ v" + data[0])'
	});
    },
    
    testConnection: function (callback) {
	this.addTask({
	    parameters: {
		mode: 'queue'
	    },
	    callback: callback
	});
    },
    
    setSpeedLimit: function (speedlimit) {
	this.addTask({
	    parameters: {
		mode: 'config',
		name: 'speedlimit',
		value: speedlimit
	    },
	    callback: "refresh()"
	});
    },
    
    pauseFor: function (pauseMinutes) {
	pauseSeconds = pauseMinutes * 60;
	this.addTask({
	    parameters: {
		mode: 'config',
		name: 'set_pause',
		value: pauseSeconds
	    },
	    callback: "refresh()"
	});
    },

    getConfig: function() {
	this.addTask({
	    parameters: {
		mode: 'get_config'
	    }
	});
    },

    pauseItem: function(nzo_id) {
	this.addTask({
	    parameters: {
		mode: 'queue',
		name: 'pause',
		value: nzo_id
	    },
	    callback: "refresh()"
	});
    },
    
    resumeItem: function(nzo_id) {
	this.addTask({
	    parameters: {
		mode: 'queue',
		name: 'resume',
		value: nzo_id
	    },
	    callback: "refresh()"
	});
    },

    dummy: function() {
	
    }
});