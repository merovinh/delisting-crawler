import {
    binanceAnnouncementHandler,
    binanceCoinHandler,
} from "./crawler-handlers/binance-crawler-handler";
import { bybitAnnouncementHandler } from "./crawler-handlers/bybit-crawler-handler";
import {
    kucoinAnnouncementHandler,
    kucoinCoinHandler,
} from "./crawler-handlers/kucoin-crawler-handler";
import { okxCoinHandler } from "./crawler-handlers/okx-crawler-handler";
import { ExchangeEnum } from "./enums";
import { logger } from "./logger";
import type { CrawlSources, ExchangeMarkets } from "./types";

export class DelistingCrawler {
    exchangeMarkets: ExchangeMarkets = {};

    constructor(
        public readonly exchangeMarketsFilePath: string,
        public readonly crawlSources: CrawlSources,
        public readonly eachCoinCheckIntervalMs = 1000
    ) {
        this.listenExchangeMarkets();
    }

    async run(): Promise<void> {
        // this.checkEachCoin();
        this.checkAnnouncementPages();
    }

    async checkEachCoin() {
        this.checkEachCoinWithInterval(ExchangeEnum.Okx, okxCoinHandler);
        this.checkEachCoinWithInterval(ExchangeEnum.Kucoin, kucoinCoinHandler);
        this.checkEachCoinWithInterval(
            ExchangeEnum.Binance,
            binanceCoinHandler
        );
        // TODO: can't find api url for bybit
    }

    async checkAnnouncementPages() {
        this.checkAnnouncementPageWithInterval(
            ExchangeEnum.Bybit,
            bybitAnnouncementHandler,
            2000,
            2000
        );
        this.checkAnnouncementPageWithInterval(
            ExchangeEnum.Kucoin,
            kucoinAnnouncementHandler,
            2000,
            2000
        );
        this.checkAnnouncementPageWithInterval(
            ExchangeEnum.Binance,
            binanceAnnouncementHandler,
            10000,
            10000
        );
    }

    async checkAnnouncementPageWithInterval(
        exchange: ExchangeEnum,
        callback: any,
        intervalMs: number,
        retryMs: number
    ) {
        const dataSourceUrl = this.crawlSources.allCoins[exchange];

        let markets = [...(this.exchangeMarkets[exchange] || [])];

        if (!markets || !dataSourceUrl) {
            return;
        }

        let response;

        try {
            const rawResponse = await fetch(dataSourceUrl);
            if (
                rawResponse.statusText
                    .toLocaleLowerCase()
                    .includes("too many requests")
            ) {
                const retryIn = retryMs * 2;
                logger.warn(
                    `To many requests to announcement page, exchange: ${exchange}, retrying in ${
                        retryIn / 1000
                    } sec..`,
                    { label: "Crawler" }
                );
                setTimeout(() => {
                    this.checkAnnouncementPageWithInterval(
                        exchange,
                        callback,
                        intervalMs,
                        retryIn
                    );
                }, retryIn);
            } else {
                response = await rawResponse.json();
                await callback(exchange, markets, dataSourceUrl, response);
                // in case the default interval is cause of To Many Requests, we should increase it
                let newInterval = intervalMs;
                if (retryMs !== intervalMs) {
                    newInterval = intervalMs + 1000;
                    logger.info(
                        `Announcement request interval increased from ${
                            intervalMs / 1000
                        } to ${newInterval / 1000} sec, exchange: ${exchange}`,
                        {
                            label: "Crawler",
                        }
                    );
                }

                logger.info(`Response is correct, exchange: ${exchange}`, {
                    label: "Crawler",
                });

                setTimeout(() => {
                    this.checkAnnouncementPageWithInterval(
                        exchange,
                        callback,
                        newInterval,
                        newInterval
                    );
                }, newInterval);
            }
        } catch (e) {
            const message = (e as Error).message;
            console.error(
                `Error, exchange: ${exchange}, url: ${dataSourceUrl}`
            );
            console.error(message);
        }
    }

    async checkEachCoinWithInterval(exchange: ExchangeEnum, callback: any) {
        let markets = [...(this.exchangeMarkets[exchange] || [])];
        const dataSourceUrl = this.crawlSources.oneCoin[exchange];

        setInterval(async () => {
            const _market = markets.shift();
            const market = _market?.replace("/", "-"); // In the json file all of the symbols are with /, but in this request we need -

            if (!market || !dataSourceUrl) {
                markets = [...(this.exchangeMarkets[exchange] || [])];
                return;
            }

            const requestUrl = dataSourceUrl.replace("{{symbol}}", market);
            let response;

            try {
                const rawResponse = await fetch(requestUrl);
                response = await rawResponse.json();
            } catch (e) {
                const message = (e as Error).message;
                console.error(
                    `Error, exchange: ${exchange}, symbol: ${market}, url: ${requestUrl}`
                );
                console.error(message);
            }

            await callback(exchange, market, requestUrl, response);
        }, this.eachCoinCheckIntervalMs);
    }

    private async listenExchangeMarkets(): Promise<void> {
        setInterval(async () => {
            const file = Bun.file(
                import.meta.dir + `/${this.exchangeMarketsFilePath}`
            );
            const exchangeMarkets = await file.json();

            this.exchangeMarkets = exchangeMarkets;
        }, 1000);
    }
}
