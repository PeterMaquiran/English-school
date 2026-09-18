-- CreateEnum
CREATE TYPE "CefrLevel" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

-- CreateEnum
CREATE TYPE "LevelChangeSource" AS ENUM ('placement', 'evaluation', 'admin');

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "cefr_level" "CefrLevel",
    "target_level" "CefrLevel",
    "lesson_credits_remaining" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_score_bands" (
    "id" UUID NOT NULL,
    "min_score" DECIMAL(5,2) NOT NULL,
    "max_score" DECIMAL(5,2) NOT NULL,
    "cefr_level" "CefrLevel" NOT NULL,

    CONSTRAINT "placement_score_bands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "placement_tests" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "taken_at" TIMESTAMP(3) NOT NULL,
    "listening" DECIMAL(5,2),
    "reading" DECIMAL(5,2),
    "writing" DECIMAL(5,2),
    "speaking" DECIMAL(5,2),
    "overall" DECIMAL(5,2) NOT NULL,
    "recommended_level" "CefrLevel" NOT NULL,
    "confirmed_at" TIMESTAMP(3),
    "confirmed_by_user_id" UUID,
    "notes" TEXT,

    CONSTRAINT "placement_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_level_history" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "from_level" "CefrLevel",
    "to_level" "CefrLevel" NOT NULL,
    "source" "LevelChangeSource" NOT NULL,
    "actor_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_level_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_user_id_key" ON "students"("user_id");

-- CreateIndex
CREATE INDEX "placement_tests_student_id_idx" ON "placement_tests"("student_id");

-- CreateIndex
CREATE INDEX "student_level_history_student_id_created_at_idx" ON "student_level_history"("student_id", "created_at");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_tests" ADD CONSTRAINT "placement_tests_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "placement_tests" ADD CONSTRAINT "placement_tests_confirmed_by_user_id_fkey" FOREIGN KEY ("confirmed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_level_history" ADD CONSTRAINT "student_level_history_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_level_history" ADD CONSTRAINT "student_level_history_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
