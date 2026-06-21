-- CreateTable
CREATE TABLE "EcoActivity" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "carbonSaved" REAL NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EcoActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "img" TEXT,
    "price" REAL NOT NULL,
    "oriPrice" REAL NOT NULL,
    "pointsUsed" INTEGER NOT NULL DEFAULT 0,
    "pointsDeduct" INTEGER NOT NULL DEFAULT 0,
    "finalPrice" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT '待支付',
    "tradeIn" BOOLEAN NOT NULL DEFAULT false,
    "carbonCreditsAwarded" INTEGER NOT NULL DEFAULT 0,
    "meta" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("createdAt", "finalPrice", "id", "img", "meta", "oriPrice", "pointsDeduct", "pointsUsed", "price", "status", "title", "type", "userId") SELECT "createdAt", "finalPrice", "id", "img", "meta", "oriPrice", "pointsDeduct", "pointsUsed", "price", "status", "title", "type", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "carbonCredits" INTEGER NOT NULL DEFAULT 0,
    "balance" REAL NOT NULL DEFAULT 200,
    "couponCount" INTEGER NOT NULL DEFAULT 2,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("avatar", "balance", "couponCount", "createdAt", "email", "id", "password", "points", "updatedAt", "username") SELECT "avatar", "balance", "couponCount", "createdAt", "email", "id", "password", "points", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
