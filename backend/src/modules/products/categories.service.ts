import { Category } from '../../database/models/category.model';
import { AppError } from '../../middleware/error.middleware';
import { validateObjectId, sanitizeSearchString } from '../../shared/utils/validation';

export class CategoriesService {
  async getAll(query: { page?: number; limit?: number; search?: string }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = { isDeleted: false };
    if (query.search) filter['name'] = { $regex: sanitizeSearchString(query.search), $options: 'i' };
    const [categories, total] = await Promise.all([
      Category.find(filter).skip(skip).limit(limit).sort({ name: 1 }).lean(),
      Category.countDocuments(filter),
    ]);
    return {
      data: categories,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    };
  }

  async create(data: { name: string; description?: string }) {
    const existing = await Category.findOne({ name: data.name, isDeleted: false });
    if (existing) throw new AppError('Category name already exists', 409);
    return Category.create(data);
  }

  async update(id: string, data: Partial<{ name: string; description: string; isActive: boolean }>) {
    validateObjectId(id);
    const category = await Category.findOne({ _id: id, isDeleted: false });
    if (!category) throw new AppError('Category not found', 404);
    Object.assign(category, data);
    return category.save();
  }

  async delete(id: string): Promise<void> {
    validateObjectId(id);
    const category = await Category.findOne({ _id: id, isDeleted: false });
    if (!category) throw new AppError('Category not found', 404);
    category.isDeleted = true;
    await category.save();
  }
}

export const categoriesService = new CategoriesService();
