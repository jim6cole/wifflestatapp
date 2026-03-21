-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AtBat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameId" INTEGER NOT NULL,
    "batterId" INTEGER NOT NULL,
    "pitcherId" INTEGER NOT NULL,
    "inning" INTEGER NOT NULL DEFAULT 1,
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
    "homeTeamId" INTEGER NOT NULL,
    "awayTeamId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "homeScore" INTEGER NOT NULL DEFAULT 0,
    "awayScore" INTEGER NOT NULL DEFAULT 0,
    "currentInning" INTEGER NOT NULL DEFAULT 1,
    "isTopInning" BOOLEAN NOT NULL DEFAULT true,
    "currentHomePitcherId" INTEGER,
    "currentAwayPitcherId" INTEGER,
    "scheduledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seasonId" INTEGER,
    CONSTRAINT "Game_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Game_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Game_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Game" ("awayScore", "awayTeamId", "createdAt", "currentAwayPitcherId", "currentHomePitcherId", "currentInning", "homeScore", "homeTeamId", "id", "isTopInning", "scheduledAt", "seasonId", "status") SELECT "awayScore", "awayTeamId", "createdAt", "currentAwayPitcherId", "currentHomePitcherId", "currentInning", "homeScore", "homeTeamId", "id", "isTopInning", "scheduledAt", "seasonId", "status" FROM "Game";
DROP TABLE "Game";
ALTER TABLE "new_Game" RENAME TO "Game";
CREATE TABLE "new_LineupEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "battingOrder" INTEGER NOT NULL,
    "isPitcher" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "LineupEntry_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LineupEntry_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LineupEntry_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LineupEntry" ("battingOrder", "gameId", "id", "isPitcher", "playerId", "teamId") SELECT "battingOrder", "gameId", "id", "isPitcher", "playerId", "teamId" FROM "LineupEntry";
DROP TABLE "LineupEntry";
ALTER TABLE "new_LineupEntry" RENAME TO "LineupEntry";
CREATE TABLE "new_Player" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "teamId" INTEGER NOT NULL,
    CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Player" ("id", "name", "teamId") SELECT "id", "name", "teamId" FROM "Player";
DROP TABLE "Player";
ALTER TABLE "new_Player" RENAME TO "Player";
CREATE TABLE "new_Season" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "leagueId" INTEGER NOT NULL,
    "inningsPerGame" INTEGER NOT NULL DEFAULT 4,
    "eraStandard" INTEGER NOT NULL DEFAULT 4,
    "balls" INTEGER NOT NULL DEFAULT 4,
    "strikes" INTEGER NOT NULL DEFAULT 3,
    "outs" INTEGER NOT NULL DEFAULT 3,
    "isSpeedRestricted" BOOLEAN NOT NULL DEFAULT false,
    "isBaserunning" BOOLEAN NOT NULL DEFAULT true,
    "cleanHitRule" BOOLEAN NOT NULL DEFAULT true,
    "ghostRunner" BOOLEAN NOT NULL DEFAULT false,
    "mercyRule" INTEGER NOT NULL DEFAULT 10,
    "dpWithoutRunners" BOOLEAN NOT NULL DEFAULT false,
    "dpKeepsRunners" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Season_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Season" ("cleanHitRule", "createdAt", "eraStandard", "ghostRunner", "id", "inningsPerGame", "leagueId", "mercyRule", "name") SELECT "cleanHitRule", "createdAt", "eraStandard", "ghostRunner", "id", "inningsPerGame", "leagueId", "mercyRule", "name" FROM "Season";
DROP TABLE "Season";
ALTER TABLE "new_Season" RENAME TO "Season";
CREATE TABLE "new_Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "leagueId" INTEGER NOT NULL,
    "seasonId" INTEGER,
    CONSTRAINT "Team_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Team_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Team" ("id", "leagueId", "name", "seasonId") SELECT "id", "leagueId", "name", "seasonId" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
CREATE UNIQUE INDEX "Team_name_leagueId_key" ON "Team"("name", "leagueId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
