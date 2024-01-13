import { SYMBOL_PAIR_REGEXP } from "../constants.js";
import { delistingStore } from "../delisting-store.js";
import axios from "axios";
import { logger, notifyAndLogError, notifyAndLogInfo } from "../logger.js";
import type { DelistedSymbol, DelistingAnnouncementParser } from "../types.js";
import jsdom from "jsdom";

const topic = "binance";
const { JSDOM } = jsdom;

export const binanceAnnouncementHandler: DelistingAnnouncementParser = async (
    exchange,
    markets,
    requestUrl,
    response
) => {
    try {
        if (
            response.success === true &&
            response.data &&
            response.data.catalogs &&
            response.data.catalogs.length
        ) {
            // catalogName: "Delisting"
            let delistingsCatalog = response.data.catalogs.find(
                (c: any) => c.catalogName === "Delisting"
            );
            if (!delistingsCatalog) {
                notifyAndLogInfo(
                    `Binance delisting catalog property not found, url: ${requestUrl}`,
                    topic
                );
                return;
            }

            const articleCode = delistingsCatalog.articles[0].code;

            // example https://www.binance.com/en/support/announcement/f0605a9f50cf4ee684e34151413fa7c3
            const url = `https://www.binance.com/en/support/announcement/${articleCode}`;

            try {
                const delistingSymbols: DelistedSymbol[] = [];
                const content: any = await axios.get(url);

                // convert string to dom
                const dom = new JSDOM(content.data);
                const document = dom.window.document;

                // Select element with announce
                const element = document.getElementById("support_article");

                if (!element) {
                    notifyAndLogError(
                        `Can't find support_article element, ${exchange}, url: ${requestUrl}`,
                        topic
                    );
                    return;
                }

                // Convert element to string
                const elementString = element.outerHTML;

                const regexpResult = elementString.match(SYMBOL_PAIR_REGEXP); // should be an array, like ['CGG/USDT', 'ACA/BTC', 'FALCONS/USDT']
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
