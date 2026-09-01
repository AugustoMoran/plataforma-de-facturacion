import Branch from '../../branches/models/Branch';
import type { ShippingOption } from './envioPackService';

export const STORE_PICKUP_PREFIX = 'store-';

export const isStorePickupOptionId = (optionId: string) => optionId.startsWith(STORE_PICKUP_PREFIX);

export const storePickupOptionId = (branchId: string) => `${STORE_PICKUP_PREFIX}${branchId}`;

const branchToOption = (branch: {
  _id: unknown;
  name: string;
  address: string;
  city?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
}): ShippingOption => {
  const branchId = String(branch._id);
  const location = [branch.address, branch.city, branch.province].filter(Boolean).join(' · ');

  return {
    id: storePickupOptionId(branchId),
    modalidad: 'S',
    label: `Retiro en sucursal · ${branch.name}`,
    description: location,
    carrierId: 'store',
    carrierName: 'OsoSound',
    service: 'PICKUP',
    despacho: 'S',
    customerCost: 0,
    sellerCost: 0,
    isFree: true,
    pickupBranch: {
      id: branchId,
      name: branch.name,
      address: branch.address,
      city: branch.city,
      province: branch.province,
      postalCode: branch.postalCode,
      phone: branch.phone,
    },
  };
};

export const getStorePickupOptions = async (): Promise<ShippingOption[]> => {
  const branches = await Branch.find({ isActive: true }).sort({ isMain: -1, name: 1 }).lean();
  return branches.map((branch) => branchToOption(branch));
};

export const resolveStorePickupOption = async (optionId: string): Promise<ShippingOption | null> => {
  if (!isStorePickupOptionId(optionId)) return null;

  const branchId = optionId.slice(STORE_PICKUP_PREFIX.length);
  const branch = await Branch.findOne({ _id: branchId, isActive: true }).lean();
  if (!branch) return null;

  return branchToOption(branch);
};
