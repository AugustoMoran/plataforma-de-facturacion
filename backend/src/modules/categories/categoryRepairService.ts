import Category from './models/Category';
import Product from '../inventory/models/Product';
import {
  canonicalCategoryKey,
  normalizeCategoryName,
  preferCategoryDisplayName,
} from './categoryNormalization';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const categoryRegex = (value: string) => new RegExp(`^${escapeRegex(String(value || '').trim())}$`, 'i');

export const repairCategoryStructure = async () => {
  const categories = await Category.find({ isActive: true }).lean();
  const roots = categories.filter((c) => !c.parent);
  const subs = categories.filter((c) => c.parent);

  let mergedDuplicates = 0;
  let reparentedRoots = 0;
  let productsRetagged = 0;

  const rootsByCanonical = new Map<string, typeof roots>();
  roots.forEach((root) => {
    const key = canonicalCategoryKey(root.name);
    const group = rootsByCanonical.get(key) || [];
    group.push(root);
    rootsByCanonical.set(key, group);
  });

  for (const [, group] of rootsByCanonical) {
    if (group.length < 2) continue;

    group.sort((a, b) => {
      const score = (name: string) => {
        let s = 0;
        if (name !== name.toLowerCase()) s += 2;
        if (!canonicalCategoryKey(name).includes('sesor')) s += 1;
        return s;
      };
      return score(b.name) - score(a.name);
    });

    const keeper = group[0];
    let displayName = keeper.name;

    for (let i = 1; i < group.length; i += 1) {
      const duplicate = group[i];
      displayName = preferCategoryDisplayName(displayName, duplicate.name);

      await Category.updateMany(
        { isActive: true, parent: duplicate._id },
        { parent: keeper._id }
      );

      const productUpdate = await Product.updateMany(
        { isActive: true, category: categoryRegex(duplicate.name) },
        { category: displayName }
      );
      productsRetagged += productUpdate.modifiedCount || 0;

      await Category.findByIdAndUpdate(duplicate._id, { isActive: false });
      mergedDuplicates += 1;
    }

    if (displayName !== keeper.name) {
      await Category.findByIdAndUpdate(keeper._id, { name: displayName });
      await Product.updateMany(
        { isActive: true, category: categoryRegex(keeper.name) },
        { category: displayName }
      );
    }
  }

  const refreshedRoots = await Category.find({ isActive: true, parent: null }).lean();
  refreshedRoots.sort((a, b) => a.name.length - b.name.length);

  for (const candidate of refreshedRoots) {
    const candidateNorm = normalizeCategoryName(candidate.name);
    if (candidateNorm.length < 4) continue;

    for (const parent of refreshedRoots) {
      if (String(parent._id) === String(candidate._id)) continue;
      const parentNorm = normalizeCategoryName(parent.name);
      if (canonicalCategoryKey(candidate.name) === canonicalCategoryKey(parent.name)) continue;
      if (!candidateNorm.startsWith(`${parentNorm} `)) continue;

      await Category.findByIdAndUpdate(candidate._id, { parent: parent._id });
      reparentedRoots += 1;
      break;
    }
  }

  for (const sub of subs) {
    const parent = categories.find((c) => String(c._id) === String(sub.parent));
    if (!parent || !parent.isActive) continue;

    const productUpdate = await Product.updateMany(
      {
        isActive: true,
        category: categoryRegex(parent.name),
        subcategory: categoryRegex(sub.name),
      },
      { category: parent.name, subcategory: sub.name }
    );
    productsRetagged += productUpdate.modifiedCount || 0;
  }

  return { mergedDuplicates, reparentedRoots, productsRetagged };
};
