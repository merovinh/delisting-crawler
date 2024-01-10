import { notifyAndLogError } from "../logger";
import type { DelistingAnnouncementParser } from "../types";

const topic = "okx";

export const okxAnnouncementHandler: DelistingAnnouncementParser = (
    exchange,
    markets,
    requestUrl,
    response
) => {
    try {
        throw new Error("not implemented");
    } catch (e) {
        notifyAndLogError((e as Error).message, topic);
    }
};
