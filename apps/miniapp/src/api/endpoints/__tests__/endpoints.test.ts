import { beforeEach, describe, expect, it, vi } from "vitest";
import { getPlans } from "../plans";
import { postAuth } from "../auth";

const { webappApiMock } = vi.hoisted(() => ({
  webappApiMock: {
    get: vi.fn(),
    postUnauthenticated: vi.fn(),
  },
}));

vi.mock("../../client", () => ({
  webappApi: webappApiMock,
}));

describe("API endpoints", () => {
  beforeEach(() => {
    webappApiMock.get.mockReset();
    webappApiMock.postUnauthenticated.mockReset();
  });

  it("posts auth init data unauthenticated", async () => {
    webappApiMock.postUnauthenticated.mockResolvedValue({ session_token: "token", expires_in: 3600 });

    const result = await postAuth("init-data");

    expect(webappApiMock.postUnauthenticated).toHaveBeenCalledWith("/webapp/auth", { init_data: "init-data" });
    expect(result).toEqual({ session_token: "token", expires_in: 3600 });
  });

  it("loads plans from the webapp API", async () => {
    webappApiMock.get.mockResolvedValue({ items: [{ id: "pro", duration_days: 30, price_amount: 100, price_currency: "Stars" }] });

    const result = await getPlans();

    expect(webappApiMock.get).toHaveBeenCalledWith("/webapp/plans");
    expect(result.items).toHaveLength(1);
  });
});
