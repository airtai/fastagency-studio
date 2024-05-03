-- CreateTable
CREATE TABLE "UserModel" (
    "id" TEXT NOT NULL,
    "userId" INTEGER,
    "type_name" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "model_uuid" TEXT NOT NULL,
    "json_string" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserModel_userId_key" ON "UserModel"("userId");

-- AddForeignKey
ALTER TABLE "UserModel" ADD CONSTRAINT "UserModel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
