-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "first_name" VARCHAR(64) NOT NULL,
    "last_name" VARCHAR(64) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(16) NOT NULL DEFAULT 'driver',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");
