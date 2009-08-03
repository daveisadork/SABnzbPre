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
};
function url(mode) {
	var url = config.protocol + "://" + config.host + ":" + config.port + "/sabnzbd/api?mode=" + mode + "&output=json" + authString();
	return url;
}
function updateData(mode) {
	new Ajax.Request(url(mode), {
		method: 'get',
		onSuccess: function (transport) {
			updateDisplay(transport.responseText.evalJSON(true));
			return transport.responseText.evalJSON(true).jobs
		}
	});
}
function updateDisplay(json) {
	$('status').update(getStatus(json.paused, json.mbleft));
	$('speed').update(json.kbpersec.toFixed(2));
}
function getStatus(paused, mbleft) {
	var status = ""
	if (paused == 1) {
		status = "Paused"
	} else {
		if (mbleft == 0) {
			status = "Idle"
		} else {
			status = "Downloading"
		};
	};
	return status;
}
function authString() {
	var auth = ""
	if (config.username != "" && config.password != "") {
		auth = auth + "&ma_username=" + config.username + "&ma_password=" + config.password
	};
	if (config.api_key != "") {
		auth = auth + "&apikey=" + config.api_key
	};
	return auth;
}
function getQueueItems() {
	var queueItems = function () {
		new Ajax.Request('status.json', {
			method: 'get',
			onSuccess: function (transport) {
				return transport.responseText.evalJSON(true)
			}
		})
	};
	return queueItems.jobs
}