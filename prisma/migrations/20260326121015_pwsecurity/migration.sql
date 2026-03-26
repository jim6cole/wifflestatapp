/*
  Warnings:

  - A unique constraint covering the columns `[resetToken]` on the table `League` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "League" ADD COLUMN "emailVerified" DATETIME;
ALTER TABLE "League" ADD COLUMN "resetToken" TEXT;
ALTER TABLE "League" ADD COLUMN "resetTokenExpiry" DATETIME;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AtBat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameId" INTEGER NOT NULL,
    "batterId" INTEGER NOT NULL,
    "pitcherId" INTEGER NOT NULL,
    "runAttribution" TEXT,
    "slot" INTEGER NOT NULL,
    "inning" INTEGER NOT NULL DEFAULT 1,
    "isTopInning" BOOLEAN NOT NULL DEFAULT true,
    "result" TEXT,
    "runsScored" INTEGER NOT NULL DEFAULT 0,
    "rbi" INTEGER NOT NULL DEFAULT 0,
    "balls" INTEGER NOT NULL DEFAULT 0,
    "strikes" INTEGER NOT NULL DEFAULT 0,
    "outs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "runnersOn" INTEGER NOT NULL DEFAULT 0,
    "outsAtStart" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "AtBat_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AtBat_batterId_fkey" FOREIGN KEY ("batterId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AtBat_pitcherId_fkey" FOREIGN KEY ("pitcherId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AtBat" ("balls", "batterId", "createdAt", "gameId", "id", "inning", "isTopInning", "outs", "pitcherId", "rbi", "result", "runAttribution", "runsScored", "slot", "strikes") SELECT "balls", "batterId", "createdAt", "gameId", "id", "inning", "isTopInning", "outs", "pitcherId", "rbi", "result", "runAttribution", "runsScored", "slot", "strikes" FROM "AtBat";
DROP TABLE "AtBat";
ALTER TABLE "new_AtBat" RENAME TO "AtBat";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "League_resetToken_key" ON "League"("resetToken");
