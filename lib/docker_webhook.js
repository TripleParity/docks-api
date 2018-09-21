const dockerEventHandler = require('./docker_event_handler');
const request = require('request');

const eventTypes = dockerEventHandler.DockerTypes;
class WebHook{
    /*
        If the events array is empty, we subscribe to all of
        the events.
    */
    constructor(name, url, events = [], handler){
        this.url = url;
        this.events = events;
        this.handler = handler;
        this.name = name;

        this.subcriptions = [];
    }

    init(){
        if(this.events.length == 0)
            this.subcriptions.push(this.handler.AllObservable.subscribe(x => this.post(x)));
        
        
        this.events.forEach(event => {
            switch(event){
                case eventTypes.VOLUME:{
                    this.subcriptions.push(this.handler.VolumeObservable.subscribe(x => this.post(x)));
                }
                case eventTypes.SERVICE:{
                    this.subcriptions.push(this.handler.ServiceObservable.subscribe(x => this.post(x)));
                }
                case eventTypes.NODE:{
                    this.subcriptions.push(this.handler.NodeObservable.subscribe(x => this.post(x)));
                }
                case eventTypes.SECRET:{
                    this.subcriptions.push(this.handler.SecretObservable.subscribe(x => this.post(x)));
                }
                case eventTypes.IMAGE:{
                    this.subcriptions.push(this.handler.ImageObservable.subscribe(x => this.post(x)));
                }
                case eventTypes.CONFIG:{
                    this.subcriptions.push(this.handler.ConfigObservable.subscribe(x => this.post(x)));
                }
                case eventTypes.DAEMON:{
                    this.subcriptions.push(this.handler.DaemonObservable.subscribe(x => this.post(x)));
                }
                case eventTypes.NETWORK:{
                    this.subcriptions.push(this.handler.NetworkObservable.subscribe(x => this.post(x)));                    
                }
            }
        });
    }

    /* 
    Whenever a value is emitted
    by the particular observable
    this function is called.    
    */
    post(json){
        if(json["Type"] === "node"){
            // Modify the data; Send to slack.
            let modified_json = {text: "Node " + json["Actor"]["Attributes"]["name"] + " was " + json["Action"] + "d."};
            request.post(this.url, {json:true, body: modified_json});
        }else{
            request.post(this.url, {json:true, body:json});
        }
        /*
            THESE CHANGES ARE TEMP; AND ONLY FOR DEMO 5
            WILL DO IT PROPERLY LATER 
        */
    }

    stop(){
        this.subcriptions.forEach(subscription => {
            this.subcription.stop();
        });
    }
}



module.exports = WebHook;