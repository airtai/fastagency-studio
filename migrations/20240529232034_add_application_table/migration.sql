-- CreateTable
CREATE TABLE "Application" (
    "uuid" TEXT NOT NULL,
    "user_uuid" UUID NOT NULL,
    "team_uuid" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("uuid")
);
