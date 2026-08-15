import Category from '../../categories/models/Category';
import Product from '../../inventory/models/Product';
import {
  canonicalCategoryKey,
  CatalogRootCategory,
  getCategoryFilterVariants,
  nestMisplacedRootCategories,
  normalizeCategoryName,
  preferCategoryDisplayName,
} from '../../categories/categoryNormalization';

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

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const categoryRegex = (value: string) => new RegExp(`^${escapeRegex(String(value || '').trim())}$`, 'i');

const findRootCategoryByName = async (categoryName: string) => {
  const name = String(categoryName || '').trim();
  if (!name) return null;
  return Category.findOne({
    isActive: true,
    parent: null,
    name: categoryRegex(name),
  }).lean();
};

const isCategoryVisible = async (categoryName: string) => {
  const category = await findRootCategoryByName(categoryName);
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
    const variants = getCategoryFilterVariants(categoryName);
    if (variants.length === 1) {
      filters.category = categoryRegex(variants[0]);
    } else {
      filters.$and = filters.$and || [];
      filters.$and.push({
        $or: variants.map((name) => ({ category: categoryRegex(name) })),
      });
    }
  }

  if (query.subcategory) {
    filters.subcategory = categoryRegex(String(query.subcategory).trim());
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
  const buildFromProducts = async () => {
    const names = await Product.distinct('category', CATALOG_PUBLIC_FILTER);
    const deduped = new Map<string, string>();
    names.filter(Boolean).forEach((name) => {
      const key = canonicalCategoryKey(String(name));
      if (!deduped.has(key)) deduped.set(key, String(name).trim());
    });
    return Array.from(deduped.values())
      .sort((a, b) => a.localeCompare(b, 'es'))
      .map((name) => ({ _id: name, name, subcategories: [] }));
  };

  const allActive = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
  if (allActive.length === 0) {
    return buildFromProducts();
  }

  const isStoreVisible = (category: { visibleInEcommerce?: boolean }) =>
    category.visibleInEcommerce !== false;

  const categoryById = new Map(allActive.map((category) => [String(category._id), category]));
  const visibleCategories = allActive.filter(isStoreVisible);
  const visibleSubs = visibleCategories.filter((category) => category.parent);

  const rootIds = new Set<string>();
  visibleCategories
    .filter((category) => !category.parent)
    .forEach((category) => rootIds.add(String(category._id)));
  visibleSubs.forEach((sub) => {
    if (sub.parent) rootIds.add(String(sub.parent));
  });

  const rootsRaw = allActive.filter((category) => !category.parent && rootIds.has(String(category._id)));
  const subsRaw = allActive.filter((category) => category.parent && isStoreVisible(category));

  if (rootsRaw.length === 0 && subsRaw.length === 0) {
    return buildFromProducts();
  }

  const productSubRows = await Product.aggregate([
    { $match: { ...CATALOG_PUBLIC_FILTER, subcategory: { $exists: true, $nin: [null, ''] } } },
    {
      $group: {
        _id: {
          category: '$category',
          subcategory: '$subcategory',
        },
      },
    },
  ]);

  const rootMap = new Map<string, CatalogRootCategory>();

  const ensureRoot = (name: string, id?: string) => {
    const trimmed = String(name || '').trim();
    if (!trimmed) return null;
    const key = canonicalCategoryKey(trimmed);
    const existing = rootMap.get(key);
    if (!existing) {
      rootMap.set(key, {
        _id: id ? String(id) : trimmed,
        name: trimmed,
        subcategories: new Map(),
      });
      return rootMap.get(key)!;
    }
    existing.name = preferCategoryDisplayName(existing.name, trimmed);
    if (id) existing._id = String(id);
    return existing;
  };

  rootsRaw.forEach((root) => {
    const key = canonicalCategoryKey(root.name);
    const existing = rootMap.get(key);
    if (!existing) {
      rootMap.set(key, {
        _id: String(root._id),
        name: root.name,
        subcategories: new Map(),
      });
      return;
    }
    existing.name = preferCategoryDisplayName(existing.name, root.name);
    existing._id = String(root._id);
  });

  subsRaw.forEach((sub) => {
    const parent = categoryById.get(String(sub.parent));
    if (!parent) return;
    const root = ensureRoot(parent.name, String(parent._id));
    if (!root) return;
    const subKey = normalizeCategoryName(sub.name);
    root.subcategories.set(subKey, { _id: String(sub._id), name: sub.name });
  });

  productSubRows.forEach((row: any) => {
    const categoryName = String(row?._id?.category || '').trim();
    const subName = String(row?._id?.subcategory || '').trim();
    if (!categoryName || !subName) return;

    const root = rootMap.get(canonicalCategoryKey(categoryName));
    if (!root) return;
    const subKey = normalizeCategoryName(subName);
    if (!root.subcategories.has(subKey)) {
      root.subcategories.set(subKey, { _id: subKey, name: subName });
    }
  });

  nestMisplacedRootCategories(rootMap);

  if (rootMap.size === 0) {
    return buildFromProducts();
  }

  const serialized = Array.from(rootMap.values())
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    .map((root) => ({
      _id: root._id,
      name: root.name,
      subcategories: Array.from(root.subcategories.values()).sort((a, b) =>
        a.name.localeCompare(b.name, 'es')
      ),
    }));

  if (serialized.length === 0) {
    return buildFromProducts();
  }

  return serialized;
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
