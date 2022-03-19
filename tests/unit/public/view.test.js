import { jest, beforeEach, expect, describe, test } from "@jest/globals";
import { JSDOM } from "jsdom";
import { View } from "../../../public/controller/js/view.js";
import config from "../../../server/config.js";

const {
  pages,
  location,
  constants: { CONTENT_TYPE, STATUS_CODE },
} = config;

describe("#View - test suite for presentation layer", () => {
  const dom = new JSDOM();
  global.document = dom.window.document;
  global.window = dom.window;

  const makeBtnElement = (
    { text, classList } = {
      text: "",
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
      },
    }
  ) => {
    return {
      onclick: jest.fn(),
      classList,
      innerText: text,
    };
  };
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    const btn = makeBtnElement();
    jest.spyOn(document, document.getElementById.name).mockReturnValue(btn);
  });

  test("#changeCommandBtnsVisibility - hiven hide=true it should add unassigned class and reset onClick", () => {
    const view = new View();
    const btn = makeBtnElement();
    jest.spyOn(document, document.querySelectorAll.name).mockReturnValue([btn]);

    view.changeCommandBtnsVisibility();

    expect(btn.classList.add).toHaveBeenCalledWith("unassigned");
    expect(btn.onclick.name).toStrictEqual("onClickReset");

    expect(() => btn.onclick()).not.toThrow();
  });

  test("#changeCommandBtnsVisibility - hiven hide=true it should remove unassigned class and reset onClick", () => {
    const view = new View();
    const btn = makeBtnElement();
    jest.spyOn(document, document.querySelectorAll.name).mockReturnValue([btn]);

    view.changeCommandBtnsVisibility(false);

    expect(btn.classList.add).not.toHaveBeenCalled();
    expect(btn.classList.remove).toHaveBeenCalledWith("unassigned");
    expect(btn.onclick.name).toStrictEqual("onClickReset");
    expect(() => btn.onclick()).not.toThrow();
  });

  test("#onLoad", () => {
    const view = new View();

    jest.spyOn(view, view.changeCommandBtnsVisibility.name).mockReturnValue();

    view.onLoad();
    expect(view.changeCommandBtnsVisibility).toHaveBeenCalled();
  });
});
