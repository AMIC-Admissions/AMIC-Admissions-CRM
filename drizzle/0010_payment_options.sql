ALTER TABLE `students` MODIFY COLUMN `paymentStatus` enum('Pending','Partial','Paid') NOT NULL DEFAULT 'Pending';--> statement-breakpoint
ALTER TABLE `students` MODIFY COLUMN `paymentMethod` enum('Cash','Bank Transfer','Card','Tamara','JeelPay','Promissory Note');--> statement-breakpoint
