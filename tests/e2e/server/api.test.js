import { jest, beforeEach, expect, describe, test } from "@jest/globals";
import config from "../../../server/config.js";
import superTest from "supertest";
import { setTimeout } from "timers/promises";
import { server as Server } from "../../../server/server.js";
import portfinder from "portfinder";
import { Transform } from "stream";

const getAvailablePort = portfinder.getPortPromise;

const RETENTION_DATA_PERIOD = 200;

describe("API E2E Suite Test", () => {
  const commandRes = JSON.stringify({
    result: "ok",
  });
  const possibleCommands = {
    start: "start",
    stop: "start",
  };
  const pipeAndReadStreamData = (stream, onChunk) => {
    const transform = new Transform({
      transform(chunk, enc, cb) {
        onChunk(chunk);
        cb(null, chunk);
      },
    });
    return stream.pipe(transform);
  };
  const commandSender = (testServer) => {
    return {
      async send(command) {
        const res = await testServer.post("/controller").send({ command });
        expect(res.text).toStrictEqual(commandRes);
      },
    };
  };

  describe("client workflow", () => {
    const getTestServer = async () => {
      const getSuperTest = (port) => superTest(`http://localhost:${port}`);
      const port = await getAvailablePort();
      return new Promise((resolve, reject) => {
        const server = Server.listen(port)
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

    test.todo("GET / it should redirect to /home and receive status 304");
  });
});
