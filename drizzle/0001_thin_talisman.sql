CREATE TABLE `containers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`provider` varchar(50) NOT NULL DEFAULT 'azure-vps',
	`externalId` varchar(255),
	`image` varchar(255) NOT NULL DEFAULT 'firebox/sandbox:latest',
	`status` enum('provisioning','running','stopped','unavailable','error') NOT NULL DEFAULT 'unavailable',
	`cpuLimit` int NOT NULL DEFAULT 2,
	`memoryMb` int NOT NULL DEFAULT 2048,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `containers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`parentId` int,
	`path` varchar(500) NOT NULL,
	`name` varchar(255) NOT NULL,
	`kind` enum('file','folder') NOT NULL,
	`mimeType` varchar(120),
	`storageKey` varchar(500),
	`sizeBytes` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(140) NOT NULL,
	`description` text,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `repositories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int NOT NULL,
	`remoteUrl` varchar(500) NOT NULL,
	`provider` varchar(40) NOT NULL DEFAULT 'git',
	`defaultBranch` varchar(120) NOT NULL DEFAULT 'main',
	`currentBranch` varchar(120) NOT NULL DEFAULT 'main',
	`status` enum('connected','pending','error') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `repositories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `security_scans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`projectId` int,
	`tool` varchar(50) NOT NULL,
	`target` varchar(500) NOT NULL,
	`status` enum('queued','running','complete','blocked','error') NOT NULL DEFAULT 'queued',
	`result` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `security_scans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `terminal_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionKey` varchar(64) NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`containerId` int,
	`cwd` varchar(500) NOT NULL DEFAULT '/home/user',
	`status` enum('created','connected','disconnected','error') NOT NULL DEFAULT 'created',
	`connectedAt` timestamp,
	`disconnectedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `terminal_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `terminal_sessions_sessionKey_unique` UNIQUE(`sessionKey`)
);
--> statement-breakpoint
CREATE TABLE `usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`containerId` int,
	`cpuSeconds` int NOT NULL DEFAULT 0,
	`memoryMbSeconds` int NOT NULL DEFAULT 0,
	`storageMb` int NOT NULL DEFAULT 0,
	`networkBytes` int NOT NULL DEFAULT 0,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`slug` varchar(160) NOT NULL,
	`rootPath` varchar(255) NOT NULL DEFAULT '/home/user',
	`status` enum('active','paused','archived') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `containers` ADD CONSTRAINT `containers_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `containers` ADD CONSTRAINT `containers_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `files` ADD CONSTRAINT `files_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `repositories` ADD CONSTRAINT `repositories_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `repositories` ADD CONSTRAINT `repositories_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `security_scans` ADD CONSTRAINT `security_scans_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `security_scans` ADD CONSTRAINT `security_scans_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `security_scans` ADD CONSTRAINT `security_scans_projectId_projects_id_fk` FOREIGN KEY (`projectId`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `terminal_sessions` ADD CONSTRAINT `terminal_sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `terminal_sessions` ADD CONSTRAINT `terminal_sessions_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `terminal_sessions` ADD CONSTRAINT `terminal_sessions_containerId_containers_id_fk` FOREIGN KEY (`containerId`) REFERENCES `containers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usage` ADD CONSTRAINT `usage_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usage` ADD CONSTRAINT `usage_workspaceId_workspaces_id_fk` FOREIGN KEY (`workspaceId`) REFERENCES `workspaces`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usage` ADD CONSTRAINT `usage_containerId_containers_id_fk` FOREIGN KEY (`containerId`) REFERENCES `containers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspaces` ADD CONSTRAINT `workspaces_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;