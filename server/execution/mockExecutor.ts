export type ExecutionRequest = {
  command: string;
  cwd: string;
  user: string;
};

export type ExecutionResult = {
  output: string;
  exitCode: number;
  cwd?: string;
};

export interface TerminalExecutionService {
  execute(request: ExecutionRequest): Promise<ExecutionResult>;
}

/**
 * Safe server-side demo implementation. It deliberately never invokes a host
 * shell. Replace this class with an authenticated WebSocket/VPS adapter when
 * the isolated container service is ready.
 */
export class MockExecutionService implements TerminalExecutionService {
  async execute({ command, cwd, user }: ExecutionRequest): Promise<ExecutionResult> {
    const trimmed = command.trim();
    if (!trimmed) return { output: "", exitCode: 0 };
    const listing = "drwxr-xr-x  4 user user 4096 Sep 24 08:42 firebox-lab\n-rw-r--r--  1 user user  842 Sep 24 08:44 README.md\n-rw-r--r--  1 user user  312 Sep 24 08:46 package.json";
    if (trimmed === "pwd") return { output: cwd, exitCode: 0 };
    if (trimmed === "ls" || trimmed === "ls -la") return { output: listing, exitCode: 0 };
    if (trimmed === "whoami") return { output: user, exitCode: 0 };
    if (trimmed === "uname -a") return { output: "Linux firebox 6.8.0-mock #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux", exitCode: 0 };
    if (trimmed === "date") return { output: "Wed Sep 24 08:57:04 UTC 2026", exitCode: 0 };
    if (trimmed === "docker ps") return { output: "CONTAINER ID   IMAGE                 STATUS          NAMES\n8f3c1c0d2a91   firebox/sandbox:dev   Up 18 minutes   workspace-demo", exitCode: 0 };
    if (trimmed === "git status") return { output: "On branch main\nYour branch is up to date with 'origin/main'.\n\nChanges not staged for commit:\n  modified:   README.md", exitCode: 0 };
    if (trimmed === "help" || trimmed === "firebox help") return { output: "Firebox mock shell\nAvailable demo commands: help, pwd, ls, whoami, uname -a, date, git status, docker ps, echo <text>\nExecution is mocked. No host commands are run.", exitCode: 0 };
    if (trimmed.startsWith("echo ")) return { output: trimmed.slice(5), exitCode: 0 };
    if (trimmed.startsWith("cd ")) return { output: "", exitCode: 0, cwd: trimmed.slice(3).trim() };
    if (/^(nmap|nuclei|nikto|whatweb)(\s|$)/.test(trimmed)) return { output: "[mock] Scan queued in the isolated lab. No network request was made.\nUse only against systems you own or have explicit permission to test.", exitCode: 0 };
    return { output: `bash: ${trimmed.split(" ")[0]}: command not found\nTry 'help' for the demo command list.`, exitCode: 127 };
  }
}

export const mockExecutionService = new MockExecutionService();
