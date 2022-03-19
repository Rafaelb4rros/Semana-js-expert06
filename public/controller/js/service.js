export class Service {
  constructor({ url }) {
    this.url = url;
  }

  async makeRequest(data) {
    const result = await (
      await fetch(this.url, {
        method: "POST",
        body: data,
      })
    ).json();

    return result;
  }
}
