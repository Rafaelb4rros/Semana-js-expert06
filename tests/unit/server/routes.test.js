import { jest, beforeEach, expect, describe, test } from "@jest/globals";
import config from "../../../server/config.js";
import { Controller } from "../../../server/controller.js";
import { handler } from "../../../server/routes.js";
import TestUtil from "../utils/test.util.js";
import events from "events";
const {
  pages,
  location,
  constants: { CONTENT_TYPE, STATUS_CODE },
} = config;

describe("#Routes - test suite for api response", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test("GET / - should redirect to home page", async () => {
    const params = TestUtil.defaultHandleParams();
    params.req.method = "GET";
    params.req.url = "/";
    await handler(...params.values());
    expect(params.res.writeHead).toBeCalledWith(STATUS_CODE["REDIRECT"], {
      Location: location.home,
    });
    expect(params.res.end).toHaveBeenCalled();
  });

  test(`GET /home - should return response with ${pages.homeHTML} file stream`, async () => {
    const params = TestUtil.defaultHandleParams();

    params.req.method = "GET";
    params.req.url = "/home";
    const mockFileStream = TestUtil.generateReadableStream(["home"]);

    jest
      .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockResolvedValue({
        stream: mockFileStream,
      });
    jest.spyOn(mockFileStream, "pipe").mockReturnValue();

    await handler(...params.values());

    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(
      pages.homeHTML
    );
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.res);
  });

  test(`GET /controller - should return response with ${pages.controllerHTML} stream`, async () => {
    const params = TestUtil.defaultHandleParams();

    params.req.method = "GET";
    params.req.url = "/controller";
    const mockFileStream = TestUtil.generateReadableStream(["controller"]);

    jest
      .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockResolvedValue({
        stream: mockFileStream,
      });
    jest.spyOn(mockFileStream, "pipe").mockReturnValue();

    await handler(...params.values());

    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(
      pages.controllerHTML
    );
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.res);
  });

  test(`GET /index.html - should return response with file stream`, async () => {
    const filename = "/index.html";
    const params = TestUtil.defaultHandleParams();
    params.req.method = "GET";
    params.req.url = filename;
    const expectedType = ".html";
    const mockFileStream = TestUtil.generateReadableStream(["file"]);

    jest
      .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockResolvedValue({
        stream: mockFileStream,
        type: expectedType,
      });

    jest.spyOn(mockFileStream, "pipe").mockReturnValue();

    await handler(...params.values());
    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(
      params.req.url
    );
    expect(params.res.writeHead).toHaveBeenCalledWith(STATUS_CODE["SUCCESS"], {
      "Content-Type": CONTENT_TYPE[expectedType],
    });

    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.res);
  });

  test(`GET /file.ext - should return response with file stream`, async () => {
    const filename = "/file.ext";
    const params = TestUtil.defaultHandleParams();
    params.req.method = "GET";
    params.req.url = filename;
    const expectedType = ".ext";
    const mockFileStream = TestUtil.generateReadableStream(["file"]);

    jest
      .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
      .mockResolvedValue({
        stream: mockFileStream,
        type: expectedType,
      });

    jest.spyOn(mockFileStream, "pipe").mockReturnValue();

    await handler(...params.values());
    expect(Controller.prototype.getFileStream).toHaveBeenCalledWith(
      params.req.url
    );
    expect(params.res.writeHead).not.toHaveBeenCalled();
    expect(mockFileStream.pipe).toHaveBeenCalledWith(params.res);
  });

  test(`GET /unknown - given an inexistent route it should return response with status 404`, async () => {
    const params = TestUtil.defaultHandleParams();
    params.req.method = "POST";
    params.req.url = "/unknown";
    await handler(...params.values());
    expect(params.res.writeHead).toHaveBeenCalledWith(STATUS_CODE["NOT_FOUND"]);
    expect(params.res.end).toHaveBeenCalled();
  });

  test("POST /controller - given an existent command, it should returns a response with the result", async () => {
    const params = TestUtil.defaultHandleParams();
    const command = JSON.stringify({ command: "start" });
    const expectedResult = JSON.stringify({
      result: "ok",
    });

    params.req.method = "POST";
    params.req.url = "/controller";
    params.req.body = command;

    const handleCommand = jest
      .spyOn(Controller.prototype, Controller.prototype.handleCommand.name)
      .mockResolvedValue({
        result: expectedResult,
      });

    await handler(...params.values());
    expect(handleCommand).toHaveBeenCalledWith(JSON.parse(command));
    expect(params.res.end).toHaveBeenCalledTimes(1);
  });

  test(`GET /stream - this should return the audio stream`, async () => {
    const params = TestUtil.defaultHandleParams();
    const mockClientStream = TestUtil.generateReadableStream(["file"]);
    params.req.method = "GET";
    params.req.url = "/stream?id=12345";

    jest.spyOn(mockClientStream, "pipe").mockReturnValue();
    const createClientStream = jest
      .spyOn(Controller.prototype, Controller.prototype.createClientStream.name)
      .mockReturnValue({
        onClose: jest.fn(),
        stream: mockClientStream,
      });

    await handler(...params.values());

    expect(params.res.writeHead).toHaveBeenCalledWith(STATUS_CODE["SUCCESS"], {
      "Content-Type": "audio/mpeg",
      "Accept-Ranges": "bytes",
    });
    expect(createClientStream).toHaveBeenCalled();
    expect(mockClientStream.pipe).toHaveBeenCalledWith(params.res);
  });

  describe("exceptions", () => {
    test("given inexistent file it should return response with status 404", async () => {
      const params = TestUtil.defaultHandleParams();
      params.req.method = "GET";
      params.req.url = "/index.png";
      jest
        .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
        .mockRejectedValue(
          new Error("Error: ENOENT: no such file or directory")
        );
      await handler(...params.values());
    });

    test("given an error should return response with status 500", async () => {
      const params = TestUtil.defaultHandleParams();
      params.req.method = "GET";
      params.req.url = "/index.png";
      jest
        .spyOn(Controller.prototype, Controller.prototype.getFileStream.name)
        .mockRejectedValue(new Error("Error"));

      await handler(...params.values());

      expect(params.res.writeHead).toHaveBeenCalledWith(
        STATUS_CODE["INTERNAL_SERVER_ERROR"]
      );
      expect(params.res.end).toHaveBeenCalled();
    });
  });
});
