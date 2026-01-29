-- AlterTable
ALTER TABLE "employees" ADD COLUMN "ci" TEXT;

-- CreateIndex
CREATE INDEX "employees_ci_idx" ON "employees"("ci");
