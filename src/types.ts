import type { ExchangeEnum } from "./enums";

export interface ExchangeMarkets {
    [exchange: string]: string[];
}

export interface CrawlSources {
    announcement: {
        [exchange: string]: string;
    };
}

export type DelistingAnnouncementParser = (
    exchange: ExchangeEnum,
    markets: string[],
    requestUrl: string,
    response: any
) => void;

export interface DelistedSymbol {
    exchange: ExchangeEnum;
    symbol: string;
    timestamp: number;
    url?: string;
}
