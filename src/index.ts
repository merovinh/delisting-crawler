import { crawlSources } from "./crawl-sources.js";
import { DelistingCrawler } from "./delisting-crawler.js";
import { logger } from "./logger.js";
import http from "http";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.ERROR_TELEGRAM_TOKEN) {
    throw new Error("Please add ERROR_TELEGRAM_TOKEN to .env");
}
if (!process.env.ERROR_TELEGRAM_CHAT_ID) {
    throw new Error("Please add ERROR_TELEGRAM_CHAT_ID to .env");
}
if (!process.env.TELEGRAM_TOKEN) {
    throw new Error("Please add TELEGRAM_TOKEN to .env");
}
if (!process.env.TELEGRAM_CHAT_ID) {
    throw new Error("Please add TELEGRAM_CHAT_ID to .env");
}

const dc = new DelistingCrawler("exchange-markets.json", crawlSources);

dc.run();

const server = http.createServer(async (req: any, res: any) => {
    try {
        if (req.url === "/delisting") {
            const data = fs.readFileSync(
                "./dist/delisted-symbols.json",
                "utf8"
            );
            const json = JSON.parse(data);

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(json));
        } else {
            res.writeHead(404);
            res.end("Not found");
        }
    } catch (err) {
        res.writeHead(500);
        res.end("Internal Server Error");
        console.error(err);
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    logger.info(`Listening on localhost:${PORT}`, { label: "index" });
});
