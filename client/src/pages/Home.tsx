import { startLogin } from "@/const";
import { ArrowRight, Check, ChevronRight, Container, GitBranch, LockKeyhole, Monitor, Radio, ShieldCheck, TerminalSquare, Zap } from "lucide-react";
import { Link } from "wouter";

const capabilities = [
  { icon: TerminalSquare, label: "Browser terminal", detail: "A real shell-shaped workspace with tabs, history, and keyboard-first controls." },
  { icon: Container, label: "Isolated by design", detail: "A clean execution boundary ready for per-user Docker containers later." },
  { icon: ShieldCheck, label: "Security learning", detail: "Practice with guided tools and explicit authorization guardrails." },
];

const architecture = ["Browser", "Firebox", "API / WebSocket", "VPS + Docker"];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="firebox-grid pointer-events-none absolute inset-x-0 top-0 h-[760px]" />
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg border border-primary/35 bg-primary/10 text-primary"><TerminalSquare size={19} strokeWidth={2.5} /></div>
          <div>
            <p className="text-sm font-semibold tracking-[0.16em] text-white">FIREBOX</p>
            <p className="font-mono text-[10px] tracking-[0.22em] text-muted-foreground">LINUX LAB</p>
          </div>
        </div>
        <div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
          <a href="#capabilities" className="transition-colors hover:text-white">Capabilities</a>
          <a href="#architecture" className="transition-colors hover:text-white">Architecture</a>
          <Link href="/workspace" className="text-white transition-colors hover:text-primary">Open demo <ArrowRight className="ml-1 inline" size={14} /></Link>
        </div>
        <button onClick={() => startLogin()} className="rounded-lg border border-border bg-white/[0.03] px-3.5 py-2 text-sm font-medium text-white hover:border-primary/50 hover:bg-primary/10">Sign in</button>
      </nav>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-16 px-6 pb-24 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10 lg:pb-32 lg:pt-24">
        <div className="reveal">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.08] px-3 py-1.5 text-xs font-medium text-primary"><span className="size-1.5 rounded-full bg-primary shadow-[0_0_10px_#f6a33a]" /> Control plane online · compute provider pending</div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-0.045em] text-white sm:text-6xl lg:text-[78px]">Linux, <span className="text-primary">in focus.</span></h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">Firebox is a browser-native developer lab for terminal work, Git projects, and authorized security learning — with a secure execution boundary ready for the next step.</p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/workspace" className="group inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_12px_30px_rgba(246,163,58,0.18)] hover:bg-[#ffc16b]">Launch the lab <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Link>
            <button onClick={() => startLogin()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-white/[0.025] px-5 py-3.5 text-sm font-semibold text-white hover:border-white/30 hover:bg-white/[0.06]">Create an account <ChevronRight size={16} className="text-muted-foreground" /></button>
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-muted-foreground"><span className="flex items-center gap-2"><Check size={14} className="text-accent-foreground" /> No commands until compute connects</span><span className="flex items-center gap-2"><Check size={14} className="text-accent-foreground" /> No VPS credentials stored</span><span className="flex items-center gap-2"><Check size={14} className="text-accent-foreground" /> WebSocket-ready</span></div>
        </div>

        <div className="reveal reveal-delay-1 relative mx-auto w-full max-w-[540px]">
          <div className="absolute -inset-8 rounded-[32px] bg-primary/[0.08] blur-3xl" />
          <div className="terminal-glow scanline relative overflow-hidden rounded-2xl border border-[#32404d] bg-[#0d131a]">
            <div className="flex items-center justify-between border-b border-border bg-[#121a22] px-4 py-3"><div className="flex gap-1.5"><span className="size-2.5 rounded-full bg-[#ec6b61]" /><span className="size-2.5 rounded-full bg-[#e0b34f]" /><span className="size-2.5 rounded-full bg-[#68c46d]" /></div><span className="font-mono text-[10px] text-muted-foreground">firebox-shell / preview</span><span className="size-4" /></div>
            <div className="min-h-[330px] p-5 font-mono text-[12px] leading-7 sm:p-7 sm:text-[13px]"><p className="text-muted-foreground">Firebox control plane · authenticated backend</p><p className="mt-4"><span className="text-accent-foreground">firebox</span><span className="text-muted-foreground">@control-plane</span><span className="text-white">$ </span><span className="text-white">status</span></p><p className="mt-3 text-accent-foreground">● backend online</p><p className="text-muted-foreground">  session auth   <span className="text-white">enabled</span></p><p className="text-muted-foreground">  transport      <span className="text-white">websocket-ready</span></p><p className="text-muted-foreground">  linux compute  <span className="text-[#e6c878]">not connected</span></p><p className="mt-4 text-[#ffb08b]">Linux environment is not connected.</p><p className="text-[#aab7c2]">Connect a compute provider to start a Linux session.</p><p className="mt-4"><span className="text-accent-foreground">firebox</span><span className="text-muted-foreground">@control-plane</span><span className="text-white">$ </span><span className="inline-block h-4 w-2 animate-pulse bg-primary align-middle" /></p></div>
            <div className="flex items-center justify-between border-t border-border bg-[#10171e] px-4 py-3 font-mono text-[10px] text-muted-foreground"><span>No Linux commands are being executed</span><span className="flex items-center gap-1.5 text-primary"><Radio size={11} /> provider pending</span></div>
          </div>
        </div>
      </section>

      <section id="capabilities" className="relative z-10 mx-auto max-w-7xl border-t border-border/70 px-6 py-20 lg:px-10"><div className="mb-10 flex items-end justify-between gap-6"><div><p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">The workspace</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Everything close to the shell.</h2></div><p className="hidden max-w-sm text-right text-sm leading-6 text-muted-foreground md:block">A focused interface that puts the command line first, without hiding the tools around it.</p></div><div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">{capabilities.map(({ icon: Icon, label, detail }) => <div key={label} className="bg-[#0f151c] p-7 transition-colors hover:bg-[#131c24]"><Icon size={19} className="text-primary" /><h3 className="mt-12 text-lg font-semibold text-white">{label}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{detail}</p></div>)}</div></section>

      <section id="architecture" className="relative z-10 mx-auto max-w-7xl px-6 pb-28 lg:px-10"><div className="grid gap-10 border-t border-border/70 pt-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div><p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">Designed for the next step</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">The browser never touches Docker.</h2><p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground">The control plane is live today, with the compute adapter intentionally unavailable until the Azure VPS is connected. The same protected API and WebSocket contract will route into an isolated Linux container then.</p></div><div className="grid gap-2 sm:grid-cols-4">{architecture.map((item, index) => <div key={item} className="relative"><div className="flex min-h-24 flex-col justify-between rounded-xl border border-border bg-white/[0.025] p-4"><span className="font-mono text-[10px] text-muted-foreground">0{index + 1}</span><span className="text-sm font-semibold text-white">{item}</span></div>{index < architecture.length - 1 && <ArrowRight className="absolute -right-3 top-10 z-10 hidden text-primary sm:block" size={17} />}</div>)}</div></div></section>

      <footer className="relative z-10 border-t border-border/70 px-6 py-7 lg:px-10"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 text-xs text-muted-foreground sm:flex-row"><span>Firebox Linux Lab · v0.1 preview</span><span className="flex items-center gap-2"><LockKeyhole size={13} /> Built for isolated workspaces</span></div></footer>
    </main>
  );
}
