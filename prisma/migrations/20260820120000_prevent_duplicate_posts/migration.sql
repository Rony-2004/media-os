-- Prevent the same normalized post content from being created twice per user and platform.

ALTER TABLE "posts" ADD COLUMN "contentFingerprint" TEXT;

CREATE UNIQUE INDEX "posts_userId_platform_contentFingerprint_key"
ON "posts"("userId", "platform", "contentFingerprint");
