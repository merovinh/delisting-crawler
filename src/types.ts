import type { ExchangeEnum, ResourceType } from "./enums.js";

export interface ExchangeMarkets {
    [exchange: string]: string[];
}

export interface CrawlSource {
    url: string;
    type: ResourceType;
}
export interface CrawlSources {
    announcement: {
        [exchange: string]: CrawlSource;
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
