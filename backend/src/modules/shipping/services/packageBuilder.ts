import Product from '../../inventory/models/Product';

export interface PackageTotals {
  weight: number;
  paquetes: string;
  packages: Array<{ alto: number; ancho: number; largo: number; peso: number }>;
}

const DEFAULT_DIMS = { alto: 50, ancho: 40, largo: 20, peso: 4 };

const roundWeight = (value: number) => Math.round(value * 100) / 100;

export const buildPackagesFromItems = async (
  items: Array<{ productId: string; quantity: number }>
): Promise<PackageTotals> => {
  const packages: PackageTotals['packages'] = [];

  for (const item of items) {
    const product = await Product.findById(item.productId).select('weight dimensions name');
    const dims = product?.dimensions;
    const unitWeight = Number(product?.weight) > 0 ? Number(product?.weight) : DEFAULT_DIMS.peso;
    const alto = Number(dims?.height) > 0 ? Number(dims?.height) : DEFAULT_DIMS.alto;
    const ancho = Number(dims?.width) > 0 ? Number(dims?.width) : DEFAULT_DIMS.ancho;
    const largo = Number(dims?.length) > 0 ? Number(dims?.length) : DEFAULT_DIMS.largo;

    for (let i = 0; i < item.quantity; i += 1) {
      packages.push({
        alto: Math.round(alto),
        ancho: Math.round(ancho),
        largo: Math.round(largo),
        peso: roundWeight(unitWeight),
      });
    }
  }

  if (packages.length === 0) {
    packages.push({ ...DEFAULT_DIMS });
  }

  const weight = roundWeight(packages.reduce((sum, pkg) => sum + pkg.peso, 0));
  const paquetes = packages.map((pkg) => `${pkg.alto}x${pkg.ancho}x${pkg.largo}`).join(',');

  return { weight, paquetes, packages };
};
