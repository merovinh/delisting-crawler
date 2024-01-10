import { SYMBOL_PAIR_REGEXP } from "../constants";
import { delistingStore } from "../delisting-store";
import { logger, notifyAndLogError, notifyAndLogWarn } from "../logger";
import type { DelistedSymbol, DelistingAnnouncementParser } from "../types";

const topic = "bybit";

export const bybitAnnouncementHandler: DelistingAnnouncementParser = async (
    exchange,
    markets,
    requestUrl,
    response
) => {
    try {
        const delistingSymbols: DelistedSymbol[] = [];
        if (
            response &&
            response.result &&
            response.result.list &&
            response.result.list.length
        ) {
            const content = response.result.list[1].description;

            // example: https://announcements.bybit.com/en-US/article/notice-on-delisting-of-nxd-posi-gas-driv-dfl-and-fiu-bltbd742117e4c1b566/
            // Bybit will be delisting the Spot trading pairs, NXD/USDT, POSI/USDT, GAS/USDT, DRIV/USDT, DFL/USDT and FIU/USDT, with effect from Mar 10, 2023 at 6AM UTC.
            const url = response.result.list[1].url;

            const regexpResult = content.match(SYMBOL_PAIR_REGEXP); // should be an array, like ['CGG/USDT', 'ACA/BTC', 'FALCONS/USDT']
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
        } else {
            notifyAndLogWarn(
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
