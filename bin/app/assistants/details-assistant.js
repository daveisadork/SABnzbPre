function DetailsAssistant(data, index, mode) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
    this.itemDetails = data.index;
    this.detailsData = data;
    this.detailsMode = mode;
}

DetailsAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	
	/* setup widgets here */
	
	/* add event handlers to listen to events from widgets */
	
    if (this.detailsMode == "queue") {
        $("itemTitle").innerHTML = this.itemDetails.filename;
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
    }
    if (this.detailsMode == "history") {
        $("itemTitle").innerHTML = this.itemDetails.name;
    }
}

DetailsAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
}


DetailsAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

DetailsAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}
