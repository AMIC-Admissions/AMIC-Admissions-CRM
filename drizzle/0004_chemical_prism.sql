ALTER TABLE `students` MODIFY COLUMN `nationality` enum('Saudi','Non-Saudi') NOT NULL DEFAULT 'Saudi';--> statement-breakpoint
ALTER TABLE `students` MODIFY COLUMN `studentType` enum('New Admission','Enrollment','Re-Registration','Transfer') NOT NULL DEFAULT 'New Admission';--> statement-breakpoint
ALTER TABLE `students` ADD `dateOfBirth` date;--> statement-breakpoint
ALTER TABLE `students` ADD `dateOfJoin` date;--> statement-breakpoint
ALTER TABLE `students` ADD `assessed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `passed` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `reAssessment` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `passedRe` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `registration` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `enrollment` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `transfer` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `firstInstallment` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `secondInstallment` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `fullPayment` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `promissoryNote` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `tamara` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `jeelPay` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `docsSigned` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `requirementsSubmitted` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `students` ADD `fatherId` varchar(50);--> statement-breakpoint
ALTER TABLE `students` ADD `fatherMobile` varchar(20);--> statement-breakpoint
ALTER TABLE `students` ADD `motherId` varchar(50);--> statement-breakpoint
ALTER TABLE `students` ADD `motherMobile` varchar(20);--> statement-breakpoint
ALTER TABLE `students` ADD `notes` text;