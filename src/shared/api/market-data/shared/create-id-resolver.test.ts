import { createIdResolver, type IdResolverOptions } from "./create-id-resolver";
import { createMemoryIdCache, setIdCache, type IdCache } from "./id-cache";

type Fetcher = IdResolverOptions["fetcher"];

const cache: { get: ReturnType<typeof vi.fn<IdCache["get"]>>; set: ReturnType<typeof vi.fn<IdCache["set"]>> } = { get: vi.fn(), set: vi.fn() };

beforeEach(() => {
  cache.get.mockReset().mockReturnValue(undefined);
  cache.set.mockReset();
  setIdCache(cache);
});

afterAll(() => {
  setIdCache(createMemoryIdCache());
});

describe("createIdResolver", () => {
  it("returns a static override without calling the fetcher", async () => {
    const fetcher = vi.fn<Fetcher>();
    const resolve = createIdResolver({ provider: "x", overrides: { FOO: "foo-id" }, fetcher });

    expect(await resolve("foo")).toBe("foo-id");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns the cached id without calling the fetcher", async () => {
    cache.get.mockImplementation((provider, symbol) => (provider === "x" && symbol === "BAR" ? "bar-id" : undefined));
    const fetcher = vi.fn<Fetcher>();
    const resolve = createIdResolver({ provider: "x", fetcher });

    expect(await resolve("bar")).toBe("bar-id");
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("fetches, caches and returns a positive result", async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValue("baz-id");
    const resolve = createIdResolver({ provider: "x", fetcher });

    expect(await resolve("BAZ")).toBe("baz-id");
    expect(cache.set).toHaveBeenCalledWith("x", "BAZ", "baz-id");
  });

  it("caches a negative result for the session and does not store it", async () => {
    const fetcher = vi.fn<Fetcher>().mockResolvedValue(null);
    const resolve = createIdResolver({ provider: "x", fetcher });

    expect(await resolve("NEG")).toBeNull();
    expect(await resolve("NEG")).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(cache.set).not.toHaveBeenCalled();
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

  it("works with the default in-memory cache across resolver instances", async () => {
    setIdCache(createMemoryIdCache());
    const fetcher = vi.fn<Fetcher>().mockResolvedValue("mem-id");

    expect(await createIdResolver({ provider: "x", fetcher })("MEM")).toBe("mem-id");
    expect(await createIdResolver({ provider: "x", fetcher })("MEM")).toBe("mem-id");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
