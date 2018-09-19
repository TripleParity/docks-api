const dockerEventHandler = require('./docker_event_handler');
const request = require('request');

const eventTypes = dockerEventHandler.DockerTypes;
class WebHook{
    /*
        If the events array is empty, we subscribe to all of
        the events.
    */
    constructor(url, events = [], handler){
        this.url = url;
        this.events = events;
        this.handler = handler;
    }

    init(){
        if(this.events.length == 0)
            this.handler.AllObservable.subscribe(x => this.post(x));
        
        
        this.events.forEach(event => {
            switch(event){
                case eventTypes.VOLUME:{
                    this.handler.VolumeObservable.subscribe(x => this.post(x));
                }
                case eventTypes.SERVICE:{
                    this.handler.ServiceObservable.subscribe(x => this.post(x));
                }
                case eventTypes.NODE:{
                    this.handler.NodeObservable.subscribe(x => this.post(x));
                }
                case eventTypes.SECRET:{
                    this.handler.SecretObservable.subscribe(x => this.post(x));
                }
                case eventTypes.IMAGE:{
                    this.handler.ImageObservable.subscribe(x => this.post(x));
                }
                case eventTypes.CONFIG:{
                    this.handler.ConfigObservable.subscribe(x => this.post(x));
                }
                case eventTypes.DAEMON:{
                    this.handler.DaemonObservable.subscribe(x => this.post(x));
                }
                case eventTypes.NETWORK:{
                    this.handler.NetworkObservable.subscribe(x => this.post(x));                    
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
        request.post(this.url, {json:true, body:json});
    }
}



module.exports = WebHook;