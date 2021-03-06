function AddNzbAssistant() {
        /* this is the creator function for your scene assistant object. It will be passed all the 
           additional parameters (after the scene name) that were passed to pushScene. The reference
           to the scene controller (this.controller) has not be established yet, so any initialization
           that needs the scene controller should be done in the setup function below. */

	
}
AddNzbAssistant.prototype.setup = function () {
        /* this function is for setup tasks that have to happen when the scene is first created */
        /* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
        /* setup widgets here */
        this.controller.setupWidget("nzbURL", this.attributes = {
                multiline: false,
                enterSubmits: false,
                textCase: Mojo.Widget.steModeLowerCase
        },
        this.nzbURLModel = {
                disabled: false
        });
        this.controller.setupWidget('optionsDrawer', this.attributes = {
                modelProperty: 'open',
                unstyled: true
        },
        this.optionsDrawerModel = {
                open: false
        });
        this.categoryModel = {
                choices: [{label: $L('Default'), value: "default"}].concat(sabnzbd.Categories),
                selectedCategory: 'default'
        };
        this.controller.setupWidget('categorySelector', {
                label: $L('Category'),
                modelProperty: 'selectedCategory'
        },
        this.categoryModel);
        this.processingModel = {
                selectedProcessing: 'default'
        };
        this.controller.setupWidget('processingSelector', {
                label: $L('Processing'),
                choices: [{
                        label: $L('Default'),
                        value: "default"
                },
                {
                        label: $L('None'),
                        value: "0"
                },
                {
                        label: $L('+Repair'),
                        value: "1"
                },
                {
                        label: $L('+Unpack'),
                        value: "2"
                },
                {
                        label: $L('+Delete'),
                        value: "3"
                }
                ],
                modelProperty: 'selectedProcessing'
        },
        this.processingModel);
        this.scriptModel = {
                choices: [{label: $L('Default'), value: "default"}].concat(sabnzbd.Scripts),
                selectedScript: 'default'
        };
        this.controller.setupWidget('scriptSelector', {
                label: $L('Script'),
                modelProperty: 'selectedScript'
        },
        this.scriptModel);
        this.priorityModel = {
                selectedPriority: 'default'
        };
        this.controller.setupWidget('prioritySelector', {
                label: $L('Priority'),
                choices: [{
                        label: $L('Default'),
                        value: "default"
                },
                {
			label: $L('Force'),
			value: "2"
		},
                {
                        label: $L('High'),
                        value: "1"
                },
                {
                        label: $L('Normal'),
                        value: "0"
                },
                {
                        label: $L('Low'),
                        value: "-1"
                }],
                modelProperty: 'selectedPriority'
        },
        this.priorityModel);
        this.controller.setupWidget("addNzbUrl", this.attributes = {
                type: Mojo.Widget.activityButton
        },
        this.addNzbUrlModel = {
                label: $L("Add NZB"),
                disabled: false
        });
        this.controller.setupWidget("browseNewzbin", this.attributes = {},
        this.browseNewzbinModel = {
                label: $L("Browse Newzbin"),
                disabled: true
        });
	this.controller.setupWidget("browseNzbMatrix", this.attributes = {},
        this.browseNzbMatrixModel = {
                label: $L("Browse NZBMatrix"),
                disabled: true
        });
        this.controller.setupWidget("getBookmarks", this.attributes = {
                type: Mojo.Widget.activityButton
        },
        this.getBookmarksModel = {
                label: $L("Get Bookmarks Now"),
                disabled: true
        });
        /* add event handlers to listen to events from widgets */
        Mojo.Event.listen(this.controller.get('addNzbUrl'), Mojo.Event.tap, this.handleAddNzbUrl.bind(this));
        Mojo.Event.listen(this.controller.get('getBookmarks'), Mojo.Event.tap, this.handleGetBookmarks.bind(this));
        Mojo.Event.listen(this.controller.get('browseNewzbin'), Mojo.Event.tap, this.handleBrowseNewzbin.bind(this));
        Mojo.Event.listen(this.controller.get('browseNzbMatrix'), Mojo.Event.tap, this.handleBrowseNzbMatrix.bind(this));
        Mojo.Event.listen(this.controller.get('optionsDivider'), Mojo.Event.tap, this.handleOptionsDivider.bind(this));
};
AddNzbAssistant.prototype.activate = function (event) {
        /* put in event handlers here that should only be in effect when this scene is active. For
           example, key handlers that are observing the document */

	if (sabnzbd.ServerConfig) {
		this.enableBrowseButtons();
	} else {
		sabnzbd.getConfig(this, "this.currentTask.controller.enableBrowseButtons()");
	}

};
AddNzbAssistant.prototype.deactivate = function (event) {
        /* remove any event handlers you added in activate and do any other cleanup that should happen before
           this scene is popped or another scene is pushed on top */

};
AddNzbAssistant.prototype.cleanup = function (event) {
        /* this function should do any cleanup needed before the scene is destroyed as 
           a result of being popped off the scene stack */
        Mojo.Event.stopListening(this.controller.get('addNzbUrl'), Mojo.Event.tap, this.handleAddNzbUrl.bind(this));
        Mojo.Event.stopListening(this.controller.get('browseNewzbin'), Mojo.Event.tap, this.handleBrowseNewzbin.bind(this));
        Mojo.Event.stopListening(this.controller.get('optionsDivider'), Mojo.Event.tap, this.handleOptionsDivider.bind(this));
};

AddNzbAssistant.prototype.enableBrowseButtons = function () {
	if (sabnzbd.ServerConfig) {
		disableBrowseNewzbin = false;
		disableBrowseNzbMatrix = false;
		for (var newzbinOption in sabnzbd.ServerConfig.newzbin) {
			if (sabnzbd.ServerConfig.newzbin.hasOwnProperty(newzbinOption)) {
				if (sabnzbd.ServerConfig.newzbin[newzbinOption] === '') {
					disableBrowseNewzbin = true;
				}
			}
		}
		for (var nzbmatrixOption in sabnzbd.ServerConfig.nzbmatrix) {
			if (sabnzbd.ServerConfig.nzbmatrix.hasOwnProperty(nzbmatrixOption)) {
				if (sabnzbd.ServerConfig.nzbmatrix[nzbmatrixOption] === '') {
					disableBrowseNzbMatrix = true;
				}
			}
		}
		this.browseNewzbinModel.disabled = disableBrowseNewzbin;
        this.getBookmarksModel.disabled = disableBrowseNewzbin;
		this.browseNzbMatrixModel.disabled = disableBrowseNzbMatrix;
		this.controller.modelChanged(this.browseNewzbinModel);
        this.controller.modelChanged(this.getBookmarksModel);
		this.controller.modelChanged(this.browseNzbMatrixModel);
	}
};

AddNzbAssistant.prototype.handleAddNzbUrl = function (event) {
        event.stopPropagation();
        if (nzbURL.mojo.getValue() === undefined || nzbURL.mojo.getValue() === "") {
            Mojo.Controller.errorDialog($L("It might help to enter a URL to download."));
            addNzbUrl.mojo.deactivate();
        } else {
            sabnzbd.enqueueNzbUrl(nzbURL.mojo.getValue(), this.categoryModel.selectedCategory, this.processingModel.selectedProcessing, this.scriptModel.selectedScript, this.priorityModel.selectedPriority);
        }
};
AddNzbAssistant.prototype.handleGetBookmarks = function (event) {
        event.stopPropagation();
        sabnzbd.getBookmarks("getBookmarksCallback();");
};
AddNzbAssistant.prototype.handleBrowseNewzbin = function (event) {
        event.stopPropagation();
        Mojo.Controller.stageController.pushScene('browse-nzb', 'http://www.newzbin.com');
};
AddNzbAssistant.prototype.handleBrowseNzbMatrix = function (event) {
        event.stopPropagation();
        Mojo.Controller.stageController.pushScene('browse-nzb', 'http://nzbmatrix.com');
};
AddNzbAssistant.prototype.handleOptionsDivider = function (event) {
        event.stopPropagation();
        optionsDrawer.mojo.toggleState();
        if (optionsDrawer.mojo.getOpenState() === false) {
            $('optionsToggle').addClassName('palm-arrow-closed');
            $('optionsToggle').removeClassName('palm-arrow-expanded');
        }
        if (optionsDrawer.mojo.getOpenState() === true) {
            $('optionsToggle').addClassName('palm-arrow-expanded');
            $('optionsToggle').removeClassName('palm-arrow-closed');
        }
};

getBookmarksCallback = function () {
	addNzbUrl.mojo.deactivate();
	if (sabnzbd.Connected && !sabnzbd.Error) {	
		Mojo.Controller.stageController.popScene('browse-nzb');
		//refresh();
	} else {
		Mojo.Controller.errorDialog($L("A problem occurred while getting bookmarks. Please try again."));
	}
};

addNzbCallback = function () {
	addNzbUrl.mojo.deactivate();
	if (sabnzbd.Connected && !sabnzbd.Error) {	
		Mojo.Controller.stageController.popScene('browse-nzb');
		//refresh();
	} else {
		Mojo.Controller.errorDialog($L("A problem occurred while submitting the NZB. Please try again."));
	}
};

grabNewzbinUrl = function(newzbinUrl) {
	Mojo.Controller.stageController.popScene('browse-nzb');
	nzbURL.mojo.setValue(newzbinUrl);
	browsedUrl = "";
};