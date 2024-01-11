import { ResourceType } from "./enums";

export const crawlSources = {
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
