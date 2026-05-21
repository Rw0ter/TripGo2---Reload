-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Scenic" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL DEFAULT '',
    "tag" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "hot" BOOLEAN NOT NULL DEFAULT false,
    "section" TEXT NOT NULL DEFAULT 'home',
    "sort" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Scenic" ("city", "hot", "id", "image", "name", "note", "sort", "summary", "tag") SELECT "city", "hot", "id", "image", "name", "note", "sort", "summary", "tag" FROM "Scenic";
DROP TABLE "Scenic";
ALTER TABLE "new_Scenic" RENAME TO "Scenic";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
