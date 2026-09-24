import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { mockExecutionService } from "./execution/mockExecutor";

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
  terminal: router({
    /** Transport contract for the future authenticated WebSocket executor. */
    execute: publicProcedure
      .input(z.object({ command: z.string().max(4000), cwd: z.string().default("/home/user"), user: z.string().default("user") }))
      .mutation(({ input }) => mockExecutionService.execute(input)),
    status: publicProcedure.query(() => ({
      runtime: "mock-linux-x64",
      container: "workspace-demo",
      status: "running" as const,
      transport: "websocket-ready",
      vpsConnected: false,
    })),
  }),
});

export type AppRouter = typeof appRouter;
