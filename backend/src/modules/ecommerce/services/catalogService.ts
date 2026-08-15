import Category from '../../categories/models/Category';
import Product from '../../inventory/models/Product';

export const CATALOG_PUBLIC_FILTER = {
  isActive: true,
  paused: { $ne: true },
};

const CATALOG_SELECT = [
  'name', 'slug', 'sku', 'description', 'commercialDescription', 'longDescription',
  'price', 'salePrice', 'iva', 'category', 'subcategory', 'imageUrl', 'gallery', 'featured', 'weight',
  'dimensions', 'seoTitle', 'seoDescription', 'displayOrder', 'stock',
].join(' ');

export const getEffectiveProductPrice = (product: { price?: number; salePrice?: number | null }) => {
  const price = Number(product.price || 0);
  const salePrice = product.salePrice != null ? Number(product.salePrice) : undefined;
  if (salePrice != null && salePrice > 0 && salePrice < price) return salePrice;
  return price;
};

const mapCatalogProduct = (product: any) => {
  const doc = product?.toObject ? product.toObject() : { ...product };
  const price = Number(doc.price || 0);
  const salePrice = doc.salePrice != null ? Number(doc.salePrice) : undefined;
  const onSale = salePrice != null && salePrice > 0 && salePrice < price;

  return {
    ...doc,
    onSale,
    effectivePrice: getEffectiveProductPrice(doc),
    salePrice: onSale ? salePrice : undefined,
  };
};

const getHiddenCategoryNames = async () => {
  const hidden = await Category.find({ isActive: true, visibleInEcommerce: false }).select('name').lean();
  return hidden.map((c) => c.name).filter(Boolean);
};

const isCategoryVisible = async (categoryName: string) => {
  const name = String(categoryName || '').trim();
  if (!name) return true;

  const category = await Category.findOne({ isActive: true, name, parent: null }).lean();
  if (!category) return true;
  return category.visibleInEcommerce !== false;
};

export const getCatalogProducts = async (query: any = {}) => {
  const filters: any = { ...CATALOG_PUBLIC_FILTER };

  const hiddenNames = await getHiddenCategoryNames();
  if (hiddenNames.length > 0) {
    filters.category = { $nin: hiddenNames };
  }

  if (query.category) {
    const categoryName = String(query.category).trim();
    const visible = await isCategoryVisible(categoryName);
    if (!visible) {
      return { items: [], pagination: { page: 1, limit: 24, total: 0, pages: 1 } };
    }
    filters.category = categoryName;
  }

  if (query.subcategory) {
    filters.subcategory = String(query.subcategory).trim();
  }

  if (query.featured === 'true') {
    filters.featured = true;
  }

  if (query.offers === 'true') {
    filters.salePrice = { $exists: true, $gt: 0 };
    filters.$expr = { $lt: ['$salePrice', '$price'] };
  }

  if (query.search) {
    const search = String(query.search).trim();
    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filters.$and = filters.$and || [];
      filters.$and.push({
        $or: [
          { name: regex },
          { commercialDescription: regex },
          { slug: regex },
        ],
      });
    }
  }

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 24));
  const skip = (page - 1) * limit;

  const buildSort = (): Record<string, 1 | -1> => {
    switch (String(query.sort || '')) {
      case 'price_asc':
        return { effectivePrice: 1, name: 1 };
      case 'price_desc':
        return { effectivePrice: -1, name: 1 };
      case 'name_asc':
        return { name: 1 };
      case 'name_desc':
        return { name: -1 };
      case 'newest':
        return { createdAt: -1 };
      default:
        return { displayOrder: 1, name: 1 };
    }
  };

  const effectivePriceStage = {
    $addFields: {
      effectivePrice: {
        $cond: {
          if: {
            $and: [
              { $gt: [{ $ifNull: ['$salePrice', 0] }, 0] },
              { $lt: ['$salePrice', '$price'] },
            ],
          },
          then: '$salePrice',
          else: '$price',
        },
      },
    },
  };

  const [items, total] = await Promise.all([
    Product.aggregate([
      { $match: filters },
      effectivePriceStage,
      { $sort: buildSort() },
      { $skip: skip },
      { $limit: limit },
    ]),
    Product.countDocuments(filters),
  ]);

  return {
    items: items.map(mapCatalogProduct),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getCatalogProductBySlug = async (slug: string) => {
  const product = await Product.findOne({ ...CATALOG_PUBLIC_FILTER, slug: String(slug).trim().toLowerCase() })
    .select(CATALOG_SELECT);
  if (!product) return null;

  const visible = await isCategoryVisible(product.category);
  if (!visible) return null;

  return mapCatalogProduct(product);
};

export const getCatalogProductByIdOrSlug = async (idOrSlug: string) => {
  const value = String(idOrSlug || '').trim();
  if (!value) return null;

  if (/^[a-f\d]{24}$/i.test(value)) {
    const byId = await Product.findOne({ ...CATALOG_PUBLIC_FILTER, _id: value }).select(CATALOG_SELECT);
    if (byId) {
      const visible = await isCategoryVisible(byId.category);
      return visible ? mapCatalogProduct(byId) : null;
    }
  }

  return getCatalogProductBySlug(value);
};

export const getCatalogCategories = async () => {
  const parents = await Category.find({
    isActive: true,
    visibleInEcommerce: true,
    $or: [{ parent: null }, { parent: { $exists: false } }],
  })
    .sort({ name: 1 })
    .lean();

  if (parents.length === 0) {
    const names = await Product.distinct('category', CATALOG_PUBLIC_FILTER);
    return names.filter(Boolean).sort().map((name) => ({ _id: name, name, subcategories: [] }));
  }

  const parentIds = parents.map((p) => p._id);
  const subs = await Category.find({
    isActive: true,
    visibleInEcommerce: true,
    parent: { $in: parentIds },
  })
    .sort({ name: 1 })
    .lean();

  return parents.map((parent) => ({
    _id: String(parent._id),
    name: parent.name,
    subcategories: subs
      .filter((s) => String(s.parent) === String(parent._id))
      .map((s) => ({ _id: String(s._id), name: s.name })),
  }));
};

export const getFeaturedProducts = async (limit = 8) => {
  const hiddenNames = await getHiddenCategoryNames();
  const filters: any = { ...CATALOG_PUBLIC_FILTER, featured: true };
  if (hiddenNames.length > 0) {
    filters.category = { $nin: hiddenNames };
  }

  const items = await Product.find(filters)
    .select(CATALOG_SELECT)
    .sort({ displayOrder: 1, name: 1 })
    .limit(limit);

  return items.map(mapCatalogProduct);
};
