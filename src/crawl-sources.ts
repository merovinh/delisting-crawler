import { ResourceType } from "./enums.js";

export const crawlSources = {
    oneCoin: {
        okx: "https://www.okx.com/priapi/v5/public/trade/notice?instId={{symbol}}&instType=SPOT", // DOME-USDT
        kucoin: "https://www.kucoin.com/_api/trade-front/risk/tips/{{symbol}}", // HERO-USDT
        binance: "",
        bybit: "",
    },
    announcement: {
        // Announcement pages
        okx: {
            url: "https://www.okx.com/help/section/announcements-latest-announcements",
            type: ResourceType.TEXT,
        },
        kucoin: {
            url: "https://www.kucoin.com/_api/cms/articles?category=delistings&page=1&pageSize=1",
            type: ResourceType.JSON,
        },
        binance: {
            url: "https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&pageSize=1&pageNo=1",
            type: ResourceType.JSON,
        },
        bybit: {
            url: "https://api.bybit.com/v5/announcements/index?locale=en-US&type=delistings&tag=Spot",
            type: ResourceType.JSON,
        },
    },
};
