-- CreateTable
CREATE TABLE "SupplierBuyer" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierBuyer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupplierBuyer_supplierId_idx" ON "SupplierBuyer"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierBuyer_buyerId_idx" ON "SupplierBuyer"("buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierBuyer_supplierId_buyerId_key" ON "SupplierBuyer"("supplierId", "buyerId");

-- AddForeignKey
ALTER TABLE "SupplierBuyer" ADD CONSTRAINT "SupplierBuyer_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierBuyer" ADD CONSTRAINT "SupplierBuyer_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
