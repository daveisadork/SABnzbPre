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
        this.Cookie = new Mojo.Model.Cookie("SABnzbPre.ServerProfile.#{name}".interpolate({name: this.Name}));
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
	this.Cookie.remove();
        //Mojo.Log.info("Saving profile: " + this.Name);
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
	
	this.Path = "#{pre}#{path}#{post}".interpolate({
	    pre: pre_slash,
	    path: this.Path,
	    post: post_slash});
	this.Cookie = new Mojo.Model.Cookie("SABnzbPre.ServerProfile.#{name}".interpolate({name: this.Name}));
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
        this.Profiles = [$L("Default")];
        this.ActiveProfile = 0;
        this.Version = [0, 2, 4];
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
        this.BaseURL = "#{Protocol}://#{Host}:#{Port}#{Path}api".interpolate(profile);
        this.Connected = false;
	this.Error = false;
        this.queue = [];
        this.history = [];
        this.tasks = 0;
        this.taskList = [];
	this.currentTask = null;
        this.taskProcessorIdle = true;
	this.Scripts = [];
	this.Categories = [];
	this.speedLimit = "";
	this.lastRequest = null;
	this.ServerConfig = null;
	this.timeoutObject = null;
	this.currentRequest = null;
	this.queueHistoryScene = undefined;
	this.finishAction = "";
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

    doRequest: function () {
	if (profile.Host !== "") {
	    this.currentTask.parameters = this.authenticate(this.currentTask.parameters);
	    request = new Ajax.Request(this.BaseURL, {
		method: 'get',
		parameters: this.currentTask.parameters,
		//evalJSON: 'true',
		requestHeaders: {Accept: 'application/json'},
		onCreate: this.requestCreate.bind(this),
		onSuccess: this.requestSuccess.bind(this),
		onFailure: this.requestFailure.bind(this),
		onException: this.requestException.bind(this),
		onTimeout: this.requestTimeout.bind(this),
		onComplete: this.requestComplete.bind(this)
	    });
	} else {
	    this.Connected = false;
	    this.Error = false;
	    this.requestComplete();
	}
    },

    requestCreate: function(instance) {
	//Mojo.Log.info("*************App controller:", Mojo.Controller.getAppController.getActiveStageController())
	if (this.queueHistoryScene) {
	    this.queueHistoryScene.commandMenuModel.items.pop(this.queueHistoryScene.refreshModel);
	    this.queueHistoryScene.commandMenuModel.items.push(this.queueHistoryScene.workingModel);
	    this.queueHistoryScene.controller.modelChanged(this.queueHistoryScene.commandMenuModel);
	}
    	Mojo.Log.info("*****Request created*****", this.currentTask.parameters.mode);
	this.currentRequest = instance;
	this.timeoutObject = setTimeout(this.requestTimeout.bind(this), 10000, instance);
    },
    
    requestFailure: function(transport) {
	clearTimeout(this.timeoutObject);
	this.Connected = false;
	this.Error = true;
	//Mojo.Controller.errorDialog("The server reported error " + transport.status + ".");
	try {
	    var errorText = $L("The server reported error #{status}.").interpolate(transport);
	    $('error-text').update(errorText);
	    $('error-icon').setStyle({
		backgroundImage : "url('images/error-22.png')"
	    });
	}
	catch (err) {
	    Mojo.Log.error(err);
	}
	errorsDrawer.mojo.setOpenState(true);
	Mojo.Log.error("*****Request Error*****", transport.status);
	this.purgeTasks();
    },
    
    requestException: function(instance, exception) {
	clearTimeout(this.timeoutObject);
	this.Connected = false;
	this.Error = true;
	//Mojo.Controller.errorDialog("There was a problem connecting to the specified host.");
	//Mojo.Controller.errorDialog(exception)
	try {
	    var errorText = $L("Can't communicate with the host.");
	    $('error-icon').setStyle({
		backgroundImage: "url('images/error-22.png')"
	    });
	    $('error-text').update(errorText);
	}
	catch (err) {
	    Mojo.Log.error(err);
	}
	errorsDrawer.mojo.setOpenState(true);
	Mojo.Log.error("*****Request Exception*****", exception);
	this.purgeTasks();
	//this.requestComplete();
    },
    
    requestTimeout: function(instance) {
	Mojo.Log.info("Timeout status:", instance.transport.readyState);
	if (instance.transport.readyState !== 4) {
	    instance.transport.abort();
	    this.Connected = false;
	    this.Error = true;
	    //Mojo.Controller.errorDialog("The specified host is taking too long to respond or could not be found.");
	    var errorText = $L("The host is taking too long to respond.");
	    $('error-text').update(errorText);
	    $('error-icon').setStyle({
		backgroundImage : "url('images/error-22.png')"
	    });
	    errorsDrawer.mojo.setOpenState(true);
	    Mojo.Log.error("*****Request Timed Out*****");
	    this.purgeTasks();
	    this.requestComplete();
	}
    },
    
    requestSuccess: function(transport) {
	clearTimeout(this.timeoutObject);
	Mojo.Log.info("*****Request Sucess*****");
	this.finalizeRequest(transport);
    },
    
    requestComplete: function() {
	//clearTimeout(timeoutObject);
	Mojo.Log.info("*****Request Complete*****");
	if (this.currentTask.callback) {
	    Mojo.Log.info("Callback:", this.currentTask.callback);
	    eval(this.currentTask.callback);
	}
	this.finalizeTask();
	if (this.queueHistoryScene) {
	    this.queueHistoryScene.commandMenuModel.items.pop(this.queueHistoryScene.workingModel);
	    this.queueHistoryScene.commandMenuModel.items.push(this.queueHistoryScene.refreshModel);
	    this.queueHistoryScene.controller.modelChanged(this.queueHistoryScene.commandMenuModel);
	}
    },

    finalizeRequest: function(transport) {
	if (transport.responseText === "ok") {
	    this.Connected = true;
	    this.Error = false;
	    errorsDrawer.mojo.setOpenState(false);
	} else if (!transport.responseJSON.status && transport.responseJSON.error) {
	    this.Connected = false;
	    this.Error = true;
	    $('error-icon').setStyle({
		backgroundImage: "url('images/error-22.png')"
	    });
	    $('error-text').update(transport.responseJSON.error);
	    errorsDrawer.mojo.setOpenState(true);
	} else if (transport.responseJSON[this.currentTask.parameters.mode]) {
	    this.Connected = true;
	    this.Error = false;
	    this.lastRequest = transport.responseJSON[this.currentTask.parameters.mode];
	    Mojo.Log.info("Updating header:", this.lastRequest.status, this.lastRequest.speed);
	    $('speed').update(this.lastRequest.speed);
	    $('status').update($L(this.lastRequest.status));
	    $('pause-int').update(this.lastRequest.pause_int);
	    if (this.lastRequest.paused && this.lastRequest.pause_int !== "0") {
		$('paused-for').show();
	    } else {
		$('paused-for').hide();
	    }
	    if (this.currentTask.widget) {
		this[this.currentTask.parameters.mode] = this.lastRequest.slots;
		Mojo.Log.info("Updating widget:", this.currentTask.widget.id);
		this.currentTask.widget.mojo.setLength(this.lastRequest.noofslots);
	    }
	    if (this.lastRequest.categories && this.lastRequest.scripts) {
		this.Scripts = [];
		this.Categories = [];
		if (this.lastRequest.categories.length !== 0) {
		    this.lastRequest.categories.forEach(this.appendCategory.bind(this));
		}
		if (this.lastRequest.scripts.length !== 0) {
		    this.lastRequest.scripts.forEach(this.appendScript.bind(this));
		}
	    }
	    if (this.lastRequest.finishaction === null || this.lastRequest.finishaction === "") {
		this.finishAction = ""
	    } else if (this.lastRequest.finishaction) {
		this.finishAction = this.lastRequest.finishaction
	    }
	    errorsDrawer.mojo.setOpenState(false);
	} else if (this.currentTask.parameters.mode === 'get_config') {
	    this.Connected = true;
	    this.Error = false;
	    this.ServerConfig = transport.responseJSON.config;
	    Mojo.Log.info("GOT CONFIGS!!!!!");
	    errorsDrawer.mojo.setOpenState(false);
	}
    },
    
    appendCategory: function(name) {
	this.Categories.push({label: $L(name), value: name});
    },
    
    appendScript: function(name) {
	this.Scripts.push({label: $L(name), value: name});
    },
    
    getQueueRange: function(widget, offset, limit) {
	this.addTask({
	    parameters: {
		mode: 'queue',
		start: offset,
		limit: limit
	    },
	    urgent: true,
	    widget: widget,
	    callback: "this.currentTask.widget.mojo.noticeUpdatedItems(#{offset}, this.queue)".interpolate({offset: offset})
	});
	widget = null;
    },
    
    getHistoryRange: function(widget, offset, limit) {
	this.addTask({
	    parameters: {
		mode: 'history',
		start: offset,
		limit: limit
	    },
	    urgent: true,
	    widget: widget,
	    callback: "this.currentTask.widget.mojo.noticeUpdatedItems(#{offset}, this.history)".interpolate({offset: offset})
	});
	widget = null;
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
		//callback: "this.listUpdate(this.currentTask.widget" + ", " + offset + ", " + limit + ", " + mode + ")"
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
	widget = null;
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
	    this.currentTask = this.taskList.shift();
            this.doRequest();
        }
    },

    purgeTasks: function() {
	while (this.taskList.length > 0) {
	    Mojo.Log.info("Purging:", this.taskList.shift());
	}
	this.tasks = 1;
    },

    finalizeTask: function() {
	this.currentRequest = null;
        this.tasks -= 1;
        this.taskProcessorIdle = true;
	Mojo.Log.info("Task completed, remaining:", this.tasks);
        this.doNextTask();
    },
    
    closeConnection: function() {
	if (!this.taskProcessorIdle) {
	    this.currentRequest.transport.abort();
	}
        this.Connected = false;
	this.Error = false;
        this.queue = [];
        this.history = [];
        this.tasks = 0;
        this.taskList = [];
	this.currentTask = null;
        this.taskProcessorIdle = true;
	this.Scripts = [{label: $L('Default'), value: "default"}];
	this.Categories = [{label: $L('Default'), value: "default"}];
	this.speedLimit = "";
	this.lastRequest = null;
	this.ServerConfig = null;
	this.timeoutObject = null;
	this.currentRequest = null;
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
	var parameters = {
	    mode: 'addid',
	    name: nzbUrl
	};
	if (category !== "default") {
	    parameters.cat = category;
	}
	if (processing !== "default") {
	    parameters.pp = processing;
	}
	if (script !== "default") {
	    parameters.script = script;
	}
	if (priority !== "default") {
	    parameters.priority = priority;
	}
	this.addTask({
	    parameters: parameters,
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
	    callback: 'Mojo.Log.info("Connected to SABnzbd+ v#{0}".interpolate(data))'
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
	this.addTask({
	    parameters: {
		mode: 'config',
		name: 'set_pause',
		value: pauseMinutes
	    },
	    callback: "refresh()"
	});
    },

    getConfig: function(controller, callback) {
	this.addTask({
	    parameters: {
		mode: 'get_config'
	    },
	    callback: callback,
	    controller: controller
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

    setCompleteAction: function(action) {
	this.addTask({
	    parameters: {
		mode: 'queue',
		name: 'change_complete_action',
		value: action
	    },
	    callback: "refresh()"
	});
    },

	getBookmarks: function(callback) {
	this.addTask({
	    parameters: {
		mode: 'newzbin',
		name: 'get_bookmarks'
	    },
	    callback: callback
	});
    },

    dummy: function() {
	
    }
});