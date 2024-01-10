export const crawlSources = {
    announcement: {
        // Announcement pages
        okx: "",
        kucoin: "https://www.kucoin.com/_api/cms/articles?category=delistings&page=1&pageSize=1",
        binance:
            "https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&pageSize=1&pageNo=1",
        bybit: "https://api.bybit.com/v5/announcements/index?locale=en-US&type=delistings&tag=Spot",
    },
};

// https://www.binance.com/en/support/announcement/delisting?c=161&navId=161
// https://www.binance.com/bapi/composite/v1/public/cms/article/list/query?type=1&pageSize=1&pageNo=1
// https://www.binance.com/en/support/announcement/f0605a9f50cf4ee684e34151413fa7c3
