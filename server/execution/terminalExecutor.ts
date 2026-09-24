import { ENV } from "../_core/env";

export type TerminalSessionContext = {
  sessionId: string;
  userId: number;
  workspaceId: number;
  cwd: string;
};

export type TerminalEvent =
  | { type: "state"; status: "unavailable" | "connected" | "error"; message: string }
  | { type: "output"; data: string }
  | { type: "exit"; code: number };

export interface TerminalExecutor {
  open(context: TerminalSessionContext, emit: (event: TerminalEvent) => void): Promise<void>;
  execute(context: TerminalSessionContext, command: string, emit: (event: TerminalEvent) => void): Promise<void>;
  close(context: TerminalSessionContext): Promise<void>;
}

/**
 * Production-safe default until a compute provider is configured. It never
 * pretends to run Linux commands and is intentionally easy to replace with
 * VPSDockerExecutor without changing the WebSocket transport.
 */
export class UnavailableTerminalExecutor implements TerminalExecutor {
  private readonly message = "Linux environment is not connected.\n\nConnect a compute provider to start a Linux session.";

  async open(_context: TerminalSessionContext, emit: (event: TerminalEvent) => void) {
    emit({ type: "state", status: "unavailable", message: this.message });
  }

  async execute(_context: TerminalSessionContext, _command: string, emit: (event: TerminalEvent) => void) {
    emit({ type: "output", data: `${this.message}\n` });
    emit({ type: "exit", code: 1 });
  }

  async close(_context: TerminalSessionContext) {}
}

/** Future adapter. Docker commands must be executed only from this service on
 * a private, authenticated VPS connection; the browser never receives Docker
 * access or container credentials. */
export class VPSDockerExecutor implements TerminalExecutor {
  async open(_context: TerminalSessionContext, emit: (event: TerminalEvent) => void) {
    emit({ type: "state", status: "unavailable", message: "VPSDockerExecutor is not configured. Set the compute provider connection before opening a session." });
  }

  async execute(_context: TerminalSessionContext, _command: string, emit: (event: TerminalEvent) => void) {
    emit({ type: "state", status: "error", message: "Compute provider configuration is required before executing commands." });
    emit({ type: "exit", code: 1 });
  }

  async close(_context: TerminalSessionContext) {}
}

export function createTerminalExecutor(): TerminalExecutor {
  return ENV.computeProvider === "azure-vps" && ENV.azureVpsHost && ENV.azureVpsSshSecret
    ? new VPSDockerExecutor()
    : new UnavailableTerminalExecutor();
}
