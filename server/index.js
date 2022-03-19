import { server } from "./server.js ";
import { logger } from "./util.js";
import config from "./config.js";

server()
  .listen(config.port)
  .on("listening", () => logger.info(`server running on ${config.port}`));

process.on("uncaughtException", (err) =>
  logger.error(`uncaughtException ${err.stack || err}`)
);

process.on("unhandledException", (err) =>
  logger.error(`unhandledException ${err.stack || err}`)
);
