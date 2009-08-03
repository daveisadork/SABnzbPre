function FirstAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}

FirstAssistant.prototype.setup = function() {
	/* this function is for setup tasks that have to happen when the scene is first created */
	/* use Mojo.View.render to render view templates and add them to the scene, if needed. */
	/* setup widgets here */
	/* add event handlers to listen to events from widgets */
	

        
        this.feedMenuModel = {
            visible: true,
            items: [
                 {label: $L('Add NZB'), icon:'new', command:'addnzb'},
                
                 {label: $L('Queue/History'), toggleCmd: 'queue', items: [
                    { label: "Queue", command: 'queue' },
                    { label: "History", command: 'history' },
                ]}, 
                
                {label: $L('Refresh'), icon:'refresh', command:'rfsh' }
            ]
        };
        
        this.controller.setupWidget(Mojo.Menu.commandMenu, { spacerHeight: 0, menuClass:'no-fade' }, this.feedMenuModel);
        
	this.controller.setupWidget("queueList",
            this.attributes = {
                itemTemplate: 'itemTemplate',
                listTemplate: 'listTemplate',
                swipeToDelete: true,
                reorderable: true,
                emptyTemplate:'emptylist'
                // itemsCallback: getQueueItems()	
	    }  ,
	this.queueModel = {
		items: [
			{"filename":"Top Gear - 13x07 - Series 13, Episode 7","mbleft":799.2},
			{"filename":"Eureka - 3x12 - It's Not Easy Being Green","mbleft":1219.5},
			{"filename":"Hot Fuzz (2007)","mbleft":4927.1},
			{"filename":"Gone in Sixty Seconds (2000)","mbleft":7367.5},
			{"filename":"Tommy Boy (1995)","mbleft":4913.9},
			{"filename":"Falling Down (1993)","mbleft":4919.7},
			{"filename":"Saving Private Ryan (1998)","mbleft":9308.5},
			{"filename":"Time Warp - 1x04 - Fuel Girls","mbleft":1041.1},
			{"filename":"UFC 100: Making History","mbleft":7671.6},
			{"filename":"Patton (1970)","mbleft":9057.0},
			{"filename":"The Hitchhiker's Guide to the Galaxy (2005)","mbleft":7347.7},
			{"filename":"This Is Spinal Tap (1984)","mbleft":4978.8},
			{"filename":"Lock N' Load with R. Lee Ermey (2009) - 1x01 - Pilot: Artillery","mbleft":1219.3},
			{"filename":"Weeds - 5x08 - A Distinctive Horn","mbleft":812.7},
			{"filename":"Nurse Jackie - 1x08 - Pupil","mbleft":812.4},
			{"filename":"Watchmen (2009)","mbleft":9267.9},
			{"filename":"Silent Hill (2006)","mbleft":8780.7},
			{"filename":"Good Eats - 13x06 - Feeling Punchy","mbleft":212.2},
			{"filename":"Underworld (2003)","mbleft":7443.1},
			{"filename":"The Dark Knight (2008)","mbleft":8939.9}
		]
            } 
        )     
        
        var loop = setInterval("updateData('qstatus');", config.interval)
}

FirstAssistant.prototype.activate = function(event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */


}


FirstAssistant.prototype.deactivate = function(event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
}

FirstAssistant.prototype.cleanup = function(event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
}

FirstAssistant.prototype.handleCommand = function(event) {
    	if (event.type == Mojo.Event.commandEnable &&
	    (event.command == Mojo.Menu.prefsCmd)) {
        Mojo.Log.info("before stop propagation");
		event.stopPropagation();
    }
    
    if(event.type == Mojo.Event.command) {
        switch(event.command) {
            case 'rfsh':
                updateData('qstatus');
                break;
            case Mojo.Menu.prefsCmd:
                Mojo.Controller.stageController.pushScene('preferences');
                break;
        }
    }   
};