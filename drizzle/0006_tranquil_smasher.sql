CREATE TABLE `fields_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`field_key` varchar(100) NOT NULL,
	`field_label` varchar(255) NOT NULL,
	`field_type` enum('text','select','checkbox','date','number') NOT NULL,
	`options` json,
	`required` boolean NOT NULL DEFAULT false,
	`section` varchar(100) NOT NULL DEFAULT 'general',
	`visible` boolean NOT NULL DEFAULT true,
	`order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `fields_config_id` PRIMARY KEY(`id`),
	CONSTRAINT `fields_config_field_key_unique` UNIQUE(`field_key`)
);
--> statement-breakpoint
CREATE TABLE `student_dynamic_data` (
	`id` int AUTO_INCREMENT NOT NULL,
	`student_id` int NOT NULL,
	`field_key` varchar(100) NOT NULL,
	`value` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `student_dynamic_data_id` PRIMARY KEY(`id`)
);
