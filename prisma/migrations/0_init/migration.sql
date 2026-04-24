-- Migration: 0_init
-- Baseline migration — represents the schema already applied via supabase/migrations/001_initial_schema.sql
-- Prisma will record this as applied without running it (use `prisma migrate resolve --applied 0_init`)

-- CreateTable
CREATE TABLE IF NOT EXISTS "user_profiles" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "user_role" TEXT NOT NULL,
    "company_name" TEXT,
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "role_title" TEXT NOT NULL,
    "bio" TEXT,
    "skills" TEXT[] DEFAULT '{}',
    "years_experience" INTEGER NOT NULL DEFAULT 0,
    "salary_expectation" INTEGER,
    "location" TEXT,
    "timezone" TEXT,
    "availability_status" TEXT NOT NULL DEFAULT 'open',
    "portfolio_url" TEXT,
    "cv_url" TEXT,
    "intro_video_url" TEXT,
    "profile_views" INTEGER NOT NULL DEFAULT 0,
    "times_shown" INTEGER NOT NULL DEFAULT 0,
    "availability_updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "interview_requests" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employer_id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "stage" TEXT NOT NULL DEFAULT 'discovered',
    "message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "interview_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "profile_views" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "profile_id" UUID NOT NULL,
    "viewer_id" UUID,
    "viewed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "profile_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "interview_requests_employer_id_profile_id_key"
    ON "interview_requests"("employer_id", "profile_id");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT IF NOT EXISTS "profiles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_requests" ADD CONSTRAINT IF NOT EXISTS "interview_requests_employer_id_fkey"
    FOREIGN KEY ("employer_id") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_requests" ADD CONSTRAINT IF NOT EXISTS "interview_requests_profile_id_fkey"
    FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_views" ADD CONSTRAINT IF NOT EXISTS "profile_views_profile_id_fkey"
    FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
