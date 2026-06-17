-- DropForeignKey
ALTER TABLE "trip_history" DROP CONSTRAINT "trip_history_trip_id_fkey";

-- AddForeignKey
ALTER TABLE "trip_history" ADD CONSTRAINT "trip_history_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
