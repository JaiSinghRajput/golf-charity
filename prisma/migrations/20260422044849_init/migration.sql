-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "DrawStatus" AS ENUM ('DRAFT', 'SIMULATED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "DrawLogic" AS ENUM ('RANDOM', 'WEIGHTED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('UPDATE', 'DRAW_RESULT', 'WINNER_ALERT');

-- CreateEnum
CREATE TYPE "DonationSource" AS ENUM ('SUBSCRIPTION', 'DIRECT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "selectedCharityId" TEXT,
    "contributionPercent" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Charity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "events" JSONB,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Charity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "PlanType" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'INACTIVE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "amountCents" INTEGER NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoreEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Draw" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "DrawStatus" NOT NULL DEFAULT 'DRAFT',
    "logic" "DrawLogic" NOT NULL,
    "numbers" INTEGER[],
    "simulationNumbers" INTEGER[],
    "jackpotCarryCents" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Draw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrawTicket" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "numbers" INTEGER[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrawTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrawWinner" (
    "id" TEXT NOT NULL,
    "drawId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchCount" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "proofUrl" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrawWinner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonthlyPool" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "activeSubscribers" INTEGER NOT NULL,
    "totalPoolCents" INTEGER NOT NULL,
    "fiveMatchPoolCents" INTEGER NOT NULL,
    "fourMatchPoolCents" INTEGER NOT NULL,
    "threeMatchPoolCents" INTEGER NOT NULL,
    "rolloverCents" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonthlyPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "charityId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "source" "DonationSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Charity_name_key" ON "Charity"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Charity_slug_key" ON "Charity"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "ScoreEntry_userId_date_idx" ON "ScoreEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreEntry_userId_date_key" ON "ScoreEntry"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Draw_month_year_key" ON "Draw"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "DrawTicket_drawId_userId_key" ON "DrawTicket"("drawId", "userId");

-- CreateIndex
CREATE INDEX "DrawWinner_drawId_matchCount_idx" ON "DrawWinner"("drawId", "matchCount");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyPool_month_year_key" ON "MonthlyPool"("month", "year");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_selectedCharityId_fkey" FOREIGN KEY ("selectedCharityId") REFERENCES "Charity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreEntry" ADD CONSTRAINT "ScoreEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawTicket" ADD CONSTRAINT "DrawTicket_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "Draw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawTicket" ADD CONSTRAINT "DrawTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawWinner" ADD CONSTRAINT "DrawWinner_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "Draw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawWinner" ADD CONSTRAINT "DrawWinner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_charityId_fkey" FOREIGN KEY ("charityId") REFERENCES "Charity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
