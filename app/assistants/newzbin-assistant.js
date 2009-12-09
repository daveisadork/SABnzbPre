function NewzbinAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}
NewzbinAssistant.prototype.setup = function () {
	/* this function is for setup tasks that have to happen when the scene is first created */
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	var browsedUrl = "";
	/* setup widgets here */
	this.controller.setupWidget('webView', {
		url: 'http://www.newzbin.com',
		interrogateClicks: true
	});
	this.reloadModel = {
		label: $L('Reload'),
		icon: 'refresh',
		command: 'refresh'
	};
	this.stopModel = {
		label: $L('Stop'),
		icon: 'load-progress',
		command: 'stop'
	}; 
	this.cmdMenuModel = {
		visible: true,
		items: [{
			label: $L('Add Newzbin URL'),
			icon: 'new',
			command: 'grabUrl'
		},
		this.reloadModel ]
	};
	this.controller.setupWidget(Mojo.Menu.commandMenu, {
		menuClass: 'no-fade'
	},
	this.cmdMenuModel);
	/* add event handlers to listen to events from widgets */
	Mojo.Event.listen(this.controller.get('webView'), Mojo.Event.webViewLoadProgress, this.loadProgress.bind(this));
	Mojo.Event.listen(this.controller.get('webView'), Mojo.Event.webViewLoadStarted, this.loadStarted.bind(this));
	Mojo.Event.listen(this.controller.get('webView'), Mojo.Event.webViewLoadStopped, this.loadStopped.bind(this));
	Mojo.Event.listen(this.controller.get('webView'), Mojo.Event.webViewLoadFailed, this.loadStopped.bind(this)); 
	Mojo.Event.listen(this.controller.get('webView'), Mojo.Event.webViewLinkClicked, this.linkClicked.bind(this));
};
NewzbinAssistant.prototype.activate = function (event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	//this.controller.get('webView').mojo.addSystemRedirects('com.davehayes.sabnzbpre');
};
NewzbinAssistant.prototype.deactivate = function (event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};
NewzbinAssistant.prototype.cleanup = function (event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	Mojo.Event.stopListening(this.controller.get('webView'), Mojo.Event.webViewLoadProgress, this.loadProgress.bind(this));
	Mojo.Event.stopListening(this.controller.get('webView'), Mojo.Event.webViewLoadStarted, this.loadStarted.bind(this));
	Mojo.Event.stopListening(this.controller.get('webView'), Mojo.Event.webViewLoadStopped, this.loadStopped.bind(this));
	Mojo.Event.stopListening(this.controller.get('webView'), Mojo.Event.webViewLoadFailed, this.loadStopped.bind(this));
	Mojo.Event.stopListening(this.controller.get('webView'), Mojo.Event.webViewLinkClicked, this.linkClicked.bind(this));
};

//  Handle reload or stop load commands
//
NewzbinAssistant.prototype.handleCommand = function (event) {
	if (event.type == Mojo.Event.command) {
		switch (event.command) {
		case 'refresh':
			this.controller.get('webView').mojo.reloadPage();
			break;
		case 'stop':
			this.controller.get('webView').mojo.stopLoad();
			break;
		case 'grabUrl':
			grabNewzbinUrl(browsedUrl);
			break;
		}
        event.stopPropagation();
	}
}; //  loadStarted - switch command button to stop icon & command
//
NewzbinAssistant.prototype.loadStarted = function (event) {
	this.cmdMenuModel.items.pop(this.reloadModel);
	this.cmdMenuModel.items.push(this.stopModel);
	this.controller.modelChanged(this.cmdMenuModel);
	this.currLoadProgressImage = 0;
}; //  loadStopped - switch command button to reload icon & command
NewzbinAssistant.prototype.loadStopped = function (event) {
	this.cmdMenuModel.items.pop(this.stopModel);
	this.cmdMenuModel.items.push(this.reloadModel);
	this.controller.modelChanged(this.cmdMenuModel);
}; //  loadProgress - check for completion, then update progress
NewzbinAssistant.prototype.loadProgress = function (event) {
	var percent = event.progress;
	try {
		if (percent > 100) {
			percent = 100;
		} else if (percent < 0) {
			percent = 0;
		} // Update the percentage complete
		this.currLoadProgressPercentage = percent; // Convert the percentage complete to an image number
		// Image must be from 0 to 23 (24 images available)
		var image = Math.round(percent / 4.1);
		if (image > 23) {
			image = 23;
		} // Ignore this update if the percentage is lower than where we're showing
		if (image < this.currLoadProgressImage) {
			return;
		} // Has the progress changed?
		if (this.currLoadProgressImage != image) { // Cancel the existing animator if there is one
			if (this.loadProgressAnimator) {
				this.loadProgressAnimator.cancel();
				delete this.loadProgressAnimator;
			} // Animate from the current value to the new value
			var icon = this.controller.select('div.load-progress')[0];
			if (icon) {
				this.loadProgressAnimator = Mojo.Animation.animateValue(Mojo.Animation.queueForElement(icon), "linear", this._updateLoadProgress.bind(this), {
					from: this.currLoadProgressImage,
					to: image,
					duration: 0.5
				});
			}
		}
	} catch(e) {
		Mojo.Log.logException(e, e.description);
	}
};
NewzbinAssistant.prototype._updateLoadProgress = function (image) { // Find the progress image
	image = Math.round(image); // Don't do anything if the progress is already displayed
	if (this.currLoadProgressImage == image) {
		return;
	}
	var icon = this.controller.select('div.load-progress');
	if (icon && icon[0]) {
		icon[0].setStyle({
			'background-position': "0px -" + (image * 48) + "px"
		});
	}
	this.currLoadProgressImage = image;
};
NewzbinAssistant.prototype.linkClicked = function (clickEvent) {
        event.stopPropagation();
	this.controller.get('webView').mojo.openURL(clickEvent.url);
	browsedUrl = clickEvent.url;
};