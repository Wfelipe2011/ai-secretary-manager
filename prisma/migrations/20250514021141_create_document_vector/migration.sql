-- CreateTable
CREATE TABLE "DocumentVector" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "embedding" vector,

    CONSTRAINT "DocumentVector_pkey" PRIMARY KEY ("id")
);
