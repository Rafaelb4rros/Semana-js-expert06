import { jest, beforeEach, expect, describe, test } from "@jest/globals";
import config from "../../../server/config.js";
import superTest from "supertest";
import { setTimeout } from "timers/promises";
import { server as Server } from "../../../server/server.js";
import portfinder from "portfinder";
import { Transform } from "stream";
import fs from "fs";
const getAvailablePort = portfinder.getPortPromise;

const RETENTION_DATA_PERIOD = 200;

const {
  constants: { STATUS_CODE, CONTENT_TYPE },
  dir: { publicDirectory },
  pages: { controllerHTML, homeHTML },
} = config;

describe("API E2E Suite Test", () => {
  const commandRes = JSON.stringify({
    result: "ok",
  });
  const possibleCommands = {
    start: "start",
    stop: "stop",
  };
  let testServer = superTest(Server());
  const pipeAndReadStreamData = (stream, onChunk) => {
    const transform = new Transform({
      transform(chunk, enc, cb) {
        onChunk(chunk);
        cb(null, chunk);
      },
    });
    return stream.pipe(transform);
  };

  test("GET / - it should redirect to /home with status 302", async () => {
    const res = await testServer.get(`/`);
    expect(res.headers.location).toStrictEqual("/home");
    expect(res.statusCode).toStrictEqual(STATUS_CODE["REDIRECT"]);
  });

  test("GET /home - it should return home html file", async () => {
    const res = await testServer.get(`/home`);
    const existingFile = await fs.promises.readFile(
      `${publicDirectory}/${homeHTML}`
    );
    expect(res.text).toStrictEqual(existingFile.toString());
    expect(res.statusCode).toStrictEqual(STATUS_CODE["SUCCESS"]);
  });

  test("GET /controller - it should return controller html file", async () => {
    const res = await testServer.get(`/controller`);
    const existingFile = await fs.promises.readFile(
      `${publicDirectory}/${controllerHTML}`
    );
    expect(res.text).toStrictEqual(existingFile.toString());
    expect(res.statusCode).toStrictEqual(STATUS_CODE["SUCCESS"]);
  });

  test("GET /unknown - it should respond with status 404", async () => {
    const res = await testServer.get(`/unknown`);

    expect(res.statusCode).toStrictEqual(STATUS_CODE["NOT_FOUND"]);
  });
  describe("static files", () => {
    test("GET - /file.js - it should respond with 404 if not exists", async () => {
      const file = "file.js";
      const res = await testServer.get(`/${file}`);
      expect(res.statusCode).toStrictEqual(STATUS_CODE["NOT_FOUND"]);
    });

    test("GET - /home/css/styles.css - given an css file it should respond with contentType text/css", async () => {
      const file = "/home/css/styles.css";
      const res = await testServer.get(`/${file}`);
      const existingFile = await fs.promises.readFile(
        `${publicDirectory}/${file}`
      );
      expect(res.text).toStrictEqual(existingFile.toString());
      expect(res.statusCode).toStrictEqual(STATUS_CODE["SUCCESS"]);
      expect(res.header["content-type"]).toStrictEqual(CONTENT_TYPE[".css"]);
    });

    test("GET - /home/js/animation.js - given an js file it should respond with contentType text/javascript", async () => {
      const file = "/home/js/animation.js";
      const res = await testServer.get(`/${file}`);
      const existingFile = await fs.promises.readFile(
        `${publicDirectory}/${file}`
      );
      expect(res.text).toStrictEqual(existingFile.toString());
      expect(res.statusCode).toStrictEqual(STATUS_CODE["SUCCESS"]);
      expect(res.header["content-type"]).toStrictEqual(CONTENT_TYPE[".js"]);
    });

    test("GET - /controller/index.html - given an html file it should respond with contentType text/html", async () => {
      const file = controllerHTML;
      const res = await testServer.get(`/${controllerHTML}`);
      const existingFile = await fs.promises.readFile(
        `${publicDirectory}/${file}`
      );
      expect(res.text).toStrictEqual(existingFile.toString());
      expect(res.statusCode).toStrictEqual(STATUS_CODE["SUCCESS"]);
      expect(res.header["content-type"]).toStrictEqual(CONTENT_TYPE[".html"]);
    });
  });

  describe("client workflow", () => {
    const getTestServer = async () => {
      const getSuperTest = (port) => superTest(`http://localhost:${port}`);
      const port = await getAvailablePort();

      return new Promise((resolve, reject) => {
        const server = Server()
          .listen(port)
          .once("listening", () => {
            const testServer = getSuperTest(port);
            const response = {
              testServer,
              kill() {
                server.close();
              },
            };

            return resolve(response);
          })
          .once("error", reject);
      });
    };
    const commandSender = (testServer) => {
      return {
        async send(command) {
          const res = await testServer.post("/controller").send({ command });
          expect(res.text).toStrictEqual(commandRes);
        },
      };
    };

    test("it should not receive data stream if the process is not playing", async () => {
      const server = await getTestServer();
      const onChunk = jest.fn();
      pipeAndReadStreamData(server.testServer.get("/stream"), onChunk);
      await setTimeout(RETENTION_DATA_PERIOD);
      server.kill();
      expect(onChunk).not.toHaveBeenCalled();
    });

    test("it should receive data if the process is playing", async () => {
      const server = await getTestServer();
      const onChunk = jest.fn();
      const { send } = commandSender(server.testServer);
      pipeAndReadStreamData(server.testServer.get("/stream"), onChunk);

      await send(possibleCommands.start);
      await setTimeout(RETENTION_DATA_PERIOD);
      await send(possibleCommands.stop);
      const [[buffer]] = onChunk.mock.calls;

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(1000);
      server.kill();
    });
  });
});
