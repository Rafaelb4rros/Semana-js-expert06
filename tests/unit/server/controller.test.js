import { jest, beforeEach, expect, describe, test } from "@jest/globals";
import { Controller } from "../../../server/controller";
import { Service } from "../../../server/service";
import config from "../../../server/config.js";
import TestUtil from "../utils/test.util.js";
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
});
