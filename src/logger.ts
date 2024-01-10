import pkg, { Logger } from "winston";
import { notify } from "./telegram-bot.js";

const { createLogger, format, transports } = pkg;
const { combine, timestamp: tsFormat, json, colorize, errors, printf } = format;

const fileFormat = combine(tsFormat(), errors({ stack: true }), json());
const consoleFormat = combine(
    colorize({ colors: { info: "blue" } }),
    tsFormat(),
    printf(
        ({ level, message, label, timestamp }) =>
            `${timestamp} [${label}] ${level}: ${message}`
    )
);

export const logger: Logger = createLogger({
    level: "debug",
    transports: [
        new transports.File({
            filename: `./logs/combined.log`,
            format: fileFormat,
            options: { flags: "w" },
        }),
        new transports.Console({ format: consoleFormat }),
    ],
    exceptionHandlers: [
        new transports.Console({ format: consoleFormat }),
        new transports.File({
            filename: `./logs/exceptions.log`,
            options: { flags: "w" },
        }),
    ],
});

export const notifyAndLogError = (message: string, topic: string): void => {
    logger.error(message, { label: topic });
    notify(message);
};

export const notifyAndLogWarn = (message: string, topic: string): void => {
    logger.warn(message, { label: topic });
    notify(message);
};

export const notifyAndLogInfo = (message: string, topic: string): void => {
    logger.info(message, { label: topic });
    notify(message);
};
