import { afterEach, describe, expect, it, vi } from "vitest";
import { cliFetch } from "../client.js";

describe("cliFetch", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  function stubFetch() {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response("{}"),
    );
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("declares the agent thread it runs in", async () => {
    vi.stubEnv("BB_THREAD_ID", "thr_agent");
    const fetchMock = stubFetch();

    await cliFetch("http://bb.test/api/v1/x", {
      headers: { "content-type": "application/json" },
    });

    const init = fetchMock.mock.calls[0]?.[1];
    const headers = new Headers(init?.headers);
    expect(headers.get("x-bb-requesting-thread")).toBe("thr_agent");
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("sends no thread header outside an agent thread", async () => {
    vi.stubEnv("BB_THREAD_ID", "");
    const fetchMock = stubFetch();

    await cliFetch("http://bb.test/api/v1/x");

    const init = fetchMock.mock.calls[0]?.[1];
    expect(new Headers(init?.headers).has("x-bb-requesting-thread")).toBe(
      false,
    );
  });
});
