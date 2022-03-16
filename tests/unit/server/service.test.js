import { jest, beforeEach, expect, describe, test } from "@jest/globals";
import fs from "fs";
import { Service } from "../../../server/service";
import TestUtil from "../utils/test.util";
import { extname } from "path";
import config from "../../../server/config.js";

const {
  dir: { publicDirectory },
  pages: { homeHTML },
} = config;

describe("#Service - test suite for services", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  test("getFileInfo - given an existent filename getFileInfo method should be able to returns the full file path and the file type", async () => {
    const service = new Service();
    const expectedType = extname(homeHTML);
    const expectedName = `${publicDirectory}/${homeHTML}`;
    const { type, name } = await service.getFileInfo(homeHTML);

    expect(type).toStrictEqual(expectedType);
    expect(name).toStrictEqual(expectedName);
  });

  test("getFileStream - given an file, getFileStream should call getFileInfo and createFileStream to returns an stream and file type", async () => {
    const service = new Service();
    const expectedType = extname(homeHTML);
    const expectedName = `${publicDirectory}/${homeHTML}`;
    const mockFileStream = TestUtil.generateReadableStream(["any"]);

    jest
      .spyOn(Service.prototype, Service.prototype.getFileInfo.name)
      .mockReturnValue({
        name: expectedName,
        type: expectedType,
      });

    const createFileStream = jest
      .spyOn(Service.prototype, Service.prototype.createFileStream.name)
      .mockReturnValue(mockFileStream);

    const result = await service.getFileStream(homeHTML);
    expect(createFileStream).toHaveBeenCalledWith(expectedName);
    expect(result).toStrictEqual({
      stream: mockFileStream,
      type: expectedType,
    });
  });

  test("createFileStream - given an filename createFileStream should be able to returns an readable stream", async () => {
    const service = new Service();
    const mockFileStream = TestUtil.generateReadableStream(["any"]);

    jest.spyOn(fs, fs.createReadStream.name).mockReturnValue(mockFileStream);
    const result = service.createFileStream(homeHTML);

    expect(fs.createReadStream).toHaveBeenCalledWith(homeHTML);
    expect(result).toEqual(mockFileStream);
  });
});
