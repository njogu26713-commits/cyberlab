import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createTerminalSession, ensureDefaultWorkspace, getDb, getWorkspaceContainer } from "./db";
import { files, projects, repositories, securityScans } from "../drizzle/schema";
import { and, desc, eq } from "drizzle-orm";

const computeUnavailable = "Linux environment is not connected. Connect a compute provider to start a Linux session.";

function requireDb(db: Awaited<ReturnType<typeof getDb>>) {
  if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database is not configured" });
  return db;
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  workspace: router({
    current: protectedProcedure.query(async ({ ctx }) => {
      const workspace = await ensureDefaultWorkspace(ctx.user.id);
      const container = await getWorkspaceContainer(workspace.id, ctx.user.id);
      return { workspace, container: container ?? null, computeAvailable: container?.status === "running" };
    }),
  }),
  terminal: router({
    createSession: protectedProcedure.mutation(async ({ ctx }) => {
      const workspace = await ensureDefaultWorkspace(ctx.user.id);
      const session = await createTerminalSession(ctx.user.id, workspace.id);
      return { sessionKey: session.sessionKey, workspaceId: workspace.id, status: "created" as const };
    }),
    status: publicProcedure.query(() => ({
      status: "unavailable" as const,
      provider: process.env.COMPUTE_PROVIDER ?? "azure-vps",
      message: computeUnavailable,
      transport: "websocket" as const,
      dockerPubliclyExposed: false,
    })),
  }),
  files: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const workspace = await ensureDefaultWorkspace(ctx.user.id);
      const db = requireDb(await getDb());
      const records = await db.select().from(files).where(and(eq(files.userId, ctx.user.id), eq(files.workspaceId, workspace.id))).orderBy(desc(files.updatedAt));
      return { workspace, records, computeAvailable: false, message: computeUnavailable };
    }),
    create: protectedProcedure.input(z.object({ name: z.string().min(1).max(255), path: z.string().min(1).max(500), kind: z.enum(["file", "folder"]), parentId: z.number().int().positive().nullable().optional() })).mutation(async ({ ctx, input }) => {
      const workspace = await ensureDefaultWorkspace(ctx.user.id);
      const db = requireDb(await getDb());
      await db.insert(files).values({ userId: ctx.user.id, workspaceId: workspace.id, name: input.name, path: input.path, kind: input.kind, parentId: input.parentId ?? null });
      return { ok: true as const, computeAvailable: false, message: "Metadata saved. File bytes will be available when a workspace container is connected." };
    }),
    rename: protectedProcedure.input(z.object({ id: z.number().int().positive(), name: z.string().min(1).max(255), path: z.string().min(1).max(500) })).mutation(async ({ ctx, input }) => {
      const db = requireDb(await getDb());
      await db.update(files).set({ name: input.name, path: input.path }).where(and(eq(files.id, input.id), eq(files.userId, ctx.user.id)));
      return { ok: true as const, message: "File metadata renamed" };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = requireDb(await getDb());
      await db.delete(files).where(and(eq(files.id, input.id), eq(files.userId, ctx.user.id)));
      return { ok: true as const, message: "File metadata deleted" };
    }),
  }),
  git: router({
    repositories: protectedProcedure.query(async ({ ctx }) => {
      const db = requireDb(await getDb());
      const records = await db.select().from(repositories).where(eq(repositories.userId, ctx.user.id)).orderBy(desc(repositories.updatedAt));
      return { records, computeAvailable: false, message: "Git operations require a connected workspace container." };
    }),
    register: protectedProcedure.input(z.object({ remoteUrl: z.string().url().max(500), projectName: z.string().min(1).max(140).default("New repository"), provider: z.string().max(40).default("git") })).mutation(async ({ ctx, input }) => {
      const db = requireDb(await getDb());
      const workspace = await ensureDefaultWorkspace(ctx.user.id);
      await db.insert(projects).values({ userId: ctx.user.id, workspaceId: workspace.id, name: input.projectName, description: "Created from repository registration" });
      const project = await db.select().from(projects).where(and(eq(projects.userId, ctx.user.id), eq(projects.workspaceId, workspace.id))).orderBy(desc(projects.createdAt)).limit(1);
      if (!project[0]) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Project creation failed" });
      await db.insert(repositories).values({ userId: ctx.user.id, projectId: project[0].id, remoteUrl: input.remoteUrl, provider: input.provider, status: "pending" });
      return { ok: true as const, status: "pending" as const, message: "Repository registered. Clone will start when compute is connected." };
    }),
  }),
  cyberLab: router({
    scans: protectedProcedure.query(async ({ ctx }) => {
      const db = requireDb(await getDb());
      const records = await db.select().from(securityScans).where(eq(securityScans.userId, ctx.user.id)).orderBy(desc(securityScans.createdAt));
      return { records, computeAvailable: false, message: "Security tools are blocked until an isolated compute provider is connected." };
    }),
    requestScan: protectedProcedure.input(z.object({ tool: z.enum(["nmap", "nuclei", "nikto", "whatweb"]), target: z.string().min(1).max(500), workspaceId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const db = requireDb(await getDb());
      await db.insert(securityScans).values({ userId: ctx.user.id, workspaceId: input.workspaceId, tool: input.tool, target: input.target, status: "blocked", result: computeUnavailable });
      return { ok: true as const, status: "blocked" as const, message: computeUnavailable };
    }),
  }),
});

export type AppRouter = typeof appRouter;
