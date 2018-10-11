const dockerEventHandler = require('./docker_event_handler');
const request = require('request');

const eventTypes = dockerEventHandler.DockerTypes;
/**
 *
 */
class WebHook {
  /**
   * @param {string} name
   * @param {string} url
   * @param {dockerEventHandler.DockerTypes} events
   * @param {DockerEventHandler} handler
   */
  constructor(name, url, events = [], handler) {
    this.url = url;
    this.events = events;
    this.handler = handler;
    this.name = name;
    this.subcriptions = [];
  }
  /**
   *
   */
  init() {
    if (this.events.length == 0) {
      this.subcriptions.push(
        this.handler.AllObservable.subscribe((x) => this.post(x))
      );
    }

    this.events.forEach((event) => {
      switch (event) {
        case eventTypes.VOLUME: {
          this.subcriptions.push(
            this.handler.VolumeObservable.subscribe((x) => this.post(x))
          );
          break;
        }
        case eventTypes.SERVICE: {
          this.subcriptions.push(
            this.handler.ServiceObservable.subscribe((x) => this.post(x))
          );
          break;
        }
        case eventTypes.NODE: {
          this.subcriptions.push(
            this.handler.NodeObservable.subscribe((x) => this.post(x))
          );
          break;
        }
        case eventTypes.SECRET: {
          this.subcriptions.push(
            this.handler.SecretObservable.subscribe((x) => this.post(x))
          );
          break;
        }
        case eventTypes.IMAGE: {
          this.subcriptions.push(
            this.handler.ImageObservable.subscribe((x) => this.post(x))
          );
          break;
        }
        case eventTypes.CONFIG: {
          this.subcriptions.push(
            this.handler.ConfigObservable.subscribe((x) => this.post(x))
          );
        }
        case eventTypes.DAEMON: {
          this.subcriptions.push(
            this.handler.DaemonObservable.subscribe(x => this.post(x))
          );
          break;
        }
        case eventTypes.NETWORK: {
          this.subcriptions.push(
            this.handler.NetworkObservable.subscribe(x => this.post(x))
          );
          break;
        }
      }
    });
  }

  /**
   * @param {JSON} json
   */
  post(json) {
    request.post(this.url, {json: true, body: json});
  }
  /**
   *
   */
  stop() {
    this.subcriptions.forEach((subscription) => {
      this.subcription.stop();
    });
  }
}

module.exports = WebHook;
