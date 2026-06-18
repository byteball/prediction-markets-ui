import { store } from "store/store";
import { cacheSearchResult } from "store/slices/searchCacheSlice";
import { createIdResolver } from "./createIdResolver";

// jest.mock is hoisted above the imports by babel-jest.
jest.mock("store/store", () => ({
  store: { getState: jest.fn(), dispatch: jest.fn() }
}));

beforeEach(() => {
  store.getState.mockReturnValue({ searchCache: { results: {} } });
  store.dispatch.mockReset();
});

describe("createIdResolver", () => {
  it("returns a static override without calling the fetcher", async () => {
    const fetcher = jest.fn();
    const resolve = createIdResolver({ provider: "x", overrides: { FOO: "foo-id" }, fetcher });

    expect(await resolve("foo")).toBe("foo-id");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns the persisted id without calling the fetcher", async () => {
    store.getState.mockReturnValue({ searchCache: { results: { x: { BAR: "bar-id" } } } });
    const fetcher = jest.fn();
    const resolve = createIdResolver({ provider: "x", fetcher });

    expect(await resolve("BAR")).toBe("bar-id");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("fetches, persists and returns a positive result", async () => {
    const fetcher = jest.fn().mockResolvedValue("baz-id");
    const resolve = createIdResolver({ provider: "x", fetcher });

    expect(await resolve("BAZ")).toBe("baz-id");
    expect(store.dispatch).toHaveBeenCalledWith(cacheSearchResult({ provider: "x", symbol: "BAZ", key: "baz-id" }));
  });

  it("caches a negative result for the session and does not persist it", async () => {
    const fetcher = jest.fn().mockResolvedValue(null);
    const resolve = createIdResolver({ provider: "x", fetcher });

    expect(await resolve("NEG")).toBeNull();
    expect(await resolve("NEG")).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it("does not cache a transient failure (retries next call)", async () => {
    const fetcher = jest.fn().mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce("ok-id");
    const resolve = createIdResolver({ provider: "x", fetcher });

    expect(await resolve("ERR")).toBeNull();
    expect(await resolve("ERR")).toBe("ok-id");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("dedupes concurrent lookups for the same symbol", async () => {
    let release;
    const fetcher = jest.fn(() => new Promise((resolve) => { release = resolve; }));
    const resolve = createIdResolver({ provider: "x", fetcher });

    const first = resolve("DUP");
    const second = resolve("DUP");
    await new Promise((r) => setTimeout(r, 0)); // let the fetcher start so `release` is assigned
    release("dup-id");

    expect(await first).toBe("dup-id");
    expect(await second).toBe("dup-id");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
