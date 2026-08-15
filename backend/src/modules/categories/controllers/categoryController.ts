import { Request, Response } from 'express';
import Category from '../models/Category';

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getCategories = async (req: Request, res: Response) => {
  try {
    const includeInternal = req.query.includeInternal === 'true';
    const filter: any = { isActive: true };
    if (!includeInternal) {
      filter.visibleInEcommerce = true;
    }

    const categories = await Category.find(filter).sort({ name: 1 }).lean();
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const name = (req.body?.name || '').trim();
    if (!name) return res.status(400).json({ message: 'El nombre de categoría es obligatorio' });

    const parent = req.body?.parent || null;
    const visibleInEcommerce = req.body?.visibleInEcommerce !== false;

    if (parent) {
      const parentCategory = await Category.findOne({ _id: parent, isActive: true });
      if (!parentCategory) {
        return res.status(400).json({ message: 'La categoría padre no existe' });
      }
    }

    const exists = await Category.findOne({
      isActive: true,
      parent: parent || null,
      name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' },
    });
    if (exists) {
      return res.status(409).json({ message: 'La categoría ya existe' });
    }

    const category = new Category({ name, parent: parent || null, visibleInEcommerce });
    await category.save();
    res.status(201).json(category);
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'La categoría ya existe' });
    }
    res.status(400).json({ message: error.message });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const name = (req.body?.name || '').trim();
    if (!name) return res.status(400).json({ message: 'El nombre de categoría es obligatorio' });

    const parent = req.body?.parent ?? undefined;
    const visibleInEcommerce =
      req.body?.visibleInEcommerce === undefined ? undefined : Boolean(req.body.visibleInEcommerce);

    if (parent) {
      if (String(parent) === String(id)) {
        return res.status(400).json({ message: 'Una categoría no puede ser padre de sí misma' });
      }
      const parentCategory = await Category.findOne({ _id: parent, isActive: true });
      if (!parentCategory) {
        return res.status(400).json({ message: 'La categoría padre no existe' });
      }
    }

    const exists = await Category.findOne({
      _id: { $ne: id },
      isActive: true,
      parent: parent === undefined ? undefined : parent || null,
      name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' },
    });
    if (exists) {
      return res.status(409).json({ message: 'La categoría ya existe' });
    }

    const update: any = { name };
    if (parent !== undefined) update.parent = parent || null;
    if (visibleInEcommerce !== undefined) update.visibleInEcommerce = visibleInEcommerce;

    const category = await Category.findByIdAndUpdate(id, update, { new: true });
    if (!category) return res.status(404).json({ message: 'Categoría no encontrada' });
    res.json(category);
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'La categoría ya existe' });
    }
    res.status(400).json({ message: error.message });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await Category.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!category) return res.status(404).json({ message: 'Categoría no encontrada' });

    await Category.updateMany({ parent: id, isActive: true }, { isActive: false });
    res.json({ message: 'Categoría desactivada' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
