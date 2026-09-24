import { describe, expect, it } from "vitest";
import { MockExecutionService } from "./execution/mockExecutor";

describe("MockExecutionService", () => {
  it("returns deterministic output without executing a host command", async () => {
    const service = new MockExecutionService();
    await expect(service.execute({ command: "pwd", cwd: "/home/user", user: "user" })).resolves.toEqual({ output: "/home/user", exitCode: 0 });
  });

  it("returns a safe message for unsupported commands", async () => {
    const service = new MockExecutionService();
    const result = await service.execute({ command: "rm -rf /", cwd: "/home/user", user: "user" });
    expect(result.exitCode).toBe(127);
    expect(result.output).toContain("command not found");
  });

  it("marks security tools as mock-only", async () => {
    const service = new MockExecutionService();
    const result = await service.execute({ command: "nmap demo-target.local", cwd: "/home/user", user: "user" });
    expect(result.output).toContain("No network request was made");
    expect(result.exitCode).toBe(0);
  });
});
