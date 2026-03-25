-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "maxDh" INTEGER NOT NULL DEFAULT 1,
    "minBatters" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Season_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Season" ("allowPitcherReentry", "balls", "cleanHitRule", "createdAt", "dpKeepsRunners", "dpWithoutRunners", "eraStandard", "ghostRunner", "id", "inningsPerGame", "isBaserunning", "isSpeedRestricted", "isTournament", "leagueId", "mercyRule", "mercyRuleInningApply", "mercyRulePerInning", "name", "outs", "playoffInnings", "speedLimit", "status", "strikes", "unlimitedLastInning") SELECT "allowPitcherReentry", "balls", "cleanHitRule", "createdAt", "dpKeepsRunners", "dpWithoutRunners", "eraStandard", "ghostRunner", "id", "inningsPerGame", "isBaserunning", "isSpeedRestricted", "isTournament", "leagueId", "mercyRule", "mercyRuleInningApply", "mercyRulePerInning", "name", "outs", "playoffInnings", "speedLimit", "status", "strikes", "unlimitedLastInning" FROM "Season";
DROP TABLE "Season";
ALTER TABLE "new_Season" RENAME TO "Season";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
