import { notifyAndLogInfo } from "./logger.js";
import type { DelistedSymbol } from "./types.js";
import * as fs from "fs";

class DelistingStore {
    store: DelistedSymbol[] = [];

    constructor() {}

    async initStore() {
        const symbols = JSON.parse(
            fs.readFileSync(`./dist/delisted-symbols.json`, "utf8")
        );
        this.store = symbols;
    }

    async addSymbols(delistedSymbols: DelistedSymbol[]) {
        for (let i = 0; i < delistedSymbols.length; i++) {
            const symbol = delistedSymbols[i];
            const alreadyAdded = this.store.find(
                (s) => s.symbol === symbol.symbol
            );

            if (alreadyAdded) {
                continue;
            }

            this.store.push(symbol);
            notifyAndLogInfo(
                `New delisting: ${symbol.symbol}, exchange: ${symbol.exchange}, url: ${symbol.url}`,
                "delisting-store"
            );
            fs.writeFileSync(
                `./dist/delisted-symbols.json`,
                JSON.stringify(this.store, null, 2)
            );
        }
    }
}

const store = new DelistingStore();
await store.initStore();

export const delistingStore = store;
