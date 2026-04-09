-- CreateTable
CREATE TABLE "OnboardingTurn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "turnIndex" INTEGER NOT NULL,
    "assistantPromptText" TEXT NOT NULL,
    "userInputMode" TEXT NOT NULL,
    "userAudioUrl" TEXT,
    "asrText" TEXT,
    "userText" TEXT,
    "normalizedUserText" TEXT NOT NULL,
    "assistantReplyText" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OnboardingTurn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "OnboardingSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileAgentSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "summary" TEXT,
    "moodSnapshotJson" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "lastTurnAt" DATETIME,
    CONSTRAINT "ProfileAgentSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileAgentTurn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "turnIndex" INTEGER NOT NULL,
    "agentPromptText" TEXT NOT NULL,
    "agentPromptAudioUrl" TEXT,
    "userAudioUrl" TEXT,
    "userTranscriptText" TEXT NOT NULL,
    "assistantReplyText" TEXT NOT NULL,
    "assistantReplyAudioUrl" TEXT,
    "inputMode" TEXT NOT NULL,
    "asrProvider" TEXT NOT NULL,
    "llmProvider" TEXT NOT NULL,
    "ttsProvider" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfileAgentTurn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ProfileAgentSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileAgentTurn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileMemoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceSessionId" TEXT NOT NULL,
    "memoryType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "evidenceJson" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "importance" INTEGER NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProfileMemoryItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfilePersonaTrait" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "traitKey" TEXT NOT NULL,
    "traitLabel" TEXT NOT NULL,
    "traitValue" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "sourceMemoryId" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProfilePersonaTrait_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileMemoryJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "sourceType" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "turnId" TEXT,
    "jobType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "scheduledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    "profileAgentSessionId" TEXT,
    "profileAgentTurnId" TEXT,
    "onboardingSessionId" TEXT,
    "onboardingTurnId" TEXT,
    CONSTRAINT "ProfileMemoryJob_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileMemoryJob_profileAgentSessionId_fkey" FOREIGN KEY ("profileAgentSessionId") REFERENCES "ProfileAgentSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileMemoryJob_profileAgentTurnId_fkey" FOREIGN KEY ("profileAgentTurnId") REFERENCES "ProfileAgentTurn" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileMemoryJob_onboardingSessionId_fkey" FOREIGN KEY ("onboardingSessionId") REFERENCES "OnboardingSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfileMemoryJob_onboardingTurnId_fkey" FOREIGN KEY ("onboardingTurnId") REFERENCES "OnboardingTurn" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingTurn_sessionId_turnIndex_key" ON "OnboardingTurn"("sessionId", "turnIndex");

-- CreateIndex
CREATE INDEX "ProfileAgentSession_userId_status_idx" ON "ProfileAgentSession"("userId", "status");

-- CreateIndex
CREATE INDEX "ProfileAgentTurn_userId_createdAt_idx" ON "ProfileAgentTurn"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileAgentTurn_sessionId_turnIndex_key" ON "ProfileAgentTurn"("sessionId", "turnIndex");

-- CreateIndex
CREATE INDEX "ProfileMemoryItem_userId_sourceType_isVisible_idx" ON "ProfileMemoryItem"("userId", "sourceType", "isVisible");

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePersonaTrait_userId_traitKey_key" ON "ProfilePersonaTrait"("userId", "traitKey");

-- CreateIndex
CREATE INDEX "ProfileMemoryJob_status_scheduledAt_idx" ON "ProfileMemoryJob"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "ProfileMemoryJob_sourceType_sessionId_idx" ON "ProfileMemoryJob"("sourceType", "sessionId");
