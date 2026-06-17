-- CreateTable
CREATE TABLE "trip_history" (
    "id" SERIAL NOT NULL,
    "trip_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "action" VARCHAR(50) NOT NULL,
    "details" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trip_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "trip_history" ADD CONSTRAINT "trip_history_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_history" ADD CONSTRAINT "trip_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
