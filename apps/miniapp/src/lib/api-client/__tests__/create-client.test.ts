import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApiClient } from "../create-client";

describe("createApiClient", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("resolves callable baseUrl on each request", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ n: 1 }), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    let host = "https://a.example.com";
    const client = createApiClient({
      baseUrl: () => `${host}/api/v1`,
    });
    await expect(client.get("/webapp/me")).resolves.toEqual({ n: 1 });
    expect(fetchMock).toHaveBeenLastCalledWith("https://a.example.com/api/v1/webapp/me", expect.anything());
    host = "https://b.example.com";
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ n: 2 }), { status: 200, headers: { "Content-Type": "application/json" } }),
    );
    await expect(client.get("/webapp/me")).resolves.toEqual({ n: 2 });
    expect(fetchMock).toHaveBeenLastCalledWith("https://b.example.com/api/v1/webapp/me", expect.anything());
  });

  it("adds auth and json headers for authenticated POST requests", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const client = createApiClient({
      baseUrl: "https://api.example.com/",
      getToken: () => "token-123",
    });

    await expect(client.post("/webapp/test", { hello: "world" })).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/webapp/test",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ hello: "world" }),
        headers: expect.any(Headers),
      }),
    );

    const init = fetchMock.mock.calls[0]?.[1];
    const headers = init?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer token-123");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("retries safe GET requests on 503 before succeeding", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "retry" } }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const client = createApiClient({ baseUrl: "https://api.example.com" });
    const resultPromise = client.get("/status");

    await vi.advanceTimersByTimeAsync(500);

    await expect(resultPromise).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("calls onUnauthorized for authenticated 401 responses", async () => {
    const onUnauthorized = vi.fn();
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: "Session expired" } }), { status: 401 }),
    );

    const client = createApiClient({
      baseUrl: "https://api.example.com",
      onUnauthorized,
    });

    await expect(client.get("/webapp/me")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      statusCode: 401,
      message: "Session expired",
    });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("retries network failures before surfacing NETWORK_UNREACHABLE", async () => {
    fetchMock.mockRejectedValue(new TypeError("offline"));

    const client = createApiClient({ baseUrl: "https://api.example.com" });
    const errorPromise = client.get("/webapp/me").catch((error) => error);

    await vi.advanceTimersByTimeAsync(500);
    await vi.advanceTimersByTimeAsync(1000);

    await expect(errorPromise).resolves.toMatchObject({
      code: "NETWORK_UNREACHABLE",
      statusCode: 0,
      message: "offline",
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("postUnauthenticated omits bearer auth and still parses success payloads", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ token: "abc" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const client = createApiClient({
      baseUrl: "https://api.example.com",
      getToken: () => "should-not-be-used",
    });

    await expect(client.postUnauthenticated("/webapp/auth", { init_data: "tg" })).resolves.toEqual({
      token: "abc",
    });

    const init = fetchMock.mock.calls[0]?.[1];
    const headers = init?.headers as Headers;
    expect(headers.get("Authorization")).toBeNull();
  });

  it("postUnauthenticated surfaces invalid auth as UNAUTHORIZED without calling onUnauthorized", async () => {
    const onUnauthorized = vi.fn();
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: "Invalid init data" } }), { status: 401 }),
    );

    const client = createApiClient({
      baseUrl: "https://api.example.com",
      onUnauthorized,
    });

    await expect(client.postUnauthenticated("/webapp/auth", { init_data: "bad" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      statusCode: 401,
      message: "Invalid init data",
    });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("getBlob retries 503 and returns the binary payload", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("busy", { status: 503 }))
      .mockResolvedValueOnce(new Response("vpn-config", { status: 200 }));

    const client = createApiClient({ baseUrl: "https://api.example.com" });
    const blobPromise = client.getBlob("/webapp/config");

    await vi.advanceTimersByTimeAsync(500);

    const blob = await blobPromise;
    await expect(blob.text()).resolves.toBe("vpn-config");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("getBlob handles unauthorized and structured error payloads", async () => {
    const onUnauthorized = vi.fn();
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "Expired" } }), { status: 401 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "Config missing" } }), { status: 400 }),
      );

    const client = createApiClient({
      baseUrl: "https://api.example.com",
      onUnauthorized,
    });

    await expect(client.getBlob("/webapp/protected-config")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      statusCode: 401,
    });
    await expect(client.getBlob("/webapp/broken-config")).rejects.toMatchObject({
      code: "HTTP_ERROR",
      statusCode: 400,
      message: "Config missing",
    });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it("exposes put and patch request helpers", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: "put" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: "patch" }), { status: 200 }));

    const client = createApiClient({ baseUrl: "https://api.example.com" });

    await expect(client.put("/resource/1", { enabled: true })).resolves.toEqual({ ok: "put" });
    await expect(client.patch("/resource/1", { enabled: false })).resolves.toEqual({ ok: "patch" });

    expect(fetchMock.mock.calls[0]?.[1]).toEqual(expect.objectContaining({ method: "PUT" }));
    expect(fetchMock.mock.calls[1]?.[1]).toEqual(expect.objectContaining({ method: "PATCH" }));
  });

  it("throws ApiError when the response body cannot be parsed as JSON", async () => {
    fetchMock.mockResolvedValueOnce(new Response("not-json", { status: 200 }));

    const client = createApiClient({ baseUrl: "https://api.example.com" });

    await expect(client.get("/broken")).rejects.toMatchObject({
      code: "PARSE_ERROR",
      statusCode: 200,
    });
  });
});
