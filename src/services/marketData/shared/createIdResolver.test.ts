import type { Mock } from "vitest";
import { store } from "store/store";
import { cacheSearchResult } from "store/slices/searchCacheSlice";
import { createIdResolver, type IdResolverOptions } from "./createIdResolver";

// vi.mock is hoisted above the imports; the factory must not touch outer variables.
vi.mock("store/store", () => ({
  store: { getState: vi.fn(), dispatch: vi.fn() }
}));

type Fetcher = IdResolverOptions["fetcher"];

// The factory above replaces the store with plain mocks; view it as such for the setup calls.
const mockedStore = store as unknown as { getState: Mock; dispatch: Mock };

beforeEach(() => {
  mockedStore.getState.mockReturnValue({ searchCache: { results: {} } });
  mockedStore.dispatch.mockReset();
});

describe("createIdResolver", () => {
  it("returns a static override without calling the fetcher", async () => {
    const fetcher = vi.fn<Fetcher>();
    const resolve = createIdResolver({ provider: "x", overrides: { FOO: "foo-id" }, fetcher });

    expect(await resolve("foo")).toBe("foo-id");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns the persisted id without calling the fetcher", async () => {
    mockedStore.getState.mockReturnValue({ searchCache: { results: { x: { BAR: "bar-id" } } } });
    const fetcher = vi.fn<Fetcher>();
    const resolve = createIdResolver({ provider: "x", fetcher });

    expect(await resolve("BAR")).toBe("bar-id");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("fetches, persists and returns a positive result", async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValue("baz-id");
    const resolve = createIdResolver({ provider: "x", fetcher });

    expect(await resolve("BAZ")).toBe("baz-id");
    expect(mockedStore.dispatch).toHaveBeenCalledWith(cacheSearchResult({ provider: "x", symbol: "BAZ", key: "baz-id" }));
  });

  it("caches a negative result for the session and does not persist it", async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValue(null);
    const resolve = createIdResolver({ provider: "x", fetcher });

    expect(await resolve("NEG")).toBeNull();
    expect(await resolve("NEG")).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(mockedStore.dispatch).not.toHaveBeenCalled();
  });

  it("does not cache a transient failure (retries next call)", async () => {
    const fetcher = vi.fn<Fetcher>().mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce("ok-id");
    const resolve = createIdResolver({ provider: "x", fetcher });

    expect(await resolve("ERR")).toBeNull();
    expect(await resolve("ERR")).toBe("ok-id");
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("dedupes concurrent lookups for the same symbol", async () => {
    let release!: (v: string | null) => void;
    const fetcher = vi.fn<Fetcher>(() => new Promise<string | null>((resolve) => { release = resolve; }));
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
