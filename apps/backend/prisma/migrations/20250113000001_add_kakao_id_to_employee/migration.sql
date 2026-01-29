-- AlterTable
ALTER TABLE "employees" ADD COLUMN "kakaoId" TEXT;

-- CreateIndex
CREATE INDEX "employees_kakaoId_idx" ON "employees"("kakaoId");
