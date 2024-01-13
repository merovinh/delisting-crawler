import { delistingStore } from "../delisting-store.js";
import axios from "axios";
import { logger, notifyAndLogError } from "../logger.js";
import type { DelistedSymbol, DelistingAnnouncementParser } from "../types.js";

const topic = "okx";

export const okxAnnouncementHandler: DelistingAnnouncementParser = async (
    exchange,
    markets,
    requestUrl,
    response
) => {
    try {
        if (response) {
            const regexpResult = [
                ...response.data.matchAll(
                    /index_listWrap.*?href="(\/help\/.*?)"/g
                ),
            ];
            if (!regexpResult || !regexpResult.length) {
                notifyAndLogError(
                    `Can't find announcement url, exchange: ${exchange}, url: ${requestUrl}`,
                    topic
                );
                return;
            }

            // const url = "https://www.okx.com/help/okx-to-delist-several-spot-trading-pairs-12-29";
            const url = `https://www.okx.com${regexpResult[0][1]}`;

            try {
                const delistingSymbols: DelistedSymbol[] = [];
                const content: any = await axios.get(url);
                const regexpResult = content.data.match(
                    /[0-9A-Z]+[\/\-][0-9A-Z]+/g
                ); // should be an array, like ['CGG/USDT', 'ANT-USDC']
                const result = [...new Set([...(regexpResult || [])])].map(
                    (s) => s.replace("-", "/")
                );

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
