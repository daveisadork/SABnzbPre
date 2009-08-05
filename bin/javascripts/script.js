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
function getStatus(paused, mbleft) {
	var status;
	if (paused == 1) {
		status = "Paused";
	} else {
		if (mbleft === 0) {
			status = "Idle";
		} else {
			status = "Downloading";
		}
	}
	return status;
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
		onSuccess: function (transport) {
			var json = transport.responseText.evalJSON(true);
			updateDisplay(mode, json);
		},
		onFailure: function () {
			var error = "Ouch! Something went wrong.";
			Mojo.Controller.errorDialog(error);
		}
	});
}
deleteQueueItem = function (event) {
	new Ajax.Request(url('queue') + "&name=delete&value=" + event.item.nzo_id, {
		method: 'get',
		onSuccess: function () {
			updateData('queue');
		},
		onFailure: function () {
			var error = "Ouch! Something went wrong.";
			Mojo.Controller.errorDialog(error);
		}
	});
};
moveQueueItem = function (event) {
	new Ajax.Request(url('switch') + "&value=" + event.item.nzo_id + "&value2=" + event.toIndex, {
		method: 'get',
		onSuccess: function () {
			updateData('queue');
		},
		onFailure: function () {
			var error = "Ouch! Something went wrong.";
			Mojo.Controller.errorDialog(error);
		}
	});
};
deleteHistoryItem = function (event) {
	new Ajax.Request(url('history') + "&name=delete&value=" + event.item.nzo_id, {
		method: 'get',
		onSuccess: function () {
			updateData('history');
		},
		onFailure: function () {
			var error = "Ouch! Something went wrong.";
			Mojo.Controller.errorDialog(error);
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