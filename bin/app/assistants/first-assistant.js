function FirstAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}
FirstAssistant.prototype.setup = function () {
	/* this function is for setup tasks that have to happen when the scene is first created */
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	/* setup widgets here */
	/* add event handlers to listen to events from widgets */
	this.playingSound = false;
	this.viewMenuModel = {
		visible: true,
		items: [{
			label: $L('Pause/Resume'),
			template: 'templates/headerTemplate',
			command: 'pauseResume'
		}]
	};
	this.controller.setupWidget(Mojo.Menu.viewMenu, {
		spacerHeight: 0,
		menuClass: 'no-fade'
	},
	this.viewMenuModel);
	this.menuModel = {
		visible: true,
		items: [{
			label: $L('Add NZB'),
			icon: 'new',
			command: 'addnzb'
		},
		{
			label: $L('Queue/History'),
			toggleCmd: 'queue',
			items: [{
				label: $L('Queue'),
				command: 'queue'
			},
			{
				label: $L('History'),
				command: 'history'
			}]
		},
		{
			label: $L('Refresh'),
			icon: 'refresh',
			command: 'rfsh'
		}]
	};
	this.controller.setupWidget(Mojo.Menu.commandMenu, {
		spacerHeight: 0,
		menuClass: 'no-fade'
	},
	this.menuModel);
	this.controller.setupWidget("queueList", this.attributes = {
		itemTemplate: 'templates/queueItemTemplate',
		listTemplate: 'templates/queueListTemplate',
		swipeToDelete: true,
		reorderable: true,
		emptyTemplate: 'templates/emptyQueueList',
		itemsCallback: updateData('queue')
	}); 
	this.controller.setupWidget("historyList", this.attributes = {
		itemTemplate: 'templates/historyItemTemplate',
		listTemplate: 'templates/historyListTemplate',
		swipeToDelete: true,
		reorderable: false,
		emptyTemplate: 'templates/emptyHistoryList',
		itemsCallback: updateData('history')
	});
	this.controller.listen("queueList", Mojo.Event.listDelete, deleteQueueItem);
	this.controller.listen("queueList", Mojo.Event.listReorder, moveQueueItem);
	this.controller.listen("queueList", Mojo.Event.listTap, queueItemDetails);
	this.controller.listen("historyList", Mojo.Event.listDelete, deleteHistoryItem);
	this.controller.listen("historyList", Mojo.Event.listTap, historyItemDetails);
	/* this.controller.listen(document, 'shaking', this.handleShaking.bind(this));
	this.controller.listen(document, 'shakeend', this.handleShakeEnd.bind(this)); */
};
FirstAssistant.prototype.activate = function (event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
	//var loop = setInterval("refresh();", config.interval)
};
FirstAssistant.prototype.deactivate = function (event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};
FirstAssistant.prototype.cleanup = function (event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};
FirstAssistant.prototype.handleCommand = function (event) {
	if (event.type == Mojo.Event.commandEnable && (event.command == Mojo.Menu.prefsCmd)) {
		Mojo.Log.info("before stop propagation");
		event.stopPropagation();
	}
	if (event.type == Mojo.Event.command) {
		switch (event.command) {
		case 'rfsh':
			refresh();
			event.stopPropagation();
			break;
		case Mojo.Menu.prefsCmd:
			Mojo.Controller.stageController.pushScene('preferences');
			event.stopPropagation();
			break;
		case 'history':
			showHistory();
			event.stopPropagation();
			break;
		case 'queue':
			showQueue();
			event.stopPropagation();
			break;
		case 'pauseResume':
			toggleStatus();
			event.stopPropagation();
			break;
		case 'addnzb':
			Mojo.Controller.stageController.pushScene('add-nzb');
			event.stopPropagation();
			break;
		}
	}
};
FirstAssistant.prototype.playSound = function () {
	if (this.playingSound === false) {
		this.playingSound = true;
		try {
			Mojo.Controller.getAppController().playSoundNotification("vibrate", "");
			/*
			this.audio.play();
			*/
			this.controller.serviceRequest('palm://com.palm.audio/systemsounds', {
				method: "playFeedback",
				parameters: {
					name: 'shuffle_02'
				}
			});
			this.playingSound = false;
		} catch(err) {
			this.showDialogBox('Error', err);
		}
	}
};
FirstAssistant.prototype.handleShaking = function (event) {
	this.playSound();
	Event.stop(event);
};
FirstAssistant.prototype.handleShakeEnd = function (event) {
	refresh();
	Event.stop(event);
};