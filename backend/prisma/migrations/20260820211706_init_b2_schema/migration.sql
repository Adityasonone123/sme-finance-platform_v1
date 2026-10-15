-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPPLIER', 'BUYER', 'FINANCIAL_INSTITUTION', 'ADMIN');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('SME', 'CORPORATE', 'FINANCIAL_INSTITUTION');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PAID', 'OVERDUE', 'PARTIALLY_PAID');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('COMPLETED', 'PENDING', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'UPI', 'CHEQUE', 'CREDIT_CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "FinancingRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DISBURSED', 'REPAID');

-- CreateEnum
CREATE TYPE "FinancingOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('PAYMENT_DUE', 'PAYMENT_OVERDUE', 'CASH_FLOW_WARNING', 'FINANCING', 'SYSTEM');

-- CreateEnum
CREATE TYPE "CashFlowType" AS ENUM ('INCOME', 'EXPENSE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CompanyType" NOT NULL,
    "gstNumber" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentTerms" INTEGER NOT NULL DEFAULT 30,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "referenceNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancingRequest" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "requestedAmount" DECIMAL(15,2) NOT NULL,
    "interestRate" DECIMAL(5,2),
    "tenureDays" INTEGER,
    "status" "FinancingRequestStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAmount" DECIMAL(15,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancingOffer" (
    "id" TEXT NOT NULL,
    "financingRequestId" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "interestRate" DECIMAL(5,2) NOT NULL,
    "tenureDays" INTEGER NOT NULL,
    "processingFee" DECIMAL(15,2) NOT NULL,
    "totalRepayment" DECIMAL(15,2) NOT NULL,
    "status" "FinancingOfferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancingOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuyerPaymentHistory" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "expectedDays" INTEGER NOT NULL,
    "actualDays" INTEGER NOT NULL,
    "delayDays" INTEGER NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BuyerPaymentHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashFlowEntry" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "type" "CashFlowType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashFlowEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_companyId_idx" ON "User"("companyId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_supplierId_idx" ON "Invoice"("supplierId");

-- CreateIndex
CREATE INDEX "Invoice_buyerId_idx" ON "Invoice"("buyerId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_dueDate_idx" ON "Invoice"("dueDate");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_paymentDate_idx" ON "Payment"("paymentDate");

-- CreateIndex
CREATE INDEX "FinancingRequest_supplierId_idx" ON "FinancingRequest"("supplierId");

-- CreateIndex
CREATE INDEX "FinancingRequest_invoiceId_idx" ON "FinancingRequest"("invoiceId");

-- CreateIndex
CREATE INDEX "FinancingRequest_status_idx" ON "FinancingRequest"("status");

-- CreateIndex
CREATE INDEX "FinancingOffer_financingRequestId_idx" ON "FinancingOffer"("financingRequestId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "BuyerPaymentHistory_buyerId_idx" ON "BuyerPaymentHistory"("buyerId");

-- CreateIndex
CREATE INDEX "BuyerPaymentHistory_invoiceId_idx" ON "BuyerPaymentHistory"("invoiceId");

-- CreateIndex
CREATE INDEX "CashFlowEntry_supplierId_idx" ON "CashFlowEntry"("supplierId");

-- CreateIndex
CREATE INDEX "CashFlowEntry_date_idx" ON "CashFlowEntry"("date");

-- CreateIndex
CREATE INDEX "CashFlowEntry_type_idx" ON "CashFlowEntry"("type");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancingRequest" ADD CONSTRAINT "FinancingRequest_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancingRequest" ADD CONSTRAINT "FinancingRequest_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancingOffer" ADD CONSTRAINT "FinancingOffer_financingRequestId_fkey" FOREIGN KEY ("financingRequestId") REFERENCES "FinancingRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerPaymentHistory" ADD CONSTRAINT "BuyerPaymentHistory_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuyerPaymentHistory" ADD CONSTRAINT "BuyerPaymentHistory_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashFlowEntry" ADD CONSTRAINT "CashFlowEntry_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
