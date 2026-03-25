/*
  Warnings:

  - You are about to drop the column `currentInning` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `isTopInning` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the column `seasonId` on the `Team` table. All the data in the column will be lost.
  - You are about to drop the column `isApproved` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `leagueId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `roleLevel` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[seasonId,teamId,playerId]` on the table `RosterSlot` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slot` to the `AtBat` table without a default value. This is not possible if the table is not empty.
  - Made the column `seasonId` on table `Game` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "RosterSlot_playerId_teamId_seasonId_key";

-- CreateTable
CREATE TABLE "LeagueMembership" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "leagueId" INTEGER NOT NULL,
    "roleLevel" INTEGER NOT NULL DEFAULT 1,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "LeagueMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LeagueMembership_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InningScore" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameId" INTEGER NOT NULL,
    "inning" INTEGER NOT NULL,
    "homeRuns" INTEGER NOT NULL DEFAULT 0,
    "awayRuns" INTEGER NOT NULL DEFAULT 0,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "InningScore_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_SeasonToTeam" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_SeasonToTeam_A_fkey" FOREIGN KEY ("A") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_SeasonToTeam_B_fkey" FOREIGN KEY ("B") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    CONSTRAINT "AtBat_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AtBat_batterId_fkey" FOREIGN KEY ("batterId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AtBat_pitcherId_fkey" FOREIGN KEY ("pitcherId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AtBat" ("balls", "batterId", "createdAt", "gameId", "id", "inning", "outs", "pitcherId", "rbi", "result", "runsScored", "strikes") SELECT "balls", "batterId", "createdAt", "gameId", "id", "inning", "outs", "pitcherId", "rbi", "result", "runsScored", "strikes" FROM "AtBat";
DROP TABLE "AtBat";
ALTER TABLE "new_AtBat" RENAME TO "AtBat";
CREATE TABLE "new_Game" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "seasonId" INTEGER NOT NULL,
    "homeTeamId" INTEGER NOT NULL,
    "awayTeamId" INTEGER NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "homeScore" INTEGER NOT NULL DEFAULT 0,
    "awayScore" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "liveState" TEXT,
    "isPlayoff" BOOLEAN NOT NULL DEFAULT false,
    "currentHomePitcherId" INTEGER,
    "currentAwayPitcherId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Game_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Game_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Game_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Game" ("awayScore", "awayTeamId", "createdAt", "currentAwayPitcherId", "currentHomePitcherId", "homeScore", "homeTeamId", "id", "scheduledAt", "seasonId", "status") SELECT "awayScore", "awayTeamId", "createdAt", "currentAwayPitcherId", "currentHomePitcherId", "homeScore", "homeTeamId", "id", "scheduledAt", "seasonId", "status" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
CREATE TABLE "new_League" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "fullName" TEXT,
    "location" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_League" ("createdAt", "description", "fullName", "id", "isActive", "location", "name") SELECT "createdAt", "description", "fullName", "id", "isActive", "location", "name" FROM "League";
DROP TABLE "League";
ALTER TABLE "new_League" RENAME TO "League";
CREATE TABLE "new_LineupEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "battingOrder" INTEGER NOT NULL,
    "isPitcher" BOOLEAN NOT NULL DEFAULT false,
    "position" TEXT NOT NULL DEFAULT 'Fielder',
    CONSTRAINT "LineupEntry_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LineupEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LineupEntry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LineupEntry" ("battingOrder", "gameId", "id", "isPitcher", "playerId", "teamId") SELECT "battingOrder", "gameId", "id", "isPitcher", "playerId", "teamId" FROM "LineupEntry";
DROP TABLE "LineupEntry";
ALTER TABLE "new_LineupEntry" RENAME TO "LineupEntry";
CREATE TABLE "new_Player" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "leagueId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Player" ("id", "name") SELECT "id", "name" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
CREATE TABLE "new_Season" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "leagueId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "inningsPerGame" INTEGER NOT NULL DEFAULT 4,
    "isTournament" BOOLEAN NOT NULL DEFAULT false,
    "playoffInnings" INTEGER DEFAULT 5,
    "eraStandard" INTEGER NOT NULL DEFAULT 4,
    "balls" INTEGER NOT NULL DEFAULT 4,
    "strikes" INTEGER NOT NULL DEFAULT 3,
    "outs" INTEGER NOT NULL DEFAULT 3,
    "isSpeedRestricted" BOOLEAN NOT NULL DEFAULT false,
    "speedLimit" INTEGER NOT NULL DEFAULT 60,
    "isBaserunning" BOOLEAN NOT NULL DEFAULT true,
    "cleanHitRule" BOOLEAN NOT NULL DEFAULT true,
    "ghostRunner" BOOLEAN NOT NULL DEFAULT false,
    "dpWithoutRunners" BOOLEAN NOT NULL DEFAULT false,
    "dpKeepsRunners" BOOLEAN NOT NULL DEFAULT false,
    "mercyRule" INTEGER NOT NULL DEFAULT 10,
    "mercyRulePerInning" INTEGER NOT NULL DEFAULT 0,
    "mercyRuleInningApply" INTEGER NOT NULL DEFAULT 3,
    "unlimitedLastInning" BOOLEAN NOT NULL DEFAULT false,
    "allowPitcherReentry" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Season_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Season" ("balls", "cleanHitRule", "createdAt", "dpKeepsRunners", "dpWithoutRunners", "eraStandard", "ghostRunner", "id", "inningsPerGame", "isBaserunning", "isSpeedRestricted", "leagueId", "mercyRule", "name", "outs", "strikes") SELECT "balls", "cleanHitRule", "createdAt", "dpKeepsRunners", "dpWithoutRunners", "eraStandard", "ghostRunner", "id", "inningsPerGame", "isBaserunning", "isSpeedRestricted", "leagueId", "mercyRule", "name", "outs", "strikes" FROM "Season";
DROP TABLE "Season";
ALTER TABLE "new_Season" RENAME TO "Season";
CREATE TABLE "new_Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "leagueId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Team_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("id", "leagueId", "name") SELECT "id", "leagueId", "name" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "isGlobalAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("createdAt", "email", "id", "name", "password") SELECT "createdAt", "email", "id", "name", "password" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "LeagueMembership_userId_leagueId_key" ON "LeagueMembership"("userId", "leagueId");

-- CreateIndex
CREATE UNIQUE INDEX "_SeasonToTeam_AB_unique" ON "_SeasonToTeam"("A", "B");

-- CreateIndex
CREATE INDEX "_SeasonToTeam_B_index" ON "_SeasonToTeam"("B");

-- CreateIndex
CREATE UNIQUE INDEX "RosterSlot_seasonId_teamId_playerId_key" ON "RosterSlot"("seasonId", "teamId", "playerId");
