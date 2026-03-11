-- CreateTable
CREATE TABLE "UserEmailConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'CUSTOM',
    "emailAddress" TEXT NOT NULL,
    "authType" TEXT NOT NULL DEFAULT 'authorization_code',
    "secretEncrypted" TEXT NOT NULL,
    "smtpHost" TEXT NOT NULL,
    "smtpPort" INTEGER NOT NULL,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT true,
    "imapHost" TEXT NOT NULL,
    "imapPort" INTEGER NOT NULL,
    "imapSecure" BOOLEAN NOT NULL DEFAULT true,
    "popHost" TEXT,
    "popPort" INTEGER,
    "popSecure" BOOLEAN,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastTestAt" DATETIME,
    "lastTestStatus" TEXT,
    "lastTestMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserEmailConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserEmailConfig_userId_key" ON "UserEmailConfig"("userId");
