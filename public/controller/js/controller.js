export class Controller {
  constructor({ view, service }) {
    this.view = view;
    this.service = service;
  }

  static initialize(dependencies) {
    const controller = new Controller(dependencies);
    controller.onLoad();
    return controller;
  }

  async commandReceived(text) {
    const data = JSON.stringify({
      command: text,
    });

    return await this.service.makeRequest(data);
  }

  onLoad() {
    this.view.onLoad();
    this.view.configureOnBtnClick(this.commandReceived.bind(this));
  }
}
