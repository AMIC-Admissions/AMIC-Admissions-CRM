-- Data migration: Map old studentType values to new ones
UPDATE students SET studentType = 'New Admission' WHERE studentType = 'New';
UPDATE students SET studentType = 'Re-Registration' WHERE studentType = 'Re-Registration';
UPDATE students SET studentType = 'Enrollment' WHERE studentType = 'Enrollment';

-- Now apply the schema changes
ALTER TABLE `students` MODIFY COLUMN `nationality` enum('Saudi','Non-Saudi') NOT NULL DEFAULT 'Saudi';
ALTER TABLE `students` MODIFY COLUMN `studentType` enum('New Admission','Enrollment','Re-Registration','Transfer') NOT NULL DEFAULT 'New Admission';
ALTER TABLE `students` ADD `dateOfBirth` date;
ALTER TABLE `students` ADD `dateOfJoin` date;
ALTER TABLE `students` ADD `assessed` boolean DEFAULT false NOT NULL;
ALTER TABLE `students` ADD `passed` boolean DEFAULT false NOT NULL;
ALTER TABLE `students` ADD `reAssessment` boolean DEFAULT false NOT NULL;
ALTER TABLE `students` ADD `passedRe` boolean DEFAULT false NOT NULL;
ALTER TABLE `students` ADD `registration` boolean DEFAULT false NOT NULL;
ALTER TABLE `students` ADD `enrollment` boolean DEFAULT false NOT NULL;
ALTER TABLE `students` ADD `transfer` boolean DEFAULT false NOT NULL;
ALTER TABLE `students` ADD `firstInstallment` boolean DEFAULT false NOT NULL;
ALTER TABLE `students` ADD `secondInstallment` boolean DEFAULT false NOT NULL;
ALTER TABLE `students` ADD `fullPayment` boolean DEFAULT false NOT NULL;
ALTER TABLE `students` ADD `promissoryNote` boolean DEFAULT false NOT NULL;
ALTER TABLE `students` ADD `tamara` boolean DEFAULT false NOT NULL;
ALTER TABLE `students` ADD `jeelPay` boolean DEFAULT false NOT NULL;
ALTER TABLE `students` ADD `docsSigned` boolean DEFAULT false NOT NULL;
ALTER TABLE `students` ADD `requirementsSubmitted` boolean DEFAULT false NOT NULL;
ALTER TABLE `students` ADD `fatherId` varchar(50);
ALTER TABLE `students` ADD `fatherMobile` varchar(20);
ALTER TABLE `students` ADD `motherId` varchar(50);
ALTER TABLE `students` ADD `motherMobile` varchar(20);
ALTER TABLE `students` ADD `notes` text;
