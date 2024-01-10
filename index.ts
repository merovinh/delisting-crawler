import { crawlSources } from "./src/crawl-sources";
import { DelistingCrawler } from "./src/delisting-crawler";
import { logger } from "./src/logger";

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

const server = Bun.serve({
    port: 3000,
    async fetch(req) {
        const url = new URL(req.url);
        if (url.pathname === "/delisting") {
            const file = Bun.file("./src/delisted-symbols.json");
            const json = await file.json();
            return new Response(JSON.stringify(json), {
                headers: {
                    "Content-Type": "application/json",
                },
            });
        }
        return new Response("Not found", {
            status: 404,
        });
    },
});

logger.info(`Listening on localhost:${server.port}`, { label: "index" });
