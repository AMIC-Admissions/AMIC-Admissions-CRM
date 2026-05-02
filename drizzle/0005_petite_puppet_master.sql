CREATE TABLE `seat_master` (
	`id` int AUTO_INCREMENT NOT NULL,
	`school` varchar(100) NOT NULL,
	`grade` varchar(50) NOT NULL,
	`section` varchar(10) NOT NULL,
	`gender` varchar(20) NOT NULL,
	`capacity` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `seat_master_id` PRIMARY KEY(`id`)
);
