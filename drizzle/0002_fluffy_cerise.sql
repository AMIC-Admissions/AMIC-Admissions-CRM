CREATE TABLE `grades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`level` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `grades_id` PRIMARY KEY(`id`),
	CONSTRAINT `grades_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `seats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school` varchar(255) NOT NULL,
	`grade` varchar(255) NOT NULL,
	`section` varchar(10) NOT NULL,
	`capacity` int NOT NULL,
	`reservedSeats` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `seats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
DROP TABLE `seatCapacities`;--> statement-breakpoint
ALTER TABLE `students` DROP INDEX `students_studentId_idx`;--> statement-breakpoint
ALTER TABLE `schools` MODIFY COLUMN `name` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `students` MODIFY COLUMN `studentId` varchar(50) NOT NULL;--> statement-breakpoint
ALTER TABLE `students` MODIFY COLUMN `name` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `students` MODIFY COLUMN `nationality` varchar(100);--> statement-breakpoint
ALTER TABLE `students` MODIFY COLUMN `school` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `students` MODIFY COLUMN `grade` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `students` MODIFY COLUMN `status` enum('Registered','Assessed','Passed','Enrolled','Withdrawn') NOT NULL DEFAULT 'Registered';--> statement-breakpoint
ALTER TABLE `students` MODIFY COLUMN `paymentStatus` enum('Pending','Paid') NOT NULL DEFAULT 'Pending';--> statement-breakpoint
ALTER TABLE `students` MODIFY COLUMN `paymentMethod` enum('Cash','Tamara','JeelPay','Promissory Note');--> statement-breakpoint
ALTER TABLE `students` ADD `section` varchar(10);--> statement-breakpoint
ALTER TABLE `students` ADD `studentType` enum('New','Re-Registration','Enrollment') DEFAULT 'New' NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `seatReserved` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD CONSTRAINT `students_studentId_unique` UNIQUE(`studentId`);--> statement-breakpoint
ALTER TABLE `students` DROP COLUMN `createdBy`;