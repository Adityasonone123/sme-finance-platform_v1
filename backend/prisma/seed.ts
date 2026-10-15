import process from 'process';
import { PrismaClient, Role, CompanyType, InvoiceStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with valid hashed user credentials...');

  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // 1. Create SME Supplier Company
  const smeCompany = await prisma.company.upsert({
    where: { id: 'sme-company-acme-001' },
    update: {},
    create: {
      id: 'sme-company-acme-001',
      name: 'Acme Enterprises India Ltd',
      type: CompanyType.SME,
      gstNumber: '27AAACA123411Z5',
      email: 'contact@acmeenterprises.com',
      phone: '+91 9876543210',
      address: 'Plot 42, MIDC Industrial Area, Andheri East, Mumbai, Maharashtra 400093',
    },
  });

  // 2. Create Corporate Buyer Companies
  const corporateCompany1 = await prisma.company.upsert({
    where: { id: 'corp-company-zenith-001' },
    update: {},
    create: {
      id: 'corp-company-zenith-001',
      name: 'Zenith Logistics & Supply Chain Pvt Ltd',
      type: CompanyType.CORPORATE,
      gstNumber: '27BBBZZ987622Z1',
      email: 'procurement@zenithlogistics.com',
      phone: '+91 22 4567 8900',
      address: 'Zenith Towers, Bandra-Kurla Complex, Mumbai, Maharashtra 400051',
    },
  });

  const corporateCompany2 = await prisma.company.upsert({
    where: { id: 'corp-company-apex-002' },
    update: {},
    create: {
      id: 'corp-company-apex-002',
      name: 'Apex Industrial Solutions Pvt Ltd',
      type: CompanyType.CORPORATE,
      gstNumber: '27CCCAP998811Z2',
      email: 'purchasing@apexindustrial.in',
      phone: '+91 22 8899 0011',
      address: 'Industrial Estate, Thane West, Mumbai, Maharashtra 400604',
    },
  });

  const corporateCompany3 = await prisma.company.upsert({
    where: { id: 'corp-company-orion-003' },
    update: {},
    create: {
      id: 'corp-company-orion-003',
      name: 'Orion Retail Group Ltd',
      type: CompanyType.CORPORATE,
      gstNumber: '27DDDOR554433Z3',
      email: 'vendor@orionretail.com',
      phone: '+91 22 3344 5566',
      address: 'Retail Park, Lower Parel, Mumbai, Maharashtra 400013',
    },
  });

  // 3. Create Financial Institution Company
  const financierCompany = await prisma.company.upsert({
    where: { id: 'fi-company-kredx-001' },
    update: {},
    create: {
      id: 'fi-company-kredx-001',
      name: 'KredX Working Capital Trust',
      type: CompanyType.FINANCIAL_INSTITUTION,
      gstNumber: '27EEEKR112233Z4',
      email: 'underwriting@kredx.com',
      phone: '+91 22 9988 7766',
      address: 'Financial Center, BKC, Mumbai, Maharashtra 400051',
    },
  });

  // 4. Establish Supplier-Buyer Links
  const buyerIds = [corporateCompany1.id, corporateCompany2.id, corporateCompany3.id];
  for (const bId of buyerIds) {
    await prisma.supplierBuyer.upsert({
      where: {
        supplierId_buyerId: {
          supplierId: smeCompany.id,
          buyerId: bId,
        },
      },
      update: {},
      create: {
        supplierId: smeCompany.id,
        buyerId: bId,
      },
    });
  }

  // 5. Create Seed Users for All Four Roles
  const supplierUser = await prisma.user.upsert({
    where: { email: 'rajesh@acmeenterprises.com' },
    update: { password: hashedPassword, role: Role.SUPPLIER },
    create: {
      name: 'Rajesh Sharma',
      email: 'rajesh@acmeenterprises.com',
      password: hashedPassword,
      role: Role.SUPPLIER,
      companyId: smeCompany.id,
    },
  });

  const buyerUser = await prisma.user.upsert({
    where: { email: 'procurement@zenithlogistics.com' },
    update: { password: hashedPassword, role: Role.BUYER },
    create: {
      name: 'Vikram Mehta',
      email: 'procurement@zenithlogistics.com',
      password: hashedPassword,
      role: Role.BUYER,
      companyId: corporateCompany1.id,
    },
  });

  const financierUser = await prisma.user.upsert({
    where: { email: 'lender@kredx.com' },
    update: { password: hashedPassword, role: Role.FINANCIAL_INSTITUTION },
    create: {
      name: 'Ananya Roy',
      email: 'lender@kredx.com',
      password: hashedPassword,
      role: Role.FINANCIAL_INSTITUTION,
      companyId: financierCompany.id,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@smefinance.com' },
    update: { password: hashedPassword, role: Role.ADMIN },
    create: {
      name: 'System Admin',
      email: 'admin@smefinance.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  // 6. Create Seed Invoices & Financing Requests
  const invoice1 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2026-001' },
    update: {},
    create: {
      invoiceNumber: 'INV-2026-001',
      supplierId: smeCompany.id,
      buyerId: corporateCompany1.id,
      amount: 450000.00,
      issueDate: new Date('2026-08-01T00:00:00Z'),
      dueDate: new Date('2026-08-31T00:00:00Z'),
      paymentTerms: 30,
      status: InvoiceStatus.APPROVED,
    },
  });

  const invoice2 = await prisma.invoice.upsert({
    where: { invoiceNumber: 'INV-2026-002' },
    update: {},
    create: {
      invoiceNumber: 'INV-2026-002',
      supplierId: smeCompany.id,
      buyerId: corporateCompany2.id,
      amount: 600000.00,
      issueDate: new Date('2026-08-10T00:00:00Z'),
      dueDate: new Date('2026-09-24T00:00:00Z'),
      paymentTerms: 45,
      status: InvoiceStatus.APPROVED,
    },
  });

  // Seed Financing Requests for Marketplace Opportunity Discovery
  const req1 = await prisma.financingRequest.upsert({
    where: { id: 'seed-req-001' },
    update: {},
    create: {
      id: 'seed-req-001',
      supplierId: smeCompany.id,
      invoiceId: invoice1.id,
      requestedAmount: 360000.00,
      interestRate: 12.5,
      tenureDays: 30,
      status: 'PENDING',
    },
  });

  const req2 = await prisma.financingRequest.upsert({
    where: { id: 'seed-req-002' },
    update: {},
    create: {
      id: 'seed-req-002',
      supplierId: smeCompany.id,
      invoiceId: invoice2.id,
      requestedAmount: 480000.00,
      interestRate: 12.0,
      tenureDays: 45,
      status: 'PENDING',
    },
  });

  console.log('Seed completed successfully for all 4 role portals:');
  console.log(`- Supplier Portal User: ${supplierUser.email} (Password: Password123!)`);
  console.log(`- Buyer Portal User: ${buyerUser.email} (Password: Password123!)`);
  console.log(`- Financier Portal User: ${financierUser.email} (Password: Password123!)`);
  console.log(`- Admin Console User: ${adminUser.email} (Password: Password123!)`);
  console.log(`- Seed Invoices: ${invoice1.invoiceNumber}, ${invoice2.invoiceNumber}`);
  console.log(`- Seed Financing Requests: ${req1.id}, ${req2.id}`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
