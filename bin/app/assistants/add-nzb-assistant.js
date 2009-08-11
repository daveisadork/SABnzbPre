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
		selectedCategory: 'default'
	};
	this.controller.setupWidget('categorySelector', {
		label: $L('Category'),
		choices: [{
			label: $L('Default'),
			value: "default"
		},
		{
			label: $L('None'),
			value: "none"
		}],
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
		},
		],
		modelProperty: 'selectedProcessing'
	},
	this.processingModel);
	this.scriptModel = {
		selectedScript: 'default'
	};
	this.controller.setupWidget('scriptSelector', {
		label: $L('Script'),
		choices: [{
			label: $L('Default'),
			value: "default"
		},
		{
			label: $L('None'),
			value: "none"
		}],
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
		// {label: $L('Force'),value: "force"},
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
		label: "Add NZB",
		disabled: false
	});
	this.controller.setupWidget("browseNewzbin", this.attributes = {},
	this.browseNewzbinModel = {
		label: "Browse Newzbin",
		disabled: false
	});
	/* add event handlers to listen to events from widgets */
	Mojo.Event.listen(this.controller.get('addNzbUrl'), Mojo.Event.tap, this.handleAddNzbUrl.bind(this));
	Mojo.Event.listen(this.controller.get('browseNewzbin'), Mojo.Event.tap, this.handleBrowseNewzbin.bind(this));
	Mojo.Event.listen(this.controller.get('optionsDivider'), Mojo.Event.tap, this.handleOptionsDivider.bind(this));
}
AddNzbAssistant.prototype.activate = function (event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}
AddNzbAssistant.prototype.deactivate = function (event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}
AddNzbAssistant.prototype.cleanup = function (event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	Mojo.Event.stopListening(this.controller.get('addNzbUrl'), Mojo.Event.tap, this.handleAddNzbUrl.bind(this));
	Mojo.Event.stopListening(this.controller.get('browseNewzbin'), Mojo.Event.tap, this.handleBrowseNewzbin.bind(this));
	Mojo.Event.stopListening(this.controller.get('optionsDivider'), Mojo.Event.tap, this.handleOptionsDivider.bind(this));
}
AddNzbAssistant.prototype.handleAddNzbUrl = function (event) {
	event.stopPropagation();
	enqueueNzbUrl(nzbURL.mojo.getValue(), this.categoryModel.selectedCategory, this.processingModel.selectedProcessing, this.scriptModel.selectedScript, this.priorityModel.selectedPriority);
}
AddNzbAssistant.prototype.handleBrowseNewzbin = function (event) {
	event.stopPropagation();
	Mojo.Controller.stageController.pushScene('newzbin');
}
AddNzbAssistant.prototype.handleOptionsDivider = function (event) {
	Mojo.Controller.errorDialog("Well, that worked.")
}