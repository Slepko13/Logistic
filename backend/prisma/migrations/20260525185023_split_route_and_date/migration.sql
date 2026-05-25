/*
  Warnings:

  - You are about to drop the column `date` on the `trips` table. All the data in the column will be lost.
  - You are about to drop the column `route` on the `trips` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `trips` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.

*/
-- AlterTable
ALTER TABLE "trips" DROP COLUMN "date",
DROP COLUMN "route",
ADD COLUMN     "arrival_city" VARCHAR(64),
ADD COLUMN     "arrival_date" TIMESTAMP(3),
ADD COLUMN     "departure_city" VARCHAR(64),
ADD COLUMN     "departure_date" TIMESTAMP(3),
ALTER COLUMN "status" SET DATA TYPE VARCHAR(20);
