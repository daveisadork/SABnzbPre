function QueueHistoryListAssistant() {
    /* this is the creator function for your scene assistant object. It will be passed all the 
       additional parameters (after the scene name) that were passed to pushScene. The reference
       to the scene controller (this.controller) has not be established yet, so any initialization
       that needs the scene controller should be done in the setup function below. */
    
}

QueueHistoryListAssistant.prototype.setup = function() {
    /* this function is for setup tasks that have to happen when the scene is first created */
        
    /* use Mojo.View.render to render view templates and add them to the scene, if needed. */
    
    /* setup widgets here */

    this.controller.setupWidget(Mojo.Menu.appMenu,
        this.attributes = {
            omitDefaultItems: true
        },
        this.model = {
            visible: true,
            items: [ 
                Mojo.Menu.editItem,
                {icon: "preferences-32", label: $L("Preferences"), command: 'preferencesCommand', disabled: true},
                {icon: "connections-32", label: $L("Connections"), command: 'connectionsCommand'},
                {icon: "server-information-32", label: $L("Server Information"), command: 'serverInformationCommand'}
            ]
        }
    );

    this.controller.setupWidget(Mojo.Menu.viewMenu,
        this.attributes = {
            //spacerHeight: 0,
            menuClass: 'my-scene-fade-top'
        },
        this.viewMenuModel = {
            visible: true,
            items: [{
                label: $L('Pause/Resume'),
                template: 'templates/headerTemplate',
                command: 'pauseResume'
            }]
        }
    );
    
    this.refreshModel = {
        label: $L('Refresh'),
        icon: 'refresh',
        command: 'rfsh'
    };
    this.workingModel = {
        label: $L('working'),
        icon: 'working',
        command: 'none',
        template: 'templates/workingTemplate'
    };
    this.controller.setupWidget(Mojo.Menu.commandMenu,
        this.attributes = {
            //spacerHeight: 0,
            menuClass: 'my-scene-fade-bottom'
        },
            this.commandMenuModel = {
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
            this.refreshModel
            ]
        }
    );

    this.controller.setupWidget("working",
        this.attributes = {
            spinnerSize: 'small'
        },
        this.model = {
            spinning: true
        }
    );

    this.controller.setupWidget("speedWrapper",
        this.attributes = {
            },
        this.model = {
            label : "BUTTON",
            disabled: false
        }
    );

    this.controller.setupWidget('errorsDrawer',
        this.attributes = {
            modelProperty: 'open',
            unstyled: true
        },
        this.errorsDrawerModel = {
            open: false
        }
    );

    this.controller.setupWidget("queueList",
        this.attributes = {
            itemTemplate: 'templates/queueItemTemplate',
            listTemplate: 'templates/listTemplate',
            swipeToDelete: true,
            reorderable: true,
            emptyTemplate: 'templates/emptyQueueList',
            fixedHeightItems: false,
            itemsCallback: sabnzbd.getQueueRange.bind(sabnzbd),
            formatters: {
                percentage: this.onQueueListRendered.bind(this)
            }
        }
    );
    
    this.controller.setupWidget("historyList",
        this.attributes = {
            itemTemplate: 'templates/historyItemTemplate',
            listTemplate: 'templates/listTemplate',
            swipeToDelete: true,
            reorderable: false,
            fixedHeightItems: true,
            emptyTemplate: 'templates/emptyHistoryList',
            itemsCallback: sabnzbd.getHistoryRange.bind(sabnzbd),
            formatters: {
                status: this.onHistoryListRendered.bind(this)
            }
        }
    );

    this.controller.setupWidget("queueItemProgress",
        this.attributes = {
            round: true,
            modelProperty: 'queueItemProgressValue'
        }
    );

    this.controller.setupWidget('queueDetailsDrawer',
        this.attributes = {
            
        }
    );

    this.controller.setupWidget("queueItemPause",
        this.attributes = {
            modelProperty: 'itemPaused',
            trueValue: true,
            falseValue: false
        }
    );

    /* add event handlers to listen to events from widgets */
    this.controller.listen("queueList", Mojo.Event.listDelete, this.deleteFromQueue.bind(this));
    this.controller.listen("queueList", Mojo.Event.listReorder, this.moveItem.bind(this));
    this.controller.listen("queueList", Mojo.Event.listTap, this.toggleQueueItemDetails.bind(this));
    this.controller.listen("historyList", Mojo.Event.listDelete, this.deleteFromHistory.bind(this));
    this.controller.listen("historyList", Mojo.Event.listTap, sabnzbd.dummy.bind(sabnzbd));
    this.controller.listen("queueList", Mojo.Event.propertyChange, this.toggleQueueItemPause.bind(this));
    
    this.activateHandler = this.activateWindow.bind(this);
    Mojo.Event.listen(this.controller.stageController.document, Mojo.Event.stageActivate, this.activateHandler);
    $('historyList').hide();
    //$('queueList').addClassName('show');
    
    this.queueDrawerStates = {};
};

QueueHistoryListAssistant.prototype.activate = function(event) {
    /* put in event handlers here that should only be in effect when this scene is active. For
       example, key handlers that are observing the document */
    if (profile.Host === ""){
        Mojo.Controller.stageController.pushScene('connections');
    }
    sabnzbd.queueHistoryScene = this;
    if (!sabnzbd.Connected) {
        $('paused-for').hide();
    }
    //sabnzbd.getConfig();
    refresh();
    //this.controller.refreshInterval = setInterval(autoRefresh.bind(sabnzbd), preferences.Interval);

};


QueueHistoryListAssistant.prototype.deactivate = function(event) {
    /* remove any event handlers you added in activate and do any other cleanup that should happen before
       this scene is popped or another scene is pushed on top */
    this.controller.stopListening("queueList", Mojo.Event.listDelete, this.deleteFromQueue.bind(this));
    this.controller.stopListening("queueList", Mojo.Event.listReorder, this.moveItem.bind(this));
    this.controller.stopListening("queueList", Mojo.Event.listTap, this.toggleQueueItemDetails.bind(this));
    this.controller.stopListening("historyList", Mojo.Event.listDelete, this.deleteFromHistory.bind(this));
    this.controller.stopListening("historyList", Mojo.Event.listTap, sabnzbd.dummy.bind(sabnzbd));
    this.controller.stopListening("queueList", Mojo.Event.propertyChange, this.toggleQueueItemPause.bind(this));
    
    //this.activateHandler = this.activateWindow.bind(this);
    Mojo.Event.listen(this.controller.stageController.document, Mojo.Event.stageActivate, this.activateHandler);
    //clearInterval(this.controller.refreshInterval);

    
};

QueueHistoryListAssistant.prototype.cleanup = function(event) {
    /* this function should do any cleanup needed before the scene is destroyed as 
       a result of being popped off the scene stack */
    sabnzbd = null;
        this.controller.stopListening("queueList", Mojo.Event.listDelete, this.deleteFromQueue.bind(this));
    this.controller.stopListening("queueList", Mojo.Event.listReorder, this.moveItem.bind(this));
    this.controller.stopListening("queueList", Mojo.Event.listTap, this.toggleQueueItemDetails.bind(this));
    this.controller.stopListening("historyList", Mojo.Event.listDelete, this.deleteFromHistory.bind(this));
    this.controller.stopListening("historyList", Mojo.Event.listTap, sabnzbd.dummy.bind(sabnzbd));
    this.controller.stopListening("queueList", Mojo.Event.propertyChange, this.toggleQueueItemPause.bind(this));
    
    //this.activateHandler = this.activateWindow.bind(this);
    Mojo.Event.stopListening(this.controller.stageController.document, Mojo.Event.stageActivate, this.activateHandler);
};

QueueHistoryListAssistant.prototype.handleCommand = function (event) {
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
        case 'connectionsCommand':
            Mojo.Controller.stageController.pushScene('connections');
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
            this.headerTapped(event);
            event.stopPropagation();
            break;
        case 'addnzb':
            Mojo.Controller.stageController.pushScene('add-nzb');
            event.stopPropagation();
            break;
        case 'serverInformationCommand':
            Mojo.Controller.stageController.pushScene('server-information');
            event.stopPropagation();
        }
    }
};

QueueHistoryListAssistant.prototype.onQueueListRendered = function(listWidget, itemModel, itemNode) {
    //itemModel.queueItemProgressValue = itemModel.percentage / 100;
    //itemModel.open = itemModel['nzo_id'] || false;
    itemModel.open = this.queueDrawerStates[itemModel.nzo_id] || false;
    if (itemModel.status === "Queued" && itemModel.priority === "Force") {
        itemModel.status = "Forced";
        $('status').update($L("Downloading (Forced)"));
    }
    if (itemModel.status === "Paused") {
        itemModel.itemPaused = true;
    } else {
        itemModel.itemPaused = false;
    }
};

QueueHistoryListAssistant.prototype.onHistoryListRendered = function(listWidget, itemModel, itemNode) {
    if (itemModel.action_line === "" && itemModel.fail_message === "") {
        itemModel.history_item_status = itemModel.status;
    } else {
        itemModel.history_item_status = itemModel.action_line + itemModel.fail_message;
        if (itemModel.status === "Completed") {
            itemModel.status = "Failed";
        }
    }
};

QueueHistoryListAssistant.prototype.toggleQueueItemDetails = function(event) {
    event.stopPropagation();
    Mojo.Log.info("I think I should toggle the drawer now.", event.item.filename);
    if (event.item.open) {
        event.item.open = false;
    } else {
        event.item.open = true;
    }
    this.queueDrawerStates[event.item.nzo_id] = event.item.open;
    this.controller.modelChanged(event.item);
};

QueueHistoryListAssistant.prototype.headerTapped = function(event) {
    if (event.originalEvent.target.className !== "header-button-wrapper" && event.originalEvent.target.className !== "header-button" && event.originalEvent.target.id !== "speed") {
        sabnzbd.toggleStatus();
    } else {
        this.controller.popupSubmenu({
            onChoose: this.popupHandler,
            placeNear: event.originalEvent.target,
            items: [
                {label: 'Set speed limit...', command: 'set-speed-limit'},
                {label: 'Pause temporarily...', command: 'pause-for'},
                {label: 'On queue finish...', command: 'on-queue-finish'}
            ]
        });
    }
};

QueueHistoryListAssistant.prototype.toggleQueueItemPause = function(event) {
    event.stopPropagation()
    if (event.property === 'itemPaused') {
        Mojo.Log.info(event.model.filename, "pause is set to", event.value);
        if (event.value) {
            sabnzbd.pauseItem(event.model.nzo_id);
        } else {
            sabnzbd.resumeItem(event.model.nzo_id);
        }
    }
};

QueueHistoryListAssistant.prototype.popupHandler = function(command) {
    switch (command) {
        case 'set-speed-limit':
            this.controller.showDialog({
                template: 'templates/speed-limit-dialog',
                assistant: new SpeedLimitAssistant(this)
            });
            break;
        case 'pause-for':
            this.controller.showDialog({
                template: 'templates/pause-for-dialog',
                assistant: new PauseForAssistant(this)
            });
            break;
        case 'on-queue-finish':
            this.controller.showDialog({
                template: 'templates/on-queue-finish-dialog',
                assistant: new OnQueueFinishAssistant(this)
            });
            break;
    }
};

QueueHistoryListAssistant.prototype.deleteFromQueue = function(event) {
    event.stopPropagation();
    sabnzbd.deleteFromQueue(event.item.nzo_id);
};

QueueHistoryListAssistant.prototype.deleteFromHistory = function(event) {
    event.stopPropagation();
    sabnzbd.deleteFromHistory(event.item.nzo_id);
};

QueueHistoryListAssistant.prototype.activateWindow = function(event) {
    event.stopPropagation()
    refresh();
};

QueueHistoryListAssistant.prototype.moveItem = function(event) {
    event.stopPropagation();
    sabnzbd.moveItem(event.item.nzo_id, event.toIndex);
};

showHistory = function () {
    //$('queueList').removeClassName('show');
    if ($('historyList').style.display === "none") {
        //$('queueList').removeClassName('show');
        //$('queueList').addClassName('hide');
        //if (sabnzbd.queue.length > 6 && sabnzbd.history.length > 6) {
        //    queueList.mojo.noticeRemovedItems(5, sabnzbd.queue.length - 1);
        //    historyList.mojo.noticeRemovedItems(7, sabnzbd.history.length - 1);
        //}
        queueList.mojo.revealItem(0, false);
        //sabnzbd.getQueueRange(queueList, 0, 6);
        $('queueList', 'historyList').invoke('toggle');
    }
    refresh()
};

showQueue = function () {
    //$('queueList').removeClassName('hide');
    //$('queueList').addClassName('show');
    if ($('queueList').style.display === "none") {
        //if (sabnzbd.history.length > 6 && sabnzbd.queue.length > 6) {
        //    historyList.mojo.noticeRemovedItems(5, sabnzbd.history.length - 1);
        //    queueList.mojo.noticeRemovedItems(7, sabnzbd.history.length - 1);
        //}
        historyList.mojo.revealItem(0, false);
        //sabnzbd.getHistoryRange(historyList, 0, 6);
        //$('queueList').removeClassName('hide');
        $('historyList', 'queueList').invoke('toggle');
        //$('queueList').addClassName('show');
    }
    refresh()
};

autoRefresh = function() {
    if (sabnzbd.Connected === true && profile.Host !== "") {
        sabnzbd.refresh();
    }
};
refresh = function () {
    if (($('queueList').style.display !== "none") && ($('historyList').style.display === "none")) {
        loadedItems = queueList.mojo.getLoadedItemRange()
        sabnzbd.getQueueRange(queueList, loadedItems.offset, loadedItems.limit)
    } else if (($('queueList').style.display === "none") && ($('historyList').style.display !== "none")) {
        loadedItems = historyList.mojo.getLoadedItemRange()
        sabnzbd.getHistoryRange(historyList, loadedItems.offset, loadedItems.limit)
    }
};
