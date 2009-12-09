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
        this.BaseURL = profile.Protocol + "://" + profile.Host + ":" + profile.Port + profile.Path + "api?mode=";
        this.AuthString = this.genAuthStr();
        this.Connected = false;
	this.Error = false;
        this.queue = [];
        this.history = [];
        this.tasks = 0;
        this.taskList = [];
        this.taskProcessorIdle = true;
	this.Scripts = this.Categories = [{label: $L('Default'), value: "default"}];
	this.speedLimit = "";
	this.lastRequest = null;
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
        //this.addTask("queue", true, false);
	widget = widget || false;
	this.addTask({
	    'mode': 'queue',
	    'widget': widget,
	    'urgent': true
	});
    },
    
    getHistory: function(widget) {
        //this.addTask("history", true, false);
	widget = widget || false;
	this.addTask({
	    'mode': 'history',
	    'widget': widget,
	    'urgent': true
	});
    },

    doRequest: function (task) {
	if (profile.Host !== "") {
	    Mojo.Log.info("Requesting: " + this.buildURL(task.mode));
	    request = new Ajax.Request(this.buildURL(task.mode), {
		method: 'get',
		evalJSON: 'true',
		requestHeaders: {Accept: 'application/json'},
		onSuccess: function (transport) {
		    clearTimeout(this.timeout);
		    Mojo.Log.error("Status:", transport.getAllResponseHeaders());
		    //this.finalizeTask();
		    this.finalizeRequest(task, transport);
		}.bind(this),
		onCreate: function (instance) {
		    Mojo.Log.error("request created");
		    //Mojo.Log.error(xhr.readyState);
		    timeoutObject = setTimeout(this.onTimeout, 10000, instance);
		},
		onFailure: function (transport) {
		    this.Connected = false;
		    this.Error = true;
		    Mojo.Controller.errorDialog("The server reported error " + transport.status + ".");
		    Mojo.Log.error(transport.status);
		    this.purgeTasks();
		}.bind(this),
		onException: function (instance, exception) {
		    this.Connected = false;
		    this.Error = true;
		    Mojo.Controller.errorDialog("There was a problem connecting to the specified host.");
		    //Mojo.Controller.errorDialog(exception)
		    Mojo.Log.error(exception);
		    this.purgeTasks();
		}.bind(this),
		onTimeout: function(instance) {
		    Mojo.Log.error("Timeout reached!!!!!!");
		    Mojo.Log.error("Timeout status:", instance.transport.readyState);
		    if (instance.transport.readyState !== 4) {
			instance.transport.abort();
			this.Connected = false;
			this.Error = true;
			Mojo.Controller.errorDialog("The specified host is taking too long to respond or could not be found.");
			Mojo.Log.error("Timeout reached, OUCH!");
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
	} else if (!transport.responseJSON.status && transport.responseJSON.error) {
	    this.Connected = false;
	    this.Error = true;
	    Mojo.Controller.errorDialog(transport.responseJSON.error);
	} else {
	    this.Connected = true;
	    this.Error = false;
	    if (transport.responseJSON[task.mode]) {
		this.lastRequest = transport.responseJSON[task.mode];
		Mojo.Log.info("Updating header:", this.lastRequest.status, this.lastRequest.speed);
		$('speed').update(this.lastRequest.speed);
		$('status').update(this.lastRequest.status);
		if (task.widget) {
		    this[task.mode] = this.lastRequest.slots;
		    Mojo.Log.info("Updating widget:", task.widget.id);
		    task.widget.mojo.setLengthAndInvalidate(this.lastRequest.noofslots);
		}
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
	    //widget.mojo.noticeUpdatedItems(0, []);
	    this.addTask({
		'mode': mode,
		'urgent': true,
		'widget': widget
		//'callback': "this.listUpdate(task.widget" + ", " + offset + ", " + limit + ", " + mode + ")"
	    });
	} else {
	    var requestedItems = [];
	    for (var index = offset; index <= (offset + limit); index++) {
		if (this[mode][index]) {
		    //Mojo.Log.info("requestItems[" + (index-offset) + "] = " + this[mode][index].name);
		    requestedItems.push(this[mode][index]);
		}
	    }
	    //Mojo.Log.info("updating " + mode + " list: " + requestedItems[offset].name);
	    widget.mojo.noticeUpdatedItems(offset, requestedItems);
	}
    },

    addTask: function(task) {
	this.tasks += 1;
	var defaultTask = {
	    'mode': false,
	    'urgent': false,
	    'widget': false,
	    'callback': false
	};
	for (var index in defaultTask) {
	    if (typeof task[index] === "undefined") {
		task[index] = task[index] || defaultTask[index];
	    }
	}
        if (task.urgent) {
            this.taskList.push(task);
        } else {
            this.taskList.unshift(task);
        }
	Mojo.Log.info("Task added: {mode:", task.mode + ", urgent:", task.urgent + ", widget:", task.widget.id + ", callback:", task.callback +"}");
        this.doNextTask();
    },

    doNextTask: function() {
        if (this.tasks > 0 && this.taskProcessorIdle) {
	    Mojo.Log.info("Processing task: {mode:", this.taskList[0].mode + ", urgent:", this.taskList[0].urgent + ", widget:", this.taskList[0].widget.id + ", callback:", this.taskList[0].callback +"}");
	    this.taskProcessorIdle = false;
            this.doRequest(this.taskList.shift());
	    //Mojo.Controller.errorDialog(this.taskList.shift())
        }
    },

    purgeTasks: function() {
	this.taskQueue = [];
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
        this.BaseURL = profile.Protocol + "://" + profile.Host + ":" + profile.Port + profile.Path + "api?mode=";
        this.AuthString = this.genAuthStr();
    },
    
    toggleStatus: function() {
	Mojo.Log.info("TOGGLE!!!!!!!!!!!!!!");
	if (this.Connected) {
	    if (this.lastRequest.status === "Downloading" || this.lastRequest.status === "Idle") {
		this.pause();
	    } else if (this.lastRequest.status === "Paused") {
		this.resume();
	    }
	}
    },
    
    pause: function() {
	//this.addTask("pause", true, false);
	Mojo.Log.info("PAUSE!!!!!!!!!!!!!!");
	this.addTask({
	    'mode': 'pause',
	    'urgent': true,
	    'callback': "refresh()"
	});
    },
    
    resume: function() {
	Mojo.Log.info("RESUME!!!!!!!!!!!!!!");
	//this.addTask("resume", true, false);
	this.addTask({
	    'mode': 'resume',
	    'urgent': true,
	    'callback': "refresh()"
	});
    },
    
    deleteFromQueue: function(event) {
	//this.addTask("queue&name=delete&value=" + this.queue[event.index].nzo_id + "&", true, false);
	this.addTask({
	    'mode': "queue&name=delete&value=" + this.queue[event.index].nzo_id + "&",
	    'urgent': true,
	    'callback': "refresh()"
	});
    },
    
    deleteFromHistory: function(event) {
	//this.addTask("history&name=delete&value=" + this.history[event.index].nzo_id + "&", true, false);
	this.addTask({
	    'mode': "history&name=delete&value=" + this.history[event.index].nzo_id + "&",
	    'urgent': true,
	    'callback': "refresh()"
	});
    },
    
    clearHistory: function() {
	
    },
    
    moveItem: function(event) {
	//this.addTask("switch&value=" + this.queue[event.fromIndex].nzo_id + "&" + "value2=" + event.toIndex, true, false);
	this.addTask({
	    'mode': "switch&value=" + this.queue[event.fromIndex].nzo_id + "&" + "value2=" + event.toIndex,
	    'urgent': true,
	    'callback': "refresh()"
	});
    },
    
    enqueueNzbUrl: function(nzbUrl, category, processing, script, priority) {
	var options = "";
	if (category !== "Default") {
	    options = options + "&cat=" + category;
	}
	if (processing !== "Default") {
	    options = options + "&pp=" + processing;
	}
	if (script !== "Default") {
	    options = options + "&script=" + script;
	}
	if (priority !== "Default") {
	    options = options + "&priority=" + priority;
	}
	//this.addTask("addid&name=" + nzbUrl + options, true, false);
	this.addTask({
	    'mode': "addid&name=" + nzbUrl + options,
	    'urgent': true,
	    'callback': "addNzbCallback();"
	});
    },
    
    getScripts: function() {
	this.addTask({
	    'mode': "get_scripts"
	});
    },
    
    getCategories: function() {
	this.addTask({
	    'mode': "get_cats"
	});
    },
    
    getVersion: function() {
	this.addTask({
	    'mode': 'version',
	    'callback': 'Mojo.Log.info("Connected to SABnzbd+ v" + data[0])'
	});
    },
    
    testConnection: function (callback) {
	this.addTask({
	    'mode': 'queue',
	    'callback': callback
	});
    },
    
    dummy: function() {
	
    }
});