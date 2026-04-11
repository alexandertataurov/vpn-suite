import { describe, it, expect, vi, beforeEach } from "vitest";
import { authenticateWebApp, resetAuthForTest } from "../authBootstrap";
import { postAuth } from "../../../api";

vi.mock("../../../api", () => ({
  postAuth: vi.fn(),
}));

const mockPostAuth = vi.mocked(postAuth);

describe("authBootstrap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthForTest();
  });

  it("calls postAuth with initData and returns session", async () => {
    const session = { session_token: "token-1", expires_in: 3600 };
    mockPostAuth.mockResolvedValue(session);

    const result = await authenticateWebApp("init-data-x");

    expect(mockPostAuth).toHaveBeenCalledTimes(1);
    expect(mockPostAuth).toHaveBeenCalledWith("init-data-x");
    expect(result).toEqual(session);
  });

  it("rejects when postAuth fails", async () => {
    mockPostAuth.mockRejectedValue(new Error("Invalid init_data"));

    await expect(authenticateWebApp("bad")).rejects.toThrow("Invalid init_data");
    expect(mockPostAuth).toHaveBeenCalledWith("bad");
  });

  it("deduplicates concurrent calls", async () => {
    const session = { session_token: "token", expires_in: 3600 };
    mockPostAuth.mockResolvedValue(session);

    const [a, b] = await Promise.all([
      authenticateWebApp("same"),
      authenticateWebApp("same"),
    ]);

    expect(mockPostAuth).toHaveBeenCalledTimes(1);
    expect(a).toEqual(session);
    expect(b).toEqual(session);
  });

  it("allows new call after previous settles", async () => {
    mockPostAuth
      .mockResolvedValueOnce({ session_token: "t1", expires_in: 3600 })
      .mockResolvedValueOnce({ session_token: "t2", expires_in: 7200 });

    const r1 = await authenticateWebApp("d1");
    const r2 = await authenticateWebApp("d2");

    expect(mockPostAuth).toHaveBeenCalledTimes(2);
    expect(r1.session_token).toBe("t1");
    expect(r2.session_token).toBe("t2");
  });
});
