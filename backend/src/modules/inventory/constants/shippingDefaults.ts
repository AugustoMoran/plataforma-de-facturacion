import { IProduct, IProductDimensions } from '../models/Product';

/** Estimación EnvioPack: caja de guitarra eléctrica (cm / kg). */
export const DEFAULT_PRODUCT_SHIPPING = {
  weight: 4.5,
  dimensions: {
    length: 100,
    width: 40,
    height: 15,
    unit: 'cm',
  },
} as const;

export const applyProductShippingDefaults = (data: Partial<IProduct>): Partial<IProduct> => {
  const next: Partial<IProduct> = { ...data };

  if (next.weight == null || Number(next.weight) <= 0) {
    next.weight = DEFAULT_PRODUCT_SHIPPING.weight;
  }

  const dims = (next.dimensions || {}) as IProductDimensions;
  const hasDims =
    Number(dims.length) > 0 && Number(dims.width) > 0 && Number(dims.height) > 0;

  if (!hasDims) {
    next.dimensions = { ...DEFAULT_PRODUCT_SHIPPING.dimensions };
  }

  return next;
};
