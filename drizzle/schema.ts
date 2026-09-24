import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const workspaces = mysqlTable("workspaces", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 160 }).notNull(),
  rootPath: varchar("rootPath", { length: 255 }).default("/home/user").notNull(),
  status: mysqlEnum("status", ["active", "paused", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  workspaceId: int("workspaceId").notNull().references(() => workspaces.id),
  name: varchar("name", { length: 140 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "archived"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const repositories = mysqlTable("repositories", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  projectId: int("projectId").notNull().references(() => projects.id),
  remoteUrl: varchar("remoteUrl", { length: 500 }).notNull(),
  provider: varchar("provider", { length: 40 }).default("git").notNull(),
  defaultBranch: varchar("defaultBranch", { length: 120 }).default("main").notNull(),
  currentBranch: varchar("currentBranch", { length: 120 }).default("main").notNull(),
  status: mysqlEnum("status", ["connected", "pending", "error"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const files = mysqlTable("files", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  workspaceId: int("workspaceId").notNull().references(() => workspaces.id),
  parentId: int("parentId"),
  path: varchar("path", { length: 500 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  kind: mysqlEnum("kind", ["file", "folder"]).notNull(),
  mimeType: varchar("mimeType", { length: 120 }),
  storageKey: varchar("storageKey", { length: 500 }),
  sizeBytes: int("sizeBytes").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const containers = mysqlTable("containers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  workspaceId: int("workspaceId").notNull().references(() => workspaces.id),
  provider: varchar("provider", { length: 50 }).default("azure-vps").notNull(),
  externalId: varchar("externalId", { length: 255 }),
  image: varchar("image", { length: 255 }).default("firebox/sandbox:latest").notNull(),
  status: mysqlEnum("status", ["provisioning", "running", "stopped", "unavailable", "error"]).default("unavailable").notNull(),
  cpuLimit: int("cpuLimit").default(2).notNull(),
  memoryMb: int("memoryMb").default(2048).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const terminalSessions = mysqlTable("terminal_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionKey: varchar("sessionKey", { length: 64 }).notNull().unique(),
  userId: int("userId").notNull().references(() => users.id),
  workspaceId: int("workspaceId").notNull().references(() => workspaces.id),
  containerId: int("containerId").references(() => containers.id),
  cwd: varchar("cwd", { length: 500 }).default("/home/user").notNull(),
  status: mysqlEnum("status", ["created", "connected", "disconnected", "error"]).default("created").notNull(),
  connectedAt: timestamp("connectedAt"),
  disconnectedAt: timestamp("disconnectedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const usage = mysqlTable("usage", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  workspaceId: int("workspaceId").notNull().references(() => workspaces.id),
  containerId: int("containerId").references(() => containers.id),
  cpuSeconds: int("cpuSeconds").default(0).notNull(),
  memoryMbSeconds: int("memoryMbSeconds").default(0).notNull(),
  storageMb: int("storageMb").default(0).notNull(),
  networkBytes: int("networkBytes").default(0).notNull(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export const securityScans = mysqlTable("security_scans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  workspaceId: int("workspaceId").notNull().references(() => workspaces.id),
  projectId: int("projectId").references(() => projects.id),
  tool: varchar("tool", { length: 50 }).notNull(),
  target: varchar("target", { length: 500 }).notNull(),
  status: mysqlEnum("status", ["queued", "running", "complete", "blocked", "error"]).default("queued").notNull(),
  result: text("result"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Workspace = typeof workspaces.$inferSelect;
export type InsertWorkspace = typeof workspaces.$inferInsert;
export type TerminalSession = typeof terminalSessions.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Repository = typeof repositories.$inferSelect;
export type FileRecord = typeof files.$inferSelect;
export type Container = typeof containers.$inferSelect;
export type UsageRecord = typeof usage.$inferSelect;
export type SecurityScan = typeof securityScans.$inferSelect;
