import { jest, beforeEach, expect, describe, test } from "@jest/globals";
import { Controller } from "../../../server/controller";
import { Service } from "../../../server/service";
import config from "../../../server/config.js";
import TestUtil from "../utils/test.util.js";
import { PassThrough } from "stream";
import { extname } from "path";

const {
  pages: { homeHTML },
} = config;

describe("#Controller - test suite for controller", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test("getFileStream should be able to returns getFileStream service method", async () => {
    const controller = new Controller();
    const mockFileStream = TestUtil.generateReadableStream(["filename"]);
    const filetype = extname(homeHTML);

    const getFileStream = jest
      .spyOn(Service.prototype, Service.prototype.getFileStream.name)
      .mockResolvedValue({
        stream: mockFileStream,
        type: filetype,
      });

    const { stream, type } = await controller.getFileStream(homeHTML);

    expect(getFileStream).toHaveBeenCalledWith(homeHTML);
    expect(stream).toStrictEqual(mockFileStream);
    expect(type).toStrictEqual(filetype);
  });
  test("handleCommand - given the start command it should call service method", async () => {
    const controller = new Controller();
    const command = {
      command: "start",
    };
    const expectedResult = {
      result: "ok",
    };
    const startStreaming = jest.spyOn(
      Service.prototype,
      Service.prototype.startStreaming.name
    );

    const result = await controller.handleCommand(command);
    expect(result).toStrictEqual(expectedResult);
    expect(startStreaming).toHaveBeenCalled();
  });
  test("handleCommand - given the stop command it should call service method", async () => {
    const controller = new Controller();
    const command = {
      command: "stop",
    };
    const expectedResult = {
      result: "ok",
    };
    const startStreaming = jest.spyOn(
      Service.prototype,
      Service.prototype.stopStreaming.name
    );

    const result = await controller.handleCommand(command);
    expect(result).toStrictEqual(expectedResult);
    expect(startStreaming).toHaveBeenCalled();
  });

  test("createClientStream - it should returns an stream and onCloseFunction", async () => {
    const controller = new Controller();
    const mockClientStream = new PassThrough();
    const mockID = "dasdsa";
    const onClose = jest.fn();

    const expectedResult = {
      onClose,
      stream: mockClientStream,
    };

    jest
      .spyOn(Service.prototype, Service.prototype.createClientStream.name)
      .mockReturnValue({ clientStream: mockClientStream, id: mockID });
    jest.spyOn(Service.prototype, Service.prototype.removeClientStream.name);

    const result = controller.createClientStream();
    result.onClose();

    expect(Service.prototype.createClientStream).toHaveBeenCalled();
    expect(result.stream).toStrictEqual(expectedResult.stream);
    expect(Service.prototype.removeClientStream).toHaveBeenCalledWith(mockID);
  });
});
