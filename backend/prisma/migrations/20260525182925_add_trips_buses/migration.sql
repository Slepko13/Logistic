-- CreateTable
CREATE TABLE "vehicles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "plate_number" VARCHAR(20),

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trips" (
    "id" SERIAL NOT NULL,
    "vehicle_id" INTEGER NOT NULL,
    "route" VARCHAR(128),
    "date" DATE,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_drivers" (
    "trip_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "trip_drivers_pkey" PRIMARY KEY ("trip_id","user_id")
);

-- CreateTable
CREATE TABLE "trip_seats" (
    "id" SERIAL NOT NULL,
    "trip_id" INTEGER NOT NULL,
    "seat_number" INTEGER NOT NULL,
    "first_name" VARCHAR(64),
    "last_name" VARCHAR(64),
    "phone" VARCHAR(20),
    "baggage_info" JSONB,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by_id" INTEGER,

    CONSTRAINT "trip_seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_parcels" (
    "id" SERIAL NOT NULL,
    "trip_id" INTEGER NOT NULL,
    "parcel_number" SERIAL NOT NULL,
    "first_name" VARCHAR(64) NOT NULL,
    "last_name" VARCHAR(64) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "delivery_address" VARCHAR(255) NOT NULL,
    "is_delivered" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "updated_by_id" INTEGER,

    CONSTRAINT "trip_parcels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trip_seats_trip_id_seat_number_key" ON "trip_seats"("trip_id", "seat_number");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_drivers" ADD CONSTRAINT "trip_drivers_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_drivers" ADD CONSTRAINT "trip_drivers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_seats" ADD CONSTRAINT "trip_seats_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_seats" ADD CONSTRAINT "trip_seats_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_parcels" ADD CONSTRAINT "trip_parcels_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_parcels" ADD CONSTRAINT "trip_parcels_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
