import https from "https";

const query = (
    method: string,
    params: { [key: string]: any } = {},
    token: string
): void => {
    if (!params.chat_id) {
        return;
    }

    let url = `https://api.telegram.org/bot${token}/${method}`;

    const keys = Object.keys(params);

    if (keys.length !== 0) {
        url = Object.entries(params).reduce(
            (urlPart, [key, value]) => `${urlPart}&${key}=${value}`,
            `${url}?`
        );
    }

    https.get(url).on("error", (err: any) => {
        console.log(`Error: ${err.message}`);
    });
};

export const notify = (text: string, error: boolean = false) => {
    if (!text) {
        return;
    }

    let token = "";
    let chatId = "";

    if (error) {
        token = process.env.ERROR_TELEGRAM_TOKEN as string;
        chatId = process.env.ERROR_TELEGRAM_CHAT_ID as string;
    } else {
        token = process.env.TELEGRAM_TOKEN as string;
        chatId = process.env.TELEGRAM_CHAT_ID as string;
    }

    query(
        "sendMessage",
        {
            chat_id: chatId,
            text: `${text}`,
        },
        token
    );
};
