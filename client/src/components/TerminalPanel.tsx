import { useAuth } from "@/_core/hooks/useAuth";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { Copy, Maximize2, Plus, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type TerminalStatus = "connecting" | "connected" | "unavailable" | "error" | "auth-required";
type TerminalEvent =
  | { type: "state"; status: "unavailable" | "connected" | "error"; message: string }
  | { type: "output"; data: string }
  | { type: "exit"; code: number }
  | { type: "error"; message: string };

const statusCopy: Record<TerminalStatus, string> = {
  connecting: "connecting",
  connected: "connected",
  unavailable: "compute unavailable",
  error: "connection error",
  "auth-required": "sign in required",
};

export default function TerminalPanel({ compact = false }: { compact?: boolean }) {
  const { isAuthenticated, loading } = useAuth();
  const [tabs, setTabs] = useState(["bash"]);
  const [activeTab, setActiveTab] = useState("bash");
  const [status, setStatus] = useState<TerminalStatus>("connecting");
  const terminalHostRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const inputRef = useRef("");
  const statusRef = useRef<TerminalStatus>("connecting");

  const updateStatus = (next: TerminalStatus) => {
    statusRef.current = next;
    setStatus(next);
  };

  useEffect(() => {
    if (!terminalHostRef.current) return;
    const terminal = new Terminal({
      cursorBlink: true,
      convertEol: true,
      scrollback: 5000,
      fontFamily: '"JetBrains Mono", ui-monospace, monospace',
      fontSize: 13,
      lineHeight: 1.45,
      theme: { background: "#0c1117", foreground: "#c9d4dd", cursor: "#f6a33a", green: "#85e0b7", yellow: "#f6a33a", red: "#ff9a96" },
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(terminalHostRef.current);
    const fitTerminal = () => { try { fit.fit(); } catch {} };
    window.requestAnimationFrame(fitTerminal);
    window.addEventListener("resize", fitTerminal);
    terminalRef.current = terminal;

    const writePrompt = () => terminal.write("\r\n\x1b[38;2;133;224;183muser@firebox\x1b[0m:\x1b[38;2;246;163;58m~\x1b[0m$ ");
    const sendCommand = () => {
      const command = inputRef.current.trim();
      terminal.write("\r\n");
      inputRef.current = "";
      if (!command) {
        if (statusRef.current === "connected") writePrompt();
        return;
      }
      if (command === "clear") {
        terminal.clear();
        if (statusRef.current === "connected") writePrompt();
        return;
      }
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
        terminal.writeln("No terminal session is connected. Sign in and connect a compute provider first.");
        return;
      }
      socketRef.current.send(JSON.stringify({ type: "input", command }));
    };

    terminal.onData((data) => {
      if (data === "\r") return sendCommand();
      if (data === "\u0003") {
        inputRef.current = "";
        terminal.write("^C\r\n");
        if (statusRef.current === "connected") writePrompt();
        return;
      }
      if (data === "\u000c") {
        terminal.clear();
        if (statusRef.current === "connected") writePrompt();
        return;
      }
      if (data === "\u007f") {
        if (inputRef.current.length > 0) {
          inputRef.current = inputRef.current.slice(0, -1);
          terminal.write("\b \b");
        }
        return;
      }
      if (data >= " " && data <= "~" && statusRef.current === "connected") {
        inputRef.current += data;
        terminal.write(data);
      }
    });

    if (loading) {
      updateStatus("connecting");
      terminal.writeln("Waiting for the authenticated session...");
    } else if (!isAuthenticated) {
      updateStatus("auth-required");
      terminal.writeln("Terminal session not started.");
      terminal.writeln("");
      terminal.writeln("Sign in to open an authenticated terminal session.");
    } else {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const socket = new WebSocket(`${protocol}//${window.location.host}/api/terminal`);
      socketRef.current = socket;
      updateStatus("connecting");
      terminal.writeln("Connecting to the authenticated terminal service...");
      socket.onopen = () => updateStatus("connected");
      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as TerminalEvent;
          if (payload.type === "state") {
            updateStatus(payload.status);
            payload.message.split("\n").forEach((line) => terminal.writeln(line));
            if (payload.status === "connected") writePrompt();
          } else if (payload.type === "output") {
            terminal.write(payload.data);
            if (statusRef.current === "connected") writePrompt();
          } else if (payload.type === "exit" && payload.code !== 0) {
            terminal.writeln(`process exited with code ${payload.code}`);
            if (statusRef.current === "connected") writePrompt();
          } else if (payload.type === "error") {
            updateStatus("error");
            terminal.writeln(payload.message);
          }
        } catch {
          updateStatus("error");
          terminal.writeln("Terminal service returned an invalid response.");
        }
      };
      socket.onerror = () => {
        updateStatus("error");
        terminal.writeln("Terminal connection failed. Check the backend service and try again.");
      };
      socket.onclose = () => {
        socketRef.current = null;
        if (statusRef.current === "connected" || statusRef.current === "connecting") updateStatus("error");
      };
    }

    return () => {
      socketRef.current?.close();
      socketRef.current = null;
      window.removeEventListener("resize", fitTerminal);
      terminal.dispose();
      terminalRef.current = null;
    };
  }, [isAuthenticated, loading]);

  const copyOutput = async () => {
    const selection = terminalRef.current?.getSelection() || terminalRef.current?.buffer.active.getLine(0)?.translateToString() || "";
    await navigator.clipboard?.writeText(selection);
    toast.success(selection ? "Terminal selection copied" : "Select terminal output to copy it");
  };
  const clearTerminal = () => terminalRef.current?.clear();
  const newTab = () => {
    const name = `bash-${tabs.length + 1}`;
    setTabs((items) => [...items, name]);
    setActiveTab(name);
    toast.info("New tabs will use independent terminal sessions when compute is connected.");
  };
  const statusColor = status === "connected" ? "text-accent-foreground" : status === "connecting" ? "text-primary" : "text-[#ffb08b]";

  return <div className={`terminal-glow overflow-hidden rounded-xl border border-[#2b3946] bg-[#0c1117] ${compact ? "min-h-[330px]" : "min-h-[535px]"}`}>
    <div className="flex items-center justify-between border-b border-border bg-[#121a22] px-3 py-2"><div className="flex min-w-0 items-center gap-1.5 overflow-auto">{tabs.map((tab, index) => <button key={tab} onClick={() => setActiveTab(tab)} className={`group flex items-center gap-2 rounded-md px-3 py-1.5 font-mono text-[11px] ${activeTab === tab ? "bg-[#202c37] text-white" : "text-muted-foreground hover:bg-white/[0.04] hover:text-white"}`}><span className={`size-1.5 rounded-full ${status === "connected" ? "bg-accent-foreground" : "bg-primary"}`} />{tab}{index > 0 && <X size={11} className="opacity-50 hover:opacity-100" />}</button>)}<button onClick={newTab} className="ml-1 rounded-md p-1.5 text-muted-foreground hover:bg-white/[0.05] hover:text-white" title="New terminal tab"><Plus size={14} /></button></div><div className="ml-2 flex items-center gap-1"><button onClick={clearTerminal} className="rounded-md p-1.5 text-muted-foreground hover:bg-white/[0.05] hover:text-white" title="Clear terminal"><RotateCcw size={14} /></button><button onClick={copyOutput} className="rounded-md p-1.5 text-muted-foreground hover:bg-white/[0.05] hover:text-white" title="Copy selected output"><Copy size={14} /></button><button onClick={() => toast.info("Fullscreen terminal mode is available when the compute session is connected.")} className="rounded-md p-1.5 text-muted-foreground hover:bg-white/[0.05] hover:text-white" title="Fullscreen"><Maximize2 size={14} /></button></div></div>
    <div className="flex items-center gap-2 border-b border-border/70 bg-[#10171e] px-4 py-2 font-mono text-[10px] text-muted-foreground"><span className={statusColor}>● {statusCopy[status]}</span><span className="text-border">/</span><span>authenticated websocket</span><span className="ml-auto">UTF-8</span></div>
    <div ref={terminalHostRef} className={`scanline relative overflow-hidden p-3 sm:p-4 ${compact ? "min-h-[260px]" : "min-h-[390px]"}`} aria-label="xterm terminal" />
    <div className="flex flex-col justify-between gap-2 border-t border-border bg-[#10171e] px-4 py-2.5 font-mono text-[10px] text-muted-foreground sm:flex-row"><span>xterm.js · authenticated WebSocket · browser never executes commands</span><span className="flex items-center gap-3"><span>Ctrl+C interrupt</span><span>Ctrl+L clear</span><span className={status === "connected" ? "text-accent-foreground" : "text-primary"}>● {statusCopy[status]}</span></span></div>
  </div>;
}
