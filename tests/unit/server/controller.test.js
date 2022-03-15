import { jest, beforeEach, expect, describe, test } from "@jest/globals";
import { Controller } from "../../../server/controller";
import { Service } from "../../../server/service";
import TestUtil from "../utils/test.util";

describe("#Controller - test suite for controller", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test("Controller should be able to returns getFileStream service method", async () => {
    const filename = "/index.html";
    const filetype = ".html";
    const mockFileStream = TestUtil.generateReadableStream([filename]);

    jest
      .spyOn(Service.prototype, Service.prototype.getFileStream.name)
      .mockReturnValue({
        stream: mockFileStream,
        type: filetype,
      });

    await new Controller().getFileStream(filename);
    expect(Service.prototype.getFileStream).toHaveBeenCalledWith(filename);
  });
});
