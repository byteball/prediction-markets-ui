# prediction markets UI

## Install

Install node.js (see `.nvmrc`), clone the repository, then say

```sh
yarn
```

## ENV

Copy the appropriate .env.XXXX file to .env

## Run

```sh
yarn start
```

## Checks

```sh
yarn typecheck   # tsc
yarn lint        # eslint, including the FSD layer boundaries
yarn test        # vitest
yarn build       # production build into ./build (read by prophet-backend)
```

## Donations

We accept donations through [Kivach](https://kivach.org) and forward a portion of the donations to other open-source projects that made Prophet possible.

[![Kivach](https://kivach.org/api/banner?repo=byteball/prediction-markets-ui)](https://kivach.org/repo/byteball/prediction-markets-ui)
