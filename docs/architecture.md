# Architecture: Feature-Sliced Design

`src/` is organised by [Feature-Sliced Design](https://feature-sliced.design/) layers. A layer may
import only from the layers **below** it; `eslint-plugin-boundaries` enforces this in `yarn lint`
(see `eslint.config.mjs`).

```
app       → pages → widgets → features → entities → shared
```

| Layer      | What lives there | Examples |
|------------|------------------|----------|
| `app`      | Composition root: entry (`main.tsx`), providers, router, root layout, store assembly, hub bootstrap, analytics init, global styles | `app/store`, `app/bootstrap`, `app/router/locale-sync.tsx` |
| `pages`    | One slice per route; the page composes widgets/features and owns page-only blocks | `pages/market` (header, outcomes, liquidity, SEO redirect) |
| `widgets`  | Large self-contained blocks reused across pages | `widgets/market-list`, `widgets/market-chart`, `widgets/header` |
| `features` | User actions that change something | `features/trade`, `features/add-liquidity`, `features/create-market`, `features/connect-wallet` |
| `entities` | Business objects: types, Redux slices, thunks, API requests, pure domain math, entity UI | `entities/market`, `entities/wallet`, `entities/reserve-asset`, `entities/oracle` |
| `shared`   | Reusable, domain-agnostic code organised by segment, not by slice | `shared/ui` (shadcn), `shared/api`, `shared/lib`, `shared/config`, `shared/i18n`, `shared/types` |

## Slices and segments

Every slice of `pages`, `widgets`, `features` and `entities` has segments: `ui/`, `model/`
(state, thunks, hooks), `api/`, `lib/` (pure functions), `config/`. Inside a slice files import each
other with relative paths. Other slices see only the public API:

- `index.ts` — the public API. Everything another layer may use is re-exported from here.
- `model.ts` — a second entry **for `app/store` only**, exporting reducers. It keeps the store
  assembly from pulling a slice's UI into the entry chunk.
- `@x/<consumer>.ts` — cross-imports between two entities (FSD `@x` notation). `entities/wallet/@x/market.ts`
  is what `entities/market` may import from the wallet; nothing else.

`shared` has no slices: import its segments directly (`@/shared/ui/button`, `@/shared/lib/redux`).

The `@/` alias points at `src/`. shadcn components are generated into `shared/ui`
(`npx shadcn add <component>`, see `components.json`).

## State ownership (Redux)

`shared/lib/redux` exports an empty `RootState` interface, the typed hooks and `AppThunkApiConfig`.
Each slice declares its key by module augmentation:

```ts
declare module "@/shared/lib/redux" {
  interface RootState { market: MarketState }
}
```

`app/store/root-reducer.ts` combines the reducers and fails to compile when the combined state and
the augmented `RootState` disagree. Read other slices' state only through their exported selectors.

| Key | Owner | Persisted |
|-----|-------|-----------|
| `locale` | `shared/i18n/model` | yes |
| `wallet` (address) | `entities/wallet` | yes |
| `walletBalances` | `entities/wallet` | no |
| `market` (opened market) | `entities/market` | no |
| `marketView` (price / odds) | `entities/market` | yes |
| `reserveAsset` (assets, rates, GBYTE candle cache) | `entities/reserve-asset` | yes |
| `bridges` | `entities/bridge` | no |
| `creationOrder` | `features/create-market` | yes |
| `searchCache` (market-data id lookups) | `shared/api/market-data` | yes |

Persistence: `app/store/persist.ts`. The localStorage key is unchanged from the pre-FSD app
(`persist:prediction314` / `persist:prediction-tn314`); version 4 migrates the old single `settings`
slice into the owners above. **Rollback caveat:** an older build (version 3) cannot read a version-4
store, so after a rollback users lose the language, wallet address and an in-progress creation order
and set them again.

Non-React modules that need the store (the market-data id cache) get an interface injected by
`app/store` (`setIdCache`) instead of importing the store.

## Composition patterns

- **Slots instead of upward imports.** `MarketCard` (entity) takes `actionSlot`; `widgets/market-list`
  passes `<CreateNowModal/>`. `BuyForm` / `AddLiquidityForm` take `walletSlot`; the market page passes
  `<WalletModal/>` through the modals. A lower layer never imports a feature.
- **Trade dialog state** is a context (`features/trade` → `TradeDialogProvider`, `useTradeDialog`)
  so the Trade button and the outcome cards open the same dialog; it resets when the market changes.
- **Market lifecycle** is one pure function, `getMarketPhase(params, now)` in `entities/market`,
  used by every block that enables trading, committing or claiming.
- **Hub events** are routed by `app/bootstrap` to handlers owned by slices:
  `handleMarketEvent` / `handleTokenRegistryForMarket` (entity) and `handleFactoryEvent` /
  `handleTokenRegistryForOrder` (create-market feature). The hub subscription is re-registered on
  every connection (obyte.js drops subscribers on reconnect); `handleConnect` waits for the persisted
  state to rehydrate before using the wallet address or creation order.
- **URL handling** stays in `app` and `pages`: `app/router/locale-sync.tsx` syncs the language prefix,
  `pages/market/model/use-market-seo-redirect.ts` rewrites market URLs to their canonical slug.
- **Analytics**: `shared/lib/analytics/track.ts` is the only place that calls ReactGA; events are typed.

## Adding things

- New route → `pages/<name>` with `index.ts`, registered in `app/router/router.tsx`.
- New user action → `features/<name>`; take entity data through the entity's `index.ts`.
- New backend request → `entities/<entity>/api`, built on `shared/api/backend-http`.
- New reusable UI → `shared/ui`; if it knows about markets, it belongs in `entities/market/ui`.
- A deep import across slices is a lint error; export what you need from the slice's `index.ts`.
