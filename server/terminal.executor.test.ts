import { describe, expect, it } from "vitest";
import { UnavailableTerminalExecutor } from "./execution/terminalExecutor";

describe("UnavailableTerminalExecutor", () => {
  it("announces that compute is unavailable when a session opens", async () => {
    const events: unknown[] = [];
    const executor = new UnavailableTerminalExecutor();
    await executor.open({ sessionId: "session", userId: 1, workspaceId: 1, cwd: "/home/user" }, (event) => events.push(event));
    expect(events).toEqual([{ type: "state", status: "unavailable", message: "Linux environment is not connected.\n\nConnect a compute provider to start a Linux session." }]);
  });

  it("never returns fake command output", async () => {
    const events: unknown[] = [];
    const executor = new UnavailableTerminalExecutor();
    await executor.execute({ sessionId: "session", userId: 1, workspaceId: 1, cwd: "/home/user" }, "ls", (event) => events.push(event));
    expect(events).toEqual([
      { type: "output", data: "Linux environment is not connected.\n\nConnect a compute provider to start a Linux session.\n" },
      { type: "exit", code: 1 },
    ]);
    expect(JSON.stringify(events)).not.toContain("README.md");
  });
});
