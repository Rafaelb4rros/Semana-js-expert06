import config from "./config.js";
import { Controller } from "./controller.js";
import { logger } from "./util.js";

const {
  location,
  pages: { homeHTML, controllerHTML },
  constants: { CONTENT_TYPE },
} = config;
const controller = new Controller();

const routes = async (req, res) => {
  const { method, url } = req;

  if (method === "GET" && url === "/") {
    res.writeHead(302, {
      Location: location.home,
    });
    return res.end();
  }

  if (method === "GET" && url === "/home") {
    const { stream } = await controller.getFileStream(homeHTML);
    return stream.pipe(res);
  }

  if (method === "GET" && url === "/controller") {
    const { stream } = await controller.getFileStream(controllerHTML);
    return stream.pipe(res);
  }

  if (method === "GET") {
    const { stream, type } = await controller.getFileStream(url);
    const contentType = CONTENT_TYPE[type];

    if (contentType) {
      res.writeHead(200, {
        "Content-Type": contentType,
      });
    }

    return stream.pipe(res);
  }

  res.writeHead(404);
  return res.end();
};

const handleError = async (error, res) => {
  if (error.message.includes("ENOENT")) {
    logger.warn(`asset not found ${error.stack}`);
    res.writeHead(404);
    return res.end();
  }

  logger.error(`caught error on API ${error.stack}`);
  res.writeHead(500);
  return res.end();
};

export const handler = (req, res) => {
  return routes(req, res).catch((err) => handleError(err, res));
};
