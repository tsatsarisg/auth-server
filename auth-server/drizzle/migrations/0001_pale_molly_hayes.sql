ALTER TABLE "users" ALTER COLUMN "password_hash" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "jti" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ALTER COLUMN "hash" SET DATA TYPE text;