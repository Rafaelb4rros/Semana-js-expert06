import { Service } from "./service.js";

export class Controller {
  constructor() {
    this.service = new Service();
  }

  async getFileStream(filename) {
    return await this.service.getFileStream(filename);
  }
}
