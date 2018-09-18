const Rx = require('rx');

var DockerTypes = Object.freeze({
    'VOLUME': 'volume',
    'NETWORK': 'network',
    'SERVICE': 'service',
    'NODE': 'node',
    'IMAGE': 'image',
    'DAEMON': 'daemon', // TODO(CDuPlooy): Check if this is the correct type.
    'SECRET': 'secret',
    'CONFIG': 'config',
});

class DockerEventHandler{
    constructor(){
        this.AllSubject = new Rx.Subject();
        this.AllObservable = this.AllSubject.asObservable();

        this.ServiceSubject = new Rx.Subject();
        this.ServiceObservable = this.ServiceSubject.asObservable();

        this.NetworkSubject = new Rx.Subject();
        this.NetworkObservable = this.NetworkSubject.asObservable();

        this.VolumeSubject = new Rx.Subject();
        this.VolumeObservable = this.VolumeSubject.asObservable();

        this.NodeSubject = new Rx.Subject();
        this.NodeObservable = this.NodeSubject.asObservable();

        this.SecretSubject = new Rx.Subject();
        this.SecretObservable = this.SecretSubject.asObservable();

        this.ImageSubject = new Rx.Subject();
        this.ImageObservable = this.ImageSubject.asObservable();

        this.ConfigSubject = new Rx.Subject();
        this.ConfigObservable = this.ConfigSubject.asObservable();

        this.DaemonSubject = new Rx.Subject();
        this.DaemonObservable = this.DaemonSubject.asObservable();
    }

    /*
        This function takes json as input
        and decides which of the observables
        should pass this data on.
    */
    feed(data){
        this.AllSubject.onNext(data);

        switch(data['Type']){
            case DockerTypes.VOLUME:{
                this.VolumeSubject.onNext(data);
            }
            case DockerTypes.SERVICE:{
                this.ServiceSubject.onNext(data);
            }
            case DockerTypes.NODE:{
                this.NodeSubject.onNext(data);
            }
            case DockerTypes.SECRET:{
                this.SecretSubject.onNext(data);
            }
            case DockerTypes.IMAGE:{
                this.ImageSubject.onNext(data);
            }
            case DockerTypes.CONFIG:{
                this.ConfigSubject.onNext(data);
            }
            case DockerTypes.DAEMON:{
                this.DaemonSubject.onNext(data);
            }
            case DockerTypes.NETWORK:{
                this.NetworkSubject.onNext(data);
            }
        }
    
    }
}


module.exports = {DockerEventHandler, DockerTypes};