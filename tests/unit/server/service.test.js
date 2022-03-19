import { jest, beforeEach, expect, describe, test } from "@jest/globals";
import fs from "fs";
import { Service } from "../../../server/service";
import TestUtil from "../utils/test.util";
import { PassThrough, Writable } from "stream";
import { extname } from "path";
import config from "../../../server/config.js";
import Throttle from "throttle";
import streamsAsync from "stream/promises";

const {
  dir: { publicDirectory },
  pages: { homeHTML },
  constants: { fallbackBitRate, bitRateDivisor },
} = config;

describe("#Service - test suite for services", () => {
  const getSpawnResponse = ({
    stdout = "",
    stderr = "",
    stdin = () => {},
  }) => ({
    stdout: TestUtil.generateReadableStream([stdout]),
    stderr: TestUtil.generateReadableStream([stderr]),
    stdin: TestUtil.generateWritableStream(stdin),
  });
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
  test("#createClientStream - it should returns an id and clientStream", async () => {
    const service = new Service();

    jest
      .spyOn(service.clientStreams, service.clientStreams.set.name)
      .mockReturnValue();

    const result = service.createClientStream();
    expect(result.id.length).toBeGreaterThan(0);
    expect(result.clientStream).toBeInstanceOf(PassThrough);
    expect(service.clientStreams.set).toHaveBeenCalledWith(
      result.id,
      result.clientStream
    );
  });
  test("removeClientStream - given an id, it should remove it from clientStreams set", async () => {
    const service = new Service();
    const mockId = "dasdsa";
    jest
      .spyOn(service.clientStreams, service.clientStreams.delete.name)
      .mockReturnValue();

    service.removeClientStream(mockId);
    expect(service.clientStreams.delete).toHaveBeenCalledWith(mockId);
  });
  test("#getBitRate - it should return the bitRate as string", async () => {
    const service = new Service();
    const song = "song";
    const args = ["--i", "-B", song];
    const spawnResponse = getSpawnResponse({
      stdout: "  1k  ",
    });

    jest
      .spyOn(service, service._executeSoxCommand.name)
      .mockReturnValue(spawnResponse);

    const bitRatePromise = service.getBitRate(song);
    const result = await bitRatePromise;

    expect(result).toStrictEqual("1000"),
      expect(service._executeSoxCommand).toHaveBeenCalledWith(args);
  });
  test("#getBitRate - when a error ocurr it should get the fallbackbitrate", async () => {
    const service = new Service();
    const song = "song";
    const args = ["--i", "-B", song];
    const spawnResponse = getSpawnResponse({
      stderr: "err",
    });

    jest
      .spyOn(service, service._executeSoxCommand.name)
      .mockReturnValue(spawnResponse);

    const bitRatePromise = service.getBitRate(song);
    const result = await bitRatePromise;

    expect(result).toStrictEqual(fallbackBitRate),
      expect(service._executeSoxCommand).toHaveBeenCalledWith(args);
  });
  test("broadCast - it should write for active client streams", async () => {
    const service = new Service();
    const onData = jest.fn();

    const client1 = TestUtil.generateWritableStream(onData);
    const client2 = TestUtil.generateWritableStream(onData);

    jest.spyOn(service.clientStreams, service.clientStreams.delete.name);

    service.clientStreams.set("1", client1);
    service.clientStreams.set("2", client2);
    client1.end();
    const writable = service.broadCast();
    writable.write("Hello world");

    expect(writable).toBeInstanceOf(Writable);
    expect(service.clientStreams.delete).toHaveBeenCalledTimes(1);
    expect(onData).toHaveBeenCalledTimes(1);
  });
  test("startStreaming - it should call the sox command", async () => {
    const service = new Service();
    const currentSong = "sng.mp3";
    service.currentSong = currentSong;
    const mockReadable = TestUtil.generateReadableStream(["song"]);
    const expectedResult = "ok";
    const writeBroadCaster = TestUtil.generateWritableStream(() => {});

    jest
      .spyOn(service, service.getBitRate.name)
      .mockReturnValue(fallbackBitRate);

    jest
      .spyOn(streamsAsync, streamsAsync.pipeline.name)
      .mockReturnValue(expectedResult);

    jest.spyOn(fs, fs.createReadStream.name).mockReturnValue(mockReadable);

    jest
      .spyOn(service, service.broadCast.name)
      .mockReturnValue(writeBroadCaster);

    const expectedThrottle = fallbackBitRate / bitRateDivisor;
    const result = await service.startStreaming();

    expect(service.currentBitRate).toEqual(expectedThrottle);
    expect(result).toEqual(expectedResult);
    expect(fs.createReadStream).toHaveBeenCalledWith(currentSong);
    expect(streamsAsync.pipeline).toHaveBeenCalledWith(
      mockReadable,
      service.throttleTransform,
      service.broadCast()
    );
  });
  test("#stopStreaming - existing throttleTransform", async () => {
    const service = new Service();
    service.throttleTransform = new Throttle(1);
    jest.spyOn(service.throttleTransform, "end").mockReturnValue();

    service.stopStreaming();
    expect(service.throttleTransform.end).toHaveBeenCalledTimes(1);
  });
  test("#stopStreaming - not existing throttleTransform", async () => {
    const service = new Service();
    expect(() => service.stopStreaming()).not.toThrow();
  });
});
