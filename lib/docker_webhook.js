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
                case DockerTypes.VOLUME:{
                    this.handler.VolumeObservable.subscribe(x => this.post(x));
                }
                case DockerTypes.SERVICE:{
                    this.handler.ServiceObservable.subscribe(x => this.post(x));
                }
                case DockerTypes.NODE:{
                    this.handler.NodeObservable.subscribe(x => this.post(x));
                }
                case DockerTypes.SECRET:{
                    this.handler.SecretObservable.subscribe(x => this.post(x));
                }
                case DockerTypes.IMAGE:{
                    this.handler.ImageObservable.subscribe(x => this.post(x));
                }
                case DockerTypes.CONFIG:{
                    this.handler.ConfigObservable.subscribe(x => this.post(x));
                }
                case DockerTypes.DAEMON:{
                    this.handler.DaemonObservable.subscribe(x => this.post(x));
                }
                case DockerTypes.NETWORK:{
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


let wh = new WebHook('www.somerandomsite.com/lel', [eventTypes.CONFIG, eventTypes.NETWORK]);