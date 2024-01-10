import { delistingStore } from "../delisting-store";
import {
    logger,
    notifyAndLogError,
    notifyAndLogInfo,
    notifyAndLogWarn,
} from "../logger";
import type {
    DelistingAnnouncementParser,
    DelistingCrawlerParser,
} from "../types";

const topic = "okx";

export const okxCoinHandler: DelistingCrawlerParser = async (
    exchange,
    market,
    requestUrl,
    response
) => {
    try {
        // Example of the response:
        // {"code":"0","data":[{"bannerShow":"1","content":"This trading pair will be officially delisted by OKX on 1/12/2024, 8:00 AM UTC.
        // Please be aware of your assets management.","frameShow":"1","instId":"DOME-USDT","instType":"SPOT","modifyTime":"1704441967000",
        // "noticeUrl":"/help/okx-to-delist-dome-and-fame-spot-trading-pairs","productId":"53088","title":"Risk Warning"}],"msg":""}
        //
        // Example of the e

        if (
            response &&
            response.data &&
            response.data.length &&
            response.data[0].content &&
            response.data[0].content.includes("delisted")
        ) {
            await delistingStore.addSymbols([
                {
                    exchange,
                    symbol: market,
                    timestamp: Date.now(),
                    url: requestUrl,
                },
            ]);
        } else if (response.msg === "Incorrect type of instId") {
            notifyAndLogWarn(
                `Incorrect symbol, exchange: ${exchange}, symbol: ${market}`,
                topic
            );
        } else if (response?.data) {
            // All is ok, coint is not delisted
        } else {
            notifyAndLogWarn(
                `Unrecognized response, exchange: ${exchange}, symbol: ${market}, url: ${requestUrl}`,
                topic
            );
            try {
                logger.info(JSON.stringify(response));
            } catch (e) {}
        }
    } catch (e) {
        notifyAndLogError(
            `Error: ${exchange}, url: ${requestUrl}, ${(e as Error).message}`,
            topic
        );
    }
};

export const okxAnnouncementHandler: DelistingAnnouncementParser = (
    exchange,
    markets,
    requestUrl,
    response
) => {
    try {
        throw new Error("not implemented");
    } catch (e) {
        notifyAndLogError((e as Error).message, topic);
    }
};
