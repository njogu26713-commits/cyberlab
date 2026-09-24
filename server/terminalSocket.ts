import type { Request } from "express";
import type { Server } from "http";
import { WebSocketServer, type WebSocket } from "ws";
import { createTerminalExecutor, type TerminalSessionContext } from "./execution/terminalExecutor";
import { createTerminalSession, ensureDefaultWorkspace, markTerminalSession } from "./db";
import { sdk } from "./_core/sdk";

const terminalWss = new WebSocketServer({ noServer: true });
const executor = createTerminalExecutor();

type SessionSocket = WebSocket & { fireboxContext?: TerminalSessionContext };

function send(socket: WebSocket, event: unknown) {
  if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(event));
}

export function registerTerminalWebSocket(server: Server) {
  server.on("upgrade", async (request, socket, head) => {
    const pathname = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`).pathname;
    if (pathname !== "/api/terminal") return;

    try {
      const user = await sdk.authenticateRequest(request as Request);
      const workspace = await ensureDefaultWorkspace(user.id);
      const session = await createTerminalSession(user.id, workspace.id);
      const context: TerminalSessionContext = { sessionId: session.sessionKey, userId: user.id, workspaceId: workspace.id, cwd: session.cwd };

      terminalWss.handleUpgrade(request, socket, head, (ws) => {
        const sessionSocket = ws as SessionSocket;
        sessionSocket.fireboxContext = context;
        terminalWss.emit("connection", sessionSocket, request);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      socket.write(`HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n${message}`);
      socket.destroy();
    }
  });

  terminalWss.on("connection", async (socket: SessionSocket) => {
    const context = socket.fireboxContext;
    if (!context) {
      socket.close(1011, "Missing terminal session context");
      return;
    }
    await markTerminalSession(context.sessionId, "connected");
    await executor.open(context, (event) => send(socket, event));

    socket.on("message", async (raw) => {
      try {
        const payload = JSON.parse(raw.toString()) as { type?: string; command?: string };
        if (payload.type === "input" && typeof payload.command === "string" && payload.command.length <= 4000) {
          await executor.execute(context, payload.command, (event) => send(socket, event));
        } else if (payload.type === "ping") {
          send(socket, { type: "pong" });
        } else {
          send(socket, { type: "error", message: "Invalid terminal message" });
        }
      } catch {
        send(socket, { type: "error", message: "Invalid terminal payload" });
      }
    });

    socket.on("close", async () => {
      await executor.close(context);
      await markTerminalSession(context.sessionId, "disconnected");
    });
  });
}
