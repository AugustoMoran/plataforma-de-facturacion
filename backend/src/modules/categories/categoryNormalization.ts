/** Typos / alias conocidos → clave canónica (minúsculas, sin acentos extra). */
export const CATEGORY_CANONICAL_ALIASES: Record<string, string> = {
  acsesorios: 'accesorios',
};

export const normalizeCategoryName = (value: string) => String(value || '').trim().toLowerCase();

export const canonicalCategoryKey = (value: string) => {
  const normalized = normalizeCategoryName(value);
  return CATEGORY_CANONICAL_ALIASES[normalized] || normalized;
};

export const preferCategoryDisplayName = (current: string, candidate: string) => {
  const currentNorm = normalizeCategoryName(current);
  const candidateNorm = normalizeCategoryName(candidate);

  const currentIsTypo = Boolean(CATEGORY_CANONICAL_ALIASES[currentNorm]);
  const candidateIsTypo = Boolean(CATEGORY_CANONICAL_ALIASES[candidateNorm]);
  if (currentIsTypo && !candidateIsTypo) return candidate;
  if (candidateIsTypo && !currentIsTypo) return current;

  if (candidate !== candidate.toLowerCase() && current === current.toLowerCase()) return candidate;
  if (current !== current.toLowerCase() && candidate === candidate.toLowerCase()) return current;

  return candidate.length > current.length ? candidate : current;
};

export const getCategoryFilterVariants = (categoryName: string) => {
  const trimmed = String(categoryName || '').trim();
  const canonical = canonicalCategoryKey(trimmed);
  const variants = new Set<string>([trimmed]);

  Object.entries(CATEGORY_CANONICAL_ALIASES).forEach(([typo, canon]) => {
    if (canon === canonical) variants.add(typo);
  });

  if (canonical !== normalizeCategoryName(trimmed)) {
    variants.add(canonical);
  }

  return Array.from(variants).filter(Boolean);
};

export type CatalogSubcategory = { _id: string; name: string };

export type CatalogRootCategory = {
  _id: string;
  name: string;
  subcategories: Map<string, CatalogSubcategory>;
};

export const nestMisplacedRootCategories = (rootMap: Map<string, CatalogRootCategory>) => {
  const roots = Array.from(rootMap.values());
  const removeKeys = new Set<string>();

  roots.sort((a, b) => a.name.length - b.name.length);

  for (const child of roots) {
    if (removeKeys.has(canonicalCategoryKey(child.name))) continue;

    for (const parent of roots) {
      if (child === parent) continue;
      if (removeKeys.has(canonicalCategoryKey(parent.name))) continue;

      const parentNorm = normalizeCategoryName(parent.name);
      const childNorm = normalizeCategoryName(child.name);

      if (parentNorm.length < 4) continue;
      if (canonicalCategoryKey(child.name) === canonicalCategoryKey(parent.name)) continue;
      if (!childNorm.startsWith(`${parentNorm} `)) continue;

      const subKey = normalizeCategoryName(child.name);
      parent.subcategories.set(subKey, { _id: child._id, name: child.name });
      removeKeys.add(canonicalCategoryKey(child.name));
      break;
    }
  }

  removeKeys.forEach((key) => {
    for (const [mapKey, root] of rootMap.entries()) {
      if (canonicalCategoryKey(root.name) === key) {
        rootMap.delete(mapKey);
      }
    }
  });
};
