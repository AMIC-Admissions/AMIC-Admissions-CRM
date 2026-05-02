CREATE TABLE `schools` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(120) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schools_id` PRIMARY KEY(`id`),
	CONSTRAINT `schools_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `seatCapacities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school` varchar(120) NOT NULL,
	`grade` varchar(80) NOT NULL,
	`capacity` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `seatCapacities_id` PRIMARY KEY(`id`),
	CONSTRAINT `seatCapacities_school_grade_idx` UNIQUE(`school`,`grade`)
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` varchar(64) NOT NULL,
	`name` varchar(240) NOT NULL,
	`gender` enum('Male','Female') NOT NULL,
	`nationality` varchar(120) NOT NULL,
	`school` varchar(120) NOT NULL,
	`grade` varchar(80) NOT NULL,
	`status` enum('Registered','Assessed','Passed','Enrolled') NOT NULL DEFAULT 'Registered',
	`registrationDate` timestamp NOT NULL DEFAULT (now()),
	`paymentStatus` enum('Paid','Pending') NOT NULL DEFAULT 'Pending',
	`paymentMethod` enum('Cash','Tamara','JeelPay') NOT NULL DEFAULT 'Cash',
	`fileComplete` boolean NOT NULL DEFAULT false,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `students_id` PRIMARY KEY(`id`),
	CONSTRAINT `students_studentId_idx` UNIQUE(`studentId`)
);
