import { notifyAndLogInfo } from "./logger";
import type { DelistedSymbol } from "./types";

class DelistingStore {
    store: DelistedSymbol[] = [];
    file: string = `${import.meta.dir}/delisted-symbols.json`;

    constructor() {}

    async initStore() {
        const file = Bun.file(this.file);
        const symbols = await file.json();
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
                `New delisted symbol: ${symbol.symbol}, exchange: ${symbol.exchange}, url: ${symbol.url}`,
                "delisting-store"
            );
            await Bun.write(this.file, JSON.stringify(this.store, null, 2));
        }
    }
}

const store = new DelistingStore();
await store.initStore();

export const delistingStore = store;
