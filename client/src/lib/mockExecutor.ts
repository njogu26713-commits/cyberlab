export type ExecutionResult = {
  output: string;
  exitCode: number;
  cwd?: string;
};

export interface TerminalExecutor {
  execute(command: string, context: { cwd: string; user: string }): Promise<ExecutionResult>;
}

const fileListing = "drwxr-xr-x  2 user user 4096 Sep 24 08:45 .config\ndrwxr-xr-x  5 user user 4096 Sep 24 08:57 .\ndrwxr-xr-x  3 user user 4096 Sep 24 08:45 ..\ndrwxr-xr-x  4 user user 4096 Sep 24 08:42 firebox-lab\n-rw-r--r--  1 user user  842 Sep 24 08:44 README.md\n-rw-r--r--  1 user user  312 Sep 24 08:46 package.json";

export class MockTerminalExecutor implements TerminalExecutor {
  async execute(rawCommand: string, context: { cwd: string; user: string }): Promise<ExecutionResult> {
    const command = rawCommand.trim();
    if (!command) return { output: "", exitCode: 0 };
    await new Promise((resolve) => window.setTimeout(resolve, 110));

    if (command === "clear") return { output: "", exitCode: 0 };
    if (command === "pwd") return { output: context.cwd, exitCode: 0 };
    if (command === "ls" || command === "ls -la" || command === "ls -al") return { output: fileListing, exitCode: 0 };
    if (command === "whoami") return { output: context.user, exitCode: 0 };
    if (command === "uname -a") return { output: "Linux firebox 6.8.0-mock #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux", exitCode: 0 };
    if (command === "date") return { output: "Wed Sep 24 08:57:04 UTC 2026", exitCode: 0 };
    if (command === "docker ps") return { output: "CONTAINER ID   IMAGE                 STATUS          NAMES\n8f3c1c0d2a91   firebox/sandbox:dev   Up 18 minutes   workspace-demo", exitCode: 0 };
    if (command === "git status" || command === "git status --short") return { output: "On branch main\nYour branch is up to date with 'origin/main'.\n\nChanges not staged for commit:\n  modified:   README.md\n\nno changes added to commit", exitCode: 0 };
    if (command === "help" || command === "firebox help") return { output: "Firebox mock shell\n\nAvailable demo commands:\n  help, clear, pwd, ls, whoami, uname -a, date\n  git status, docker ps, echo <text>\n\nExecution is mocked in the browser. No host commands are run.", exitCode: 0 };
    if (command.startsWith("echo ")) return { output: command.slice(5), exitCode: 0 };
    if (command.startsWith("cd ")) {
      const destination = command.slice(3).trim();
      if (destination === "..") return { output: "", exitCode: 0, cwd: context.cwd.split("/").slice(0, -1).join("/") || "/" };
      return { output: "", exitCode: 0, cwd: destination.startsWith("/") ? destination : `${context.cwd}/${destination}` };
    }
    if (command.startsWith("nmap") || command.startsWith("nuclei") || command.startsWith("nikto") || command.startsWith("whatweb")) return { output: "[mock] Scan queued in the isolated lab. No network request was made.\nUse only against systems you own or have explicit permission to test.", exitCode: 0 };
    return { output: `bash: ${command.split(" ")[0]}: command not found\nTry 'help' for the demo command list.`, exitCode: 127 };
  }
}

export const mockExecutor = new MockTerminalExecutor();
