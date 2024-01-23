import { SYMBOL_PAIR_REGEXP } from "../constants.js";
import { delistingStore } from "../delisting-store.js";
import axios from "axios";
import { logger, notifyAndLogError } from "../logger.js";
import type {
    DelistedSymbol,
    DelistingAnnouncementParser,
    DelistingCrawlerParser,
} from "../types.js";

const topic = "kucoin";

export const kucoinCoinHandler: DelistingCrawlerParser = async (
    exchange,
    market,
    requestUrl,
    response
) => {
    try {
        if (
            response &&
            response.data &&
            (response.data.includes("Risk Warning") ||
                response.data.includes("Special Treatment"))
        ) {
            await delistingStore.addSymbols([
                {
                    exchange,
                    symbol: market,
                    timestamp: Date.now(),
                    url: requestUrl,
                },
            ]);
        } else if (response.data !== undefined) {
            // All is ok, coin is not delisted
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

export const kucoinAnnouncementHandler: DelistingAnnouncementParser = async (
    exchange,
    markets,
    requestUrl,
    response
) => {
    try {
        if (response.code === 200 && response.items && response.items.length) {
            if (!response.items[0].title.includes("ST:")) {
                // "ST: KuCoin Will Delist Certain Projects"
                return;
            }

            // const url = "https://assets.staticimg.com/cms/articles/en-st-kucoin-will-delist-certain-projects-20231221.json";
            const url = `https://assets.staticimg.com/cms/articles${response.items[0].path}.json`;
            try {
                const delistingSymbols: DelistedSymbol[] = [];
                const rawResponse: any = await axios.get(url);
                const content: any = rawResponse.data;
                const regexpResult = content.content.match(SYMBOL_PAIR_REGEXP); // should be an array, like ['CGG/USDT', 'ACA/BTC', 'FALCONS/USDT']
                const result = [...new Set([...(regexpResult || [])])];

                if (result && result.length) {
                    for (let i = 0; i < result.length; i++) {
                        if (markets.some((m) => m === result[i])) {
                            delistingSymbols.push({
                                exchange,
                                symbol: result[i],
                                timestamp: Date.now(),
                                url: `https://www.kucoin.com/announcement${response.items[0].path}`,
                            });
                        }
                    }
                    if (delistingSymbols.length) {
                        await delistingStore.addSymbols(delistingSymbols);
                    }
                } else {
                    notifyAndLogError(
                        `Can't find any symbol by regexp, ${exchange}, url: ${requestUrl}`,
                        topic
                    );
                }
            } catch (e) {
                notifyAndLogError(
                    `Error, exchange: ${exchange}, url: ${url}, err: ${
                        (e as Error).message
                    }`,
                    topic
                );
            }
        } else {
            notifyAndLogError(
                `Unrecognized response, exchange: ${exchange}, url: ${requestUrl}`,
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
function notifyAndLogWarn(arg0: string, topic: string) {
    throw new Error("Function not implemented.");
}
