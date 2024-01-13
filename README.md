# How it works

Multi exchange delisting crawler monitoring the announcement page on each exchange. If it find that the symbol from your list is going to be delisted, it will write this symbol to the ./src/delisted-symbols.json file. The app starts http server and you can get your delisted-symbols.json by localhost:3000/delisting

In case a new delisting symbol is found you will be notified in your telegram.

Crawler parses announcement page with interval. In case it gets an error "Too Many Requests", it will increase an interval to avoid ban.

# Installation

Environment vars. Make a copy of env file and change it.

```
cp .env.example .env
```

Add symbols you want to monitor to ./src/exchange-markets.json

To install dependencies:

```bash
npm install
```

To run:

```bash
npm run start
```

# Supported exchanges

-   Binance
-   Bybit
-   Kucoin
-   Okx
