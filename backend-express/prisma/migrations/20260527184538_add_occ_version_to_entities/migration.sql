-- AlterTable
ALTER TABLE "trip_parcels" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "trip_seats" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "trips" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;
