import { CompanyType, Company, RelationshipStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { BuyerDTO, validateBuyerDTO } from '../validators/buyer.validator.js';
import { CompanyServiceError } from './company.service.js';

export const searchRegisteredBuyers = async (
  supplierCompanyId: string | null | undefined,
  query: string
): Promise<any[]> => {
  if (!supplierCompanyId || !query || query.trim().length === 0) {
    return [];
  }

  const q = query.trim();

  // Find corporate companies matching name, GSTIN, or email
  const companies = await prisma.company.findMany({
    where: {
      type: CompanyType.CORPORATE,
      id: { not: supplierCompanyId },
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { gstNumber: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ],
    },
    take: 10,
  });

  // Fetch existing relationship statuses with supplierCompanyId
  const relationships = await prisma.supplierBuyer.findMany({
    where: {
      supplierId: supplierCompanyId,
      buyerId: { in: companies.map((c) => c.id) },
    },
  });

  const relMap = new Map<string, RelationshipStatus>();
  relationships.forEach((r) => relMap.set(r.buyerId, r.status));

  return companies.map((c) => ({
    id: c.id,
    name: c.name,
    gstNumber: c.gstNumber,
    email: c.email,
    phone: c.phone,
    relationshipStatus: relMap.get(c.id) || 'NONE',
  }));
};

export const sendConnectionRequest = async (
  supplierCompanyId: string | null | undefined,
  buyerCompanyId: string
): Promise<any> => {
  if (!supplierCompanyId) {
    throw new CompanyServiceError('Supplier company profile required', 400);
  }

  const supplierCompany = await prisma.company.findUnique({ where: { id: supplierCompanyId } });
  if (!supplierCompany) {
    throw new CompanyServiceError('Supplier company profile not found', 404);
  }

  const buyerCompany = await prisma.company.findUnique({ where: { id: buyerCompanyId } });
  if (!buyerCompany) {
    throw new CompanyServiceError('Corporate buyer company not found', 404);
  }

  const existing = await prisma.supplierBuyer.findUnique({
    where: {
      supplierId_buyerId: {
        supplierId: supplierCompanyId,
        buyerId: buyerCompanyId,
      },
    },
  });

  if (existing) {
    if (existing.status === RelationshipStatus.ACTIVE) {
      throw new CompanyServiceError('You already have an ACTIVE connection with this corporate buyer', 400);
    }
    if (existing.status === RelationshipStatus.PENDING) {
      throw new CompanyServiceError('Connection request is already PENDING buyer approval', 400);
    }
  }

  const relationship = await prisma.supplierBuyer.upsert({
    where: {
      supplierId_buyerId: {
        supplierId: supplierCompanyId,
        buyerId: buyerCompanyId,
      },
    },
    update: {
      status: RelationshipStatus.PENDING,
    },
    create: {
      supplierId: supplierCompanyId,
      buyerId: buyerCompanyId,
      status: RelationshipStatus.PENDING,
    },
    include: {
      buyer: true,
    },
  });

  // Send notification to buyer user(s)
  const buyerUsers = await prisma.user.findMany({
    where: { companyId: buyerCompanyId, role: 'BUYER' },
  });

  for (const bUser of buyerUsers) {
    await prisma.notification.create({
      data: {
        userId: bUser.id,
        title: 'Supplier Connection Request',
        message: `${supplierCompany.name} sent your company a connection request.`,
        type: 'SYSTEM',
      },
    });
  }

  return relationship;
};

export const inviteUnregisteredBuyer = async (
  supplierCompanyId: string | null | undefined,
  companyName: string,
  contactEmail: string,
  contactName?: string
): Promise<any> => {
  if (!supplierCompanyId) {
    throw new CompanyServiceError('Supplier company profile required', 400);
  }

  if (!companyName || !contactEmail) {
    throw new CompanyServiceError('Company name and contact email are required to send an invitation', 400);
  }

  const invitation = await prisma.buyerInvitation.create({
    data: {
      supplierCompanyId,
      companyName,
      contactEmail,
      contactName: contactName || null,
      status: 'PENDING',
    },
  });

  return invitation;
};

export const getSupplierBuyersDetailed = async (
  supplierCompanyId: string | null | undefined
): Promise<any> => {
  if (!supplierCompanyId) {
    return { activeBuyers: [], pendingRequests: [], rejectedRequests: [], invitations: [] };
  }

  const relationships = await prisma.supplierBuyer.findMany({
    where: { supplierId: supplierCompanyId },
    include: { buyer: true },
    orderBy: { createdAt: 'desc' },
  });

  const invitations = await prisma.buyerInvitation.findMany({
    where: { supplierCompanyId },
    orderBy: { createdAt: 'desc' },
  });

  const activeBuyers: any[] = [];
  const pendingRequests: any[] = [];
  const rejectedRequests: any[] = [];

  for (const rel of relationships) {
    const item = {
      id: rel.id,
      buyerId: rel.buyerId,
      name: rel.buyer.name,
      gstNumber: rel.buyer.gstNumber,
      email: rel.buyer.email,
      phone: rel.buyer.phone,
      status: rel.status,
      connectedAt: rel.createdAt,
    };

    if (rel.status === RelationshipStatus.ACTIVE) {
      activeBuyers.push(item);
    } else if (rel.status === RelationshipStatus.PENDING) {
      pendingRequests.push(item);
    } else if (rel.status === RelationshipStatus.REJECTED) {
      rejectedRequests.push(item);
    }
  }

  return {
    activeBuyers,
    pendingRequests,
    rejectedRequests,
    invitations,
  };
};

export const getSupplierBuyers = async (supplierCompanyId: string | null | undefined): Promise<Company[]> => {
  if (!supplierCompanyId) {
    return [];
  }

  const relationships = await prisma.supplierBuyer.findMany({
    where: {
      supplierId: supplierCompanyId,
      status: RelationshipStatus.ACTIVE,
    },
    include: {
      buyer: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return relationships.map((rel) => rel.buyer);
};

export const getSupplierBuyerById = async (
  supplierCompanyId: string | null | undefined,
  buyerId: string
): Promise<Company> => {
  if (!supplierCompanyId) {
    throw new CompanyServiceError('Supplier company profile required', 400);
  }

  const relationship = await prisma.supplierBuyer.findUnique({
    where: {
      supplierId_buyerId: {
        supplierId: supplierCompanyId,
        buyerId: buyerId,
      },
    },
    include: {
      buyer: true,
    },
  });

  if (!relationship || !relationship.buyer) {
    throw new CompanyServiceError('Corporate buyer not found or not associated with your account', 404);
  }

  return relationship.buyer;
};

export const updateCorporateBuyer = async (
  supplierCompanyId: string | null | undefined,
  buyerId: string,
  data: Partial<BuyerDTO>
): Promise<Company> => {
  const existingBuyer = await getSupplierBuyerById(supplierCompanyId, buyerId);

  const validatedData = validateBuyerDTO({
    name: data.name ?? existingBuyer.name,
    gstNumber: data.gstNumber ?? (existingBuyer.gstNumber || undefined),
    email: data.email ?? (existingBuyer.email || undefined),
    phone: data.phone ?? (existingBuyer.phone || undefined),
    address: data.address ?? (existingBuyer.address || undefined),
  });

  const updatedBuyer = await prisma.company.update({
    where: { id: buyerId },
    data: {
      name: validatedData.name,
      gstNumber: validatedData.gstNumber,
      email: validatedData.email,
      phone: validatedData.phone,
      address: validatedData.address,
      type: CompanyType.CORPORATE,
    },
  });

  return updatedBuyer;
};

export const getBuyerSupplierRequests = async (
  buyerCompanyId: string | null | undefined
): Promise<any[]> => {
  if (!buyerCompanyId) {
    return [];
  }

  const requests = await prisma.supplierBuyer.findMany({
    where: {
      buyerId: buyerCompanyId,
      status: RelationshipStatus.PENDING,
    },
    include: {
      supplier: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return requests.map((r) => ({
    id: r.id,
    supplierId: r.supplierId,
    supplierName: r.supplier.name,
    supplierEmail: r.supplier.email,
    supplierPhone: r.supplier.phone,
    requestDate: r.createdAt,
    status: r.status,
  }));
};

export const respondToSupplierRequest = async (
  buyerCompanyId: string | null | undefined,
  requestId: string,
  action: 'ACCEPT' | 'REJECT'
): Promise<any> => {
  if (!buyerCompanyId) {
    throw new CompanyServiceError('Buyer company profile required', 400);
  }

  const relationship = await prisma.supplierBuyer.findUnique({
    where: { id: requestId },
    include: { supplier: true, buyer: true },
  });

  if (!relationship || relationship.buyerId !== buyerCompanyId) {
    throw new CompanyServiceError('Connection request not found or access denied', 404);
  }

  const newStatus = action === 'ACCEPT' ? RelationshipStatus.ACTIVE : RelationshipStatus.REJECTED;

  const updated = await prisma.supplierBuyer.update({
    where: { id: requestId },
    data: { status: newStatus },
    include: { supplier: true, buyer: true },
  });

  // Notify supplier users
  const supplierUsers = await prisma.user.findMany({
    where: { companyId: relationship.supplierId, role: 'SUPPLIER' },
  });

  const messageText = action === 'ACCEPT'
    ? `${relationship.buyer.name} accepted your connection request!`
    : `${relationship.buyer.name} declined your connection request.`;

  for (const sUser of supplierUsers) {
    await prisma.notification.create({
      data: {
        userId: sUser.id,
        title: action === 'ACCEPT' ? 'Connection Request Accepted' : 'Connection Request Rejected',
        message: messageText,
        type: 'SYSTEM',
      },
    });
  }

  return updated;
};

export const getConnectedSuppliersForBuyer = async (
  buyerCompanyId: string | null | undefined
): Promise<any[]> => {
  if (!buyerCompanyId) {
    return [];
  }

  const relationships = await prisma.supplierBuyer.findMany({
    where: {
      buyerId: buyerCompanyId,
      status: RelationshipStatus.ACTIVE,
    },
    include: {
      supplier: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return relationships.map((r) => ({
    id: r.id,
    supplierId: r.supplierId,
    supplierName: r.supplier.name,
    supplierGst: r.supplier.gstNumber,
    supplierEmail: r.supplier.email,
    supplierPhone: r.supplier.phone,
    connectedSince: r.createdAt,
    status: r.status,
  }));
};
