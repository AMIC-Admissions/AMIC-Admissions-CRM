-- Fix seatReserved for ALL students based on correct logic
-- seatReserved = TRUE if:
--   studentType = "Re-Registration"
--   OR firstInstallment = TRUE
--   OR secondInstallment = TRUE
--   OR fullPayment = TRUE
--   OR promissoryNote = TRUE
--   OR tamara = TRUE
--   OR jeelPay = TRUE

-- Step 1: Reset all seatReserved to FALSE
UPDATE students
SET seatReserved = FALSE;

-- Step 2: Set seatReserved = TRUE for students matching the criteria
UPDATE students
SET seatReserved = TRUE
WHERE
  studentType = 'Re-Registration'
  OR firstInstallment = TRUE
  OR secondInstallment = TRUE
  OR fullPayment = TRUE
  OR promissoryNote = TRUE
  OR tamara = TRUE
  OR jeelPay = TRUE;
