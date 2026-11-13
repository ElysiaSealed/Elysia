-- Rename the burn amount column to match the Elysia token ($ELYS). Data-preserving.
ALTER TABLE "burns" RENAME COLUMN "nexa_burned" TO "elys_burned";
