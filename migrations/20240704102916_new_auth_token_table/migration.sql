-- CreateTable
CREATE TABLE "AuthToken" (
    "uuid" TEXT NOT NULL,
    "deployment_uuid" UUID NOT NULL,
    "auth_token" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("uuid")
);
