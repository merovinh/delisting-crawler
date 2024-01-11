import { SYMBOL_PAIR_REGEXP } from "../constants";
import { delistingStore } from "../delisting-store";
import { logger, notifyAndLogError } from "../logger";
import type { DelistedSymbol, DelistingAnnouncementParser } from "../types";

const topic = "kucoin";

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

            // example https://assets.staticimg.com/cms/articles/en-st-kucoin-will-delist-certain-projects-20231221.json
            const url = `https://assets.staticimg.com/cms/articles${response.items[0].path}.json`;
            try {
                const delistingSymbols: DelistedSymbol[] = [];
                const rawResponse = await fetch(url);
                const content = await rawResponse.json();
                const regexpResult = content.content.match(SYMBOL_PAIR_REGEXP); // should be an array, like ['CGG/USDT', 'ACA/BTC', 'FALCONS/USDT']
                const result = [...new Set([...(regexpResult || [])])];

                if (result && result.length) {
                    for (let i = 0; i < result.length; i++) {
                        if (markets.some((m) => m === result[i])) {
                            delistingSymbols.push({
                                exchange,
                                symbol: result[i],
                                timestamp: Date.now(),
                                url,
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
