import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { nanoid } from "nanoid";
import { containers, InsertUser, terminalSessions, users, workspaces } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  values.lastSignedIn ??= new Date();
  updateSet.lastSignedIn ??= new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function ensureDefaultWorkspace(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const existing = await db.select().from(workspaces).where(eq(workspaces.userId, userId)).limit(1);
  if (existing[0]) return existing[0];
  const slug = `workspace-${nanoid(8).toLowerCase()}`;
  await db.insert(workspaces).values({ userId, name: "My Firebox workspace", slug });
  const created = await db.select().from(workspaces).where(and(eq(workspaces.userId, userId), eq(workspaces.slug, slug))).limit(1);
  if (!created[0]) throw new Error("Workspace creation failed");
  return created[0];
}

export async function createTerminalSession(userId: number, workspaceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not configured");
  const sessionKey = nanoid(32);
  await db.insert(terminalSessions).values({ sessionKey, userId, workspaceId, cwd: "/home/user", status: "created" });
  const created = await db.select().from(terminalSessions).where(eq(terminalSessions.sessionKey, sessionKey)).limit(1);
  if (!created[0]) throw new Error("Terminal session creation failed");
  return created[0];
}

export async function markTerminalSession(sessionKey: string, status: "connected" | "disconnected" | "error") {
  const db = await getDb();
  if (!db) return;
  await db.update(terminalSessions).set({ status, ...(status === "connected" ? { connectedAt: new Date() } : { disconnectedAt: new Date() }) }).where(eq(terminalSessions.sessionKey, sessionKey));
}

export async function getWorkspaceContainer(workspaceId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(containers).where(and(eq(containers.workspaceId, workspaceId), eq(containers.userId, userId))).limit(1);
  return rows[0];
}
