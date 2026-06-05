-- CreateTable
CREATE TABLE `creators` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `mobile` VARCHAR(15) NOT NULL,
    `instagram` VARCHAR(100) NOT NULL,
    `category` ENUM('influencer', 'actor', 'model', 'creator', 'public_figure') NOT NULL,
    `city` VARCHAR(50) NOT NULL,
    `bio` VARCHAR(200) NULL,
    `photoUrl` VARCHAR(500) NULL,
    `followerCount` VARCHAR(20) NULL,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `isFeatured` BOOLEAN NOT NULL DEFAULT false,
    `isApproved` BOOLEAN NOT NULL DEFAULT false,
    `referralCode` VARCHAR(20) NOT NULL,
    `referredBy` VARCHAR(36) NULL,
    `pointsBalance` INTEGER NOT NULL DEFAULT 0,
    `passwordVersion` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `creators_email_key`(`email`),
    UNIQUE INDEX `creators_instagram_key`(`instagram`),
    UNIQUE INDEX `creators_referralCode_key`(`referralCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `brand_inquiries` (
    `id` VARCHAR(36) NOT NULL,
    `brandName` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `mobile` VARCHAR(15) NOT NULL,
    `budgetRange` VARCHAR(50) NOT NULL,
    `categories` JSON NOT NULL,
    `message` TEXT NOT NULL,
    `status` ENUM('new', 'in_progress', 'completed', 'rejected') NOT NULL DEFAULT 'new',
    `assignedTo` VARCHAR(36) NULL,
    `packageType` ENUM('basic', 'growth', 'premium') NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `points_transactions` (
    `id` VARCHAR(36) NOT NULL,
    `creatorId` VARCHAR(36) NOT NULL,
    `type` ENUM('earn', 'redeem') NOT NULL,
    `reason` ENUM('signup', 'referral', 'referral_milestone', 'admin_grant', 'redemption') NOT NULL,
    `points` INTEGER NOT NULL,
    `note` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `referrals` (
    `id` VARCHAR(36) NOT NULL,
    `referrerId` VARCHAR(36) NOT NULL,
    `referredId` VARCHAR(36) NOT NULL,
    `status` ENUM('pending', 'confirmed') NOT NULL DEFAULT 'pending',
    `pointsCredited` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `referrals_referredId_key`(`referredId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `redemption_requests` (
    `id` VARCHAR(36) NOT NULL,
    `creatorId` VARCHAR(36) NOT NULL,
    `rewardType` ENUM('featured', 'ig_promo', 'event_entry', 'collab_priority') NOT NULL,
    `pointsCost` INTEGER NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    `adminNote` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaigns` (
    `id` VARCHAR(36) NOT NULL,
    `brandInquiryId` VARCHAR(36) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `status` ENUM('planning', 'active', 'completed') NOT NULL DEFAULT 'planning',
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaign_creators` (
    `id` VARCHAR(36) NOT NULL,
    `campaignId` VARCHAR(36) NOT NULL,
    `creatorId` VARCHAR(36) NOT NULL,
    `status` ENUM('invited', 'confirmed', 'completed') NOT NULL DEFAULT 'invited',
    `deliverables` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `campaign_creators_campaignId_creatorId_key`(`campaignId`, `creatorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `passwordVersion` INTEGER NOT NULL DEFAULT 0,
    `role` ENUM('super_admin', 'manager') NOT NULL DEFAULT 'manager',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `admins_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` VARCHAR(36) NOT NULL,
    `brandInquiryId` VARCHAR(36) NOT NULL,
    `creatorId` VARCHAR(36) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `platformFee` DECIMAL(10, 2) NOT NULL,
    `creatorEarnings` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('pending', 'initiated', 'processing', 'completed', 'failed', 'refunded', 'disputed') NOT NULL DEFAULT 'pending',
    `paymentMethod` VARCHAR(50) NULL,
    `razorpayOrderId` VARCHAR(100) NULL,
    `razorpayPaymentId` VARCHAR(100) NULL,
    `razorpaySignature` VARCHAR(255) NULL,
    `gstAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `tdsAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `invoiceUrl` LONGTEXT NULL,
    `agreementUrl` LONGTEXT NULL,
    `paidAt` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `payments_razorpayOrderId_key`(`razorpayOrderId`),
    UNIQUE INDEX `payments_razorpayPaymentId_key`(`razorpayPaymentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payouts` (
    `id` VARCHAR(36) NOT NULL,
    `creatorId` VARCHAR(36) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('pending', 'processing', 'completed', 'failed', 'on_hold') NOT NULL DEFAULT 'pending',
    `paymentMethod` VARCHAR(50) NOT NULL,
    `upiId` VARCHAR(100) NULL,
    `accountNumber` VARCHAR(50) NULL,
    `ifscCode` VARCHAR(20) NULL,
    `bankName` VARCHAR(100) NULL,
    `accountHolder` VARCHAR(100) NULL,
    `cashfreePayoutId` VARCHAR(100) NULL,
    `processedAt` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaign_analytics` (
    `id` VARCHAR(36) NOT NULL,
    `campaignId` VARCHAR(36) NOT NULL,
    `totalReach` INTEGER NOT NULL DEFAULT 0,
    `totalImpressions` INTEGER NOT NULL DEFAULT 0,
    `totalEngagement` INTEGER NOT NULL DEFAULT 0,
    `totalClicks` INTEGER NOT NULL DEFAULT 0,
    `engagementRate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `ctr` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `conversions` INTEGER NOT NULL DEFAULT 0,
    `roi` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `reportUrl` VARCHAR(500) NULL,
    `updated_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `campaign_analytics_campaignId_key`(`campaignId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `creator_analytics` (
    `id` VARCHAR(36) NOT NULL,
    `creatorId` VARCHAR(36) NOT NULL,
    `profileViews` INTEGER NOT NULL DEFAULT 0,
    `totalEarnings` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `avgEngagementRate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `totalCollaborations` INTEGER NOT NULL DEFAULT 0,
    `successRate` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `responseTime` INTEGER NOT NULL DEFAULT 0,
    `updated_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `creator_analytics_creatorId_key`(`creatorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `messages` (
    `id` VARCHAR(36) NOT NULL,
    `senderId` VARCHAR(36) NOT NULL,
    `senderType` VARCHAR(20) NOT NULL,
    `recipientId` VARCHAR(36) NOT NULL,
    `recipientType` VARCHAR(20) NOT NULL,
    `campaignId` VARCHAR(36) NULL,
    `content` TEXT NOT NULL,
    `attachments` JSON NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reviews` (
    `id` VARCHAR(36) NOT NULL,
    `campaignId` VARCHAR(36) NOT NULL,
    `brandRating` INTEGER NOT NULL,
    `creatorRating` INTEGER NOT NULL,
    `brandReview` TEXT NULL,
    `creatorReview` TEXT NULL,
    `wouldWorkAgain` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `reviews_campaignId_key`(`campaignId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `otp_verifications` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `otp` VARCHAR(255) NOT NULL,
    `userData` JSON NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `otp_verifications_email_otp_idx`(`email`, `otp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(36) NOT NULL,
    `creatorId` VARCHAR(36) NOT NULL,
    `tokenHash` VARCHAR(64) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_tokenHash_key`(`tokenHash`),
    INDEX `refresh_tokens_creatorId_expiresAt_idx`(`creatorId`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `creators` ADD CONSTRAINT `creators_referredBy_fkey` FOREIGN KEY (`referredBy`) REFERENCES `creators`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `creators`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `brand_inquiries` ADD CONSTRAINT `brand_inquiries_assignedTo_fkey` FOREIGN KEY (`assignedTo`) REFERENCES `creators`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `points_transactions` ADD CONSTRAINT `points_transactions_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `creators`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_referrerId_fkey` FOREIGN KEY (`referrerId`) REFERENCES `creators`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referrals` ADD CONSTRAINT `referrals_referredId_fkey` FOREIGN KEY (`referredId`) REFERENCES `creators`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `redemption_requests` ADD CONSTRAINT `redemption_requests_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `creators`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_brandInquiryId_fkey` FOREIGN KEY (`brandInquiryId`) REFERENCES `brand_inquiries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_creators` ADD CONSTRAINT `campaign_creators_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_creators` ADD CONSTRAINT `campaign_creators_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `creators`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_brandInquiryId_fkey` FOREIGN KEY (`brandInquiryId`) REFERENCES `brand_inquiries`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `creators`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payouts` ADD CONSTRAINT `payouts_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `creators`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaign_analytics` ADD CONSTRAINT `campaign_analytics_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `creator_analytics` ADD CONSTRAINT `creator_analytics_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `creators`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
