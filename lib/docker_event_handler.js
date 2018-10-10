const Rx = require('rx');

const DockerTypes = Object.freeze({
  VOLUME: 'volume',
  NETWORK: 'network',
  SERVICE: 'service',
  NODE: 'node',
  IMAGE: 'image',
  DAEMON: 'daemon', // TODO(CDuPlooy): Check if this is the correct type.
  SECRET: 'secret',
  CONFIG: 'config',
});

/**
 *
 */
class DockerEventHandler {
  /**
   *
   */
  constructor() {
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
  /**
   * @param {JSON} data
   */
  feed(data) {
    this.AllSubject.onNext(data);

    switch (data['Type']) {
      case DockerTypes.VOLUME: {
        this.VolumeSubject.onNext(data);
        break;
      }
      case DockerTypes.SERVICE: {
        this.ServiceSubject.onNext(data);
        break;
      }
      case DockerTypes.NODE: {
        this.NodeSubject.onNext(data);
        break;
      }
      case DockerTypes.SECRET: {
        this.SecretSubject.onNext(data);
        break;
      }
      case DockerTypes.IMAGE: {
        this.ImageSubject.onNext(data);
        break;
      }
      case DockerTypes.CONFIG: {
        this.ConfigSubject.onNext(data);
        break;
      }
      case DockerTypes.DAEMON: {
        this.DaemonSubject.onNext(data);
        break;
      }
      case DockerTypes.NETWORK: {
        this.NetworkSubject.onNext(data);
        break;
      }
    }
  }
}

module.exports = {DockerEventHandler, DockerTypes};
