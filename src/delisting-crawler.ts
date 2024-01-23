import { binanceAnnouncementHandler } from "./crawler-handlers/binance-crawler-handler.js";
import { bybitAnnouncementHandler } from "./crawler-handlers/bybit-crawler-handler.js";
import {
    kucoinAnnouncementHandler,
    kucoinCoinHandler,
} from "./crawler-handlers/kucoin-crawler-handler.js";
import { okxAnnouncementHandler } from "./crawler-handlers/okx-crawler-handler.js";
import { ExchangeEnum, ResourceType } from "./enums.js";
import { logger, notifyAndLogError } from "./logger.js";
import type { CrawlSources, ExchangeMarkets } from "./types.js";
import * as fs from "fs";
import axios from "axios";

export class DelistingCrawler {
    exchangeMarkets: ExchangeMarkets = {};

    constructor(
        public readonly exchangeMarketsFilePath: string,
        public readonly crawlSources: CrawlSources
    ) {
        this.listenExchangeMarkets();
    }

    async run(): Promise<void> {
        this.checkAnnouncementPages();
        this.checkEachCoin();
    }

    async checkEachCoin() {
        this.checkEachCoinWithInterval(
            ExchangeEnum.Kucoin,
            kucoinCoinHandler,
            1000,
            1000
        );
    }

    async checkAnnouncementPages() {
        this.checkAnnouncementPageWithInterval(
            ExchangeEnum.Bybit,
            bybitAnnouncementHandler,
            5000,
            5000
        );
        this.checkAnnouncementPageWithInterval(
            ExchangeEnum.Kucoin,
            kucoinAnnouncementHandler,
            5000,
            5000
        );
        this.checkAnnouncementPageWithInterval(
            ExchangeEnum.Binance,
            binanceAnnouncementHandler,
            10000,
            10000
        );
        this.checkAnnouncementPageWithInterval(
            ExchangeEnum.Okx,
            okxAnnouncementHandler,
            5000,
            5000
        );
    }

    async checkEachCoinWithInterval(
        exchange: ExchangeEnum,
        callback: any,
        intervalMs: number,
        retryMs: number,
        markets?: string[]
    ) {
        let _markets =
            markets && markets.length
                ? markets
                : [...(this.exchangeMarkets[exchange] || [])];
        const dataSourceUrl = this.crawlSources.oneCoin[exchange];

        const _market = _markets.shift();
        const market = _market?.replace("/", "-"); // In the json file all of the symbols are with /, but in this request we need -

        if (!market || !dataSourceUrl) {
            return setTimeout(() => {
                this.checkEachCoinWithInterval(
                    exchange,
                    callback,
                    intervalMs,
                    retryMs
                );
            }, retryMs);
        }

        const requestUrl = dataSourceUrl.replace("{{symbol}}", market);
        let response;

        try {
            const rawResponse: any = await axios.get(requestUrl);
            response = await rawResponse.data;

            await callback(exchange, market, requestUrl, response);

            // in case the default interval is cause of To Many Requests, we should increase it
            let newInterval = intervalMs;
            if (retryMs !== intervalMs) {
                newInterval = intervalMs + 1000;
                logger.info(
                    `Market request interval increased from ${
                        intervalMs / 1000
                    } to ${newInterval / 1000} sec, exchange: ${exchange}`,
                    {
                        label: "Crawler",
                    }
                );
            }

            setTimeout(() => {
                this.checkEachCoinWithInterval(
                    exchange,
                    callback,
                    newInterval,
                    newInterval,
                    _markets
                );
            }, newInterval);
        } catch (e) {
            const err: any = e;
            if (
                err &&
                err.response &&
                err.response.statusText &&
                err.response.statusText
                    .toLocaleLowerCase()
                    .includes("too many requests")
            ) {
                const retryIn = retryMs * 2;
                logger.warn(
                    `To many requests to market page, market: ${market}, exchange: ${exchange}, retrying in ${
                        retryIn / 1000
                    } sec..`,
                    { label: "Crawler" }
                );
                setTimeout(() => {
                    this.checkEachCoinWithInterval(
                        exchange,
                        callback,
                        intervalMs,
                        retryIn,
                        _markets
                    );
                }, retryIn);
            } else {
                const msg = (e as Error).message;
                notifyAndLogError(msg, "Crawler");
                throw new Error(msg);
            }
        }
    }

    async checkAnnouncementPageWithInterval(
        exchange: ExchangeEnum,
        callback: any,
        intervalMs: number,
        retryMs: number
    ) {
        const dataSourceUrl = this.crawlSources.announcement[exchange];

        let markets = [...(this.exchangeMarkets[exchange] || [])];

        if (!markets || !dataSourceUrl) {
            return;
        }

        let response;

        try {
            const rawResponse: any = await axios.get(dataSourceUrl.url);
            response = await (dataSourceUrl.type === ResourceType.JSON
                ? rawResponse.data
                : rawResponse);
            await callback(exchange, markets, dataSourceUrl.url, response);
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

            setTimeout(() => {
                this.checkAnnouncementPageWithInterval(
                    exchange,
                    callback,
                    newInterval,
                    newInterval
                );
            }, newInterval);
        } catch (e) {
            const err: any = e;
            if (
                err &&
                err.response &&
                err.response.statusText &&
                err.response.statusText
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
                const msg = (e as Error).message;
                notifyAndLogError(msg, "Crawler");
                throw new Error(msg);
            }
        }
    }

    private async listenExchangeMarkets(): Promise<void> {
        setInterval(async () => {
            const exchangeMarkets = JSON.parse(
                fs.readFileSync(
                    `./dist/${this.exchangeMarketsFilePath}`,
                    "utf8"
                )
            );

            this.exchangeMarkets = exchangeMarkets;
        }, 1000);
    }
}
