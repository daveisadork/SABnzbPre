var config = {
	protocol: "http",
	host: "",
	port: "",
	username: "",
	password: "",
	api_key: "",
	interval: 5000,
	exists: 1
};
prefsCookie = new Mojo.Model.Cookie("Prefs");
var oldPrefs = prefsCookie.get();
if (oldPrefs) {
	if (oldPrefs.exists == 1) {
		config.protocol = oldPrefs.protocol;
		config.host = oldPrefs.host;
		config.port = oldPrefs.port;
		config.username = oldPrefs.username;
		config.password = oldPrefs.password;
		config.api_key = oldPrefs.api_key;
		config.interval = oldPrefs.interval;
		config.exists = oldPrefs.exists;
	} else {
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
}
function authString() {
	var auth = "";
	if (config.username !== "" && config.password !== "") {
		auth = auth + "&ma_username=" + config.username + "&ma_password=" + config.password;
	}
	if (config.api_key !== "") {
		auth = auth + "&apikey=" + config.api_key;
	}
	return auth;
}
function url(mode) {
	return config.protocol + "://" + config.host + ":" + config.port + "/sabnzbd/api?mode=" + mode + "&output=json" + authString();
}
function updateDisplay(mode, json) {
	if (mode == 'queue') {
		$('status').update(json.queue.status);
		$('speed').update(json.queue.speed);
		queueList.mojo.noticeRemovedItems(0, json.queue.slots.length);
		queueList.mojo.noticeUpdatedItems(0, json.queue.slots);
	}
	if (mode == 'history') {
		$('status').update(json.history.status);
		$('speed').update(json.history.speed);
		historyList.mojo.noticeRemovedItems(0, json.history.slots.length);
		historyList.mojo.noticeUpdatedItems(0, json.history.slots);
	}
}
function updateData(mode) {
	new Ajax.Request(url(mode), {
		method: 'get',
		requestHeaders: {
			Accept: 'application/json'
		},
		onSuccess: function (transport) {
			var json = transport.responseText.evalJSON(true);
			if (json.status !== false) {
				updateDisplay(mode, json)
			} else { if (!json.status) {
					Mojo.Controller.errorDialog(json.error)
				}
			}
		},
		onFailure: function (transport) {
			Mojo.Controller.errorDialog("We're getting an error " + transport.status + ". Make sure your settings are correct and try again.");
		},
		onException: function (instance, exception) {
			Mojo.Controller.errorDialog("We're having trouble connecting to the server. Please make sure your settings are all correct.")
		}
	});
}
deleteQueueItem = function (event) {
	new Ajax.Request(url('queue') + "&name=delete&value=" + event.item.nzo_id, {
		method: 'get',
		onSuccess: function (transport) {
			if (transport.responseText.evalJSON(true).status == true) {
				updateData('queue');
			} else {
				Mojo.Controller.errorDialog("Something went wrong. Try again.")
			}
		},
		onFailure: function (transport) {
			Mojo.Controller.errorDialog("We're getting an error " + transport.status + ". Make sure your settings are correct and try again.");
		},
		onException: function (instance, exception) {
			Mojo.Controller.errorDialog("We're having trouble connecting to the server. Please make sure your settings are all correct.")
		}
	});
};
moveQueueItem = function (event) {
	new Ajax.Request(url('switch') + "&value=" + event.item.nzo_id + "&value2=" + event.toIndex, {
		method: 'get',
		onSuccess: function (transport) {
			updateData('queue');
		},
		onFailure: function (transport) {
			Mojo.Controller.errorDialog("We're getting an error " + transport.status + ". Make sure your settings are correct and try again.");
		},
		onException: function (instance, exception) {
			Mojo.Controller.errorDialog("We're having trouble connecting to the server. Please make sure your settings are all correct.")
		}
	});
};
deleteHistoryItem = function (event) {
	new Ajax.Request(url('history') + "&name=delete&value=" + event.item.nzo_id, {
		method: 'get',
		onSuccess: function (transport) {
			if (transport.responseText.evalJSON(true).status == true) {
				updateData('history');
			} else {
				Mojo.Controller.errorDialog("Something went wrong. Try again.")
			}
		},
		onFailure: function (transport) {
			Mojo.Controller.errorDialog("We're getting an error " + transport.status + ". Make sure your settings are correct and try again.");
		},
		onException: function (instance, exception) {
			Mojo.Controller.errorDialog("We're having trouble connecting to the server. Please make sure your settings are all correct.")
		}
	});
};
showQueue = function () {
	$('historyList').style.display = 'none';
	$('queueList').style.display = 'block';
	updateData('queue');
};
showHistory = function () {
	$('queueList').style.display = 'none';
	$('historyList').style.display = 'block';
	updateData('history');
};
function refresh() {
	if ($('queueList').style.display == 'block' && $('historyList').style.display == 'none') {
		updateData('queue');
	}
	if ($('historyList').style.display == 'block' && $('queueList').style.display == 'none') {
		updateData('history');
	}
};
function toggleStatus() {
	if ($('status').innerHTML == 'Downloading') {
		new Ajax.Request(url('pause'), {
			method: 'get',
			onSuccess: function (transport) {
				if (transport.responseText.evalJSON(true).status == true) {
					refresh();
				} else {
					Mojo.Controller.errorDialog("Something went wrong. Try again.")
				}
			},
			onFailure: function (transport) {
				Mojo.Controller.errorDialog("We're getting an error " + transport.status + ". Make sure your settings are correct and try again.");
			},
			onException: function (instance, exception) {
				Mojo.Controller.errorDialog("We're having trouble connecting to the server. Please make sure your settings are all correct.")
			}
		});
	}
	if ($('status').innerHTML == 'Paused') {
		new Ajax.Request(url('resume'), {
			method: 'get',
			onSuccess: function (transport) {
				if (transport.responseText.evalJSON(true).status == true) {
					refresh();
				} else {
					Mojo.Controller.errorDialog("Something went wrong. Try again.")
				}
			},
			onFailure: function (transport) {
				Mojo.Controller.errorDialog("We're getting an error " + transport.status + ". Make sure your settings are correct and try again.");
			},
			onException: function (instance, exception) {
				Mojo.Controller.errorDialog("We're having trouble connecting to the server. Please make sure your settings are all correct.")
			}
		});
	}
};
function enqueueNzbUrl(nzbUrl, category, processing, script, priority) {
	if (nzbUrl == undefined || nzbUrl == "") {
		Mojo.Controller.errorDialog("It might help to enter a URL to download.");
		addNzbUrl.mojo.deactivate();
	} else {
		var options = "";
		if (category !== "default") {
			options = options + "&cat=" + category
		}
		if (processing !== "default") {
			options = options + "&pp=" + processing
		}
		if (script !== "default") {
			options = options + "&script=" + script
		}
		if (priority !== "default") {
			options = options + "&priority=" + priority
		}
		new Ajax.Request(url('addid') + "&name=" + nzbUrl + options, {
			method: 'get',
			onSuccess: function (transport) {
				if (transport.responseText.evalJSON(true).status == true) {
					addNzbUrl.mojo.deactivate();
					Mojo.Controller.stageController.popScene('add-nzb');
					updateData('queue');
				} else {
					Mojo.Controller.errorDialog("Something went wrong. Try again.");
					addNzbUrl.mojo.deactivate();
				}
			},
			onFailure: function (transport) {
				Mojo.Controller.errorDialog("We're getting an error " + transport.status + ". Make sure your settings are correct and try again.");
				addNzbUrl.mojo.deactivate();
			},
			onException: function (instance, exception) {
				Mojo.Controller.errorDialog("We're having trouble connecting to the server. Please make sure your settings are all correct.");
				addNzbUrl.mojo.deactivate();
			}
		});
	}
}
function grabNewzbinUrl(newzbinUrl) {
	Mojo.Controller.stageController.popScene('newzbin');
	nzbURL.mojo.setValue(newzbinUrl);
	browsedUrl = "";
}