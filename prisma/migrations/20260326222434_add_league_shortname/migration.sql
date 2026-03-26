/*
  Warnings:

  - A unique constraint covering the columns `[verificationToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "League" ADD COLUMN "shortName" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailVerified" DATETIME;
ALTER TABLE "User" ADD COLUMN "verificationToken" TEXT;

-- CreateTable
CREATE TABLE "ManualStatLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "position" TEXT DEFAULT 'F',
    "pa" INTEGER NOT NULL DEFAULT 0,
    "ab" INTEGER NOT NULL DEFAULT 0,
    "h" INTEGER NOT NULL DEFAULT 0,
    "d2b" INTEGER NOT NULL DEFAULT 0,
    "d3b" INTEGER NOT NULL DEFAULT 0,
    "hr" INTEGER NOT NULL DEFAULT 0,
    "rbi" INTEGER NOT NULL DEFAULT 0,
    "r" INTEGER NOT NULL DEFAULT 0,
    "bb" INTEGER NOT NULL DEFAULT 0,
    "k" INTEGER NOT NULL DEFAULT 0,
    "ip" REAL NOT NULL DEFAULT 0.0,
    "ph" INTEGER NOT NULL DEFAULT 0,
    "pr" INTEGER NOT NULL DEFAULT 0,
    "per" INTEGER NOT NULL DEFAULT 0,
    "pbb" INTEGER NOT NULL DEFAULT 0,
    "pk" INTEGER NOT NULL DEFAULT 0,
    "phr" INTEGER NOT NULL DEFAULT 0,
    "win" BOOLEAN NOT NULL DEFAULT false,
    "loss" BOOLEAN NOT NULL DEFAULT false,
    "save" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ManualStatLine_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ManualStatLine_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ManualStatLine_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistoricalStat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "playerId" INTEGER NOT NULL,
    "season" TEXT NOT NULL,
    "leagueId" INTEGER NOT NULL,
    "hits" INTEGER NOT NULL,
    "atBats" INTEGER NOT NULL,
    "homeRuns" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "eras" REAL NOT NULL,
    CONSTRAINT "HistoricalStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_verificationToken_key" ON "User"("verificationToken");
