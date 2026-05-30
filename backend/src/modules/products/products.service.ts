import { UploadApiResponse } from 'cloudinary';

import { cloudinary } from '../../config/cloudinary';
import { Category } from '../../database/models/category.model';
import { Product } from '../../database/models/product.model';
import { AppError } from '../../middleware/error.middleware';
import { validateObjectId, sanitizeSearchString } from '../../shared/utils/validation';

export class ProductsService {
  calculatePublicPrice(cost: number, ivaPercentage: number, profitPercentage: number): number {
    const costWithIva = cost * (1 + ivaPercentage / 100);
    return parseFloat((costWithIva * (1 + profitPercentage / 100)).toFixed(2));
  }

  calculateProfitPercentage(cost: number, ivaPercentage: number, publicPrice: number): number {
    const costWithIva = cost * (1 + ivaPercentage / 100);
    if (costWithIva <= 0) return 0;
    return parseFloat((((publicPrice - costWithIva) / costWithIva) * 100).toFixed(2));
  }

  async getAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    isActive?: boolean;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = { isDeleted: false };
    if (query.search) {
      const safeSearch = sanitizeSearchString(query.search);
      filter['$or'] = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { barcode: query.search },
        { internalCode: { $regex: safeSearch, $options: 'i' } },
      ];
    }
    if (query.categoryId) filter['categoryId'] = validateObjectId(query.categoryId, 'categoryId');
    if (query.isActive !== undefined) filter['isActive'] = query.isActive;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('categoryId', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ name: 1 })
        .lean(),
      Product.countDocuments(filter),
    ]);

    return {
      data: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getByBarcode(barcode: string) {
    const product = await Product.findOne({ barcode, isDeleted: false })
      .populate('categoryId', 'name')
      .lean();
    if (!product) throw new AppError('Product not found', 404);
    return product;
  }

  async getById(id: string) {
    validateObjectId(id);
    const product = await Product.findOne({ _id: id, isDeleted: false })
      .populate('categoryId', 'name')
      .lean();
    if (!product) throw new AppError('Product not found', 404);
    return product;
  }

  async create(
    data: {
      name: string;
      description?: string;
      categoryId: string;
      barcode?: string;
      internalCode?: string;
      cost: number;
      ivaPercentage: number;
      profitPercentage?: number;
      publicPrice?: number;
      minStock?: number;
    },
    userId: string,
    imageBuffer?: Buffer,
    imageMimetype?: string,
  ) {
    const category = await Category.findOne({ _id: validateObjectId(data.categoryId, 'categoryId'), isDeleted: false });
    if (!category) throw new AppError('Category not found', 404);

    // Calculate prices
    let { profitPercentage, publicPrice } = data;
    if (profitPercentage !== undefined && publicPrice === undefined) {
      publicPrice = this.calculatePublicPrice(data.cost, data.ivaPercentage, profitPercentage);
    } else if (publicPrice !== undefined && profitPercentage === undefined) {
      profitPercentage = this.calculateProfitPercentage(data.cost, data.ivaPercentage, publicPrice);
    } else if (profitPercentage === undefined && publicPrice === undefined) {
      profitPercentage = 0;
      publicPrice = this.calculatePublicPrice(data.cost, data.ivaPercentage, 0);
    }

    let image = undefined;
    if (imageBuffer) {
      image = await this.uploadImage(imageBuffer, imageMimetype);
    }

    const product = await Product.create({
      ...data,
      profitPercentage,
      publicPrice,
      image,
      createdBy: userId,
    });

    return Product.findById(product._id).populate('categoryId', 'name').lean();
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      categoryId: string;
      barcode: string;
      internalCode: string;
      cost: number;
      ivaPercentage: number;
      profitPercentage: number;
      publicPrice: number;
      minStock: number;
      isActive: boolean;
    }>,
    imageBuffer?: Buffer,
    imageMimetype?: string,
  ) {
    validateObjectId(id);
    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) throw new AppError('Product not found', 404);

    if (data.categoryId) {
      const category = await Category.findOne({ _id: validateObjectId(data.categoryId, 'categoryId'), isDeleted: false });
      if (!category) throw new AppError('Category not found', 404);
    }

    // Recalculate prices if cost/iva/margin changed
    const cost = data.cost ?? product.cost;
    const ivaPercentage = data.ivaPercentage ?? product.ivaPercentage;

    if (data.profitPercentage !== undefined && data.publicPrice === undefined) {
      data.publicPrice = this.calculatePublicPrice(cost, ivaPercentage, data.profitPercentage);
    } else if (data.publicPrice !== undefined && data.profitPercentage === undefined) {
      data.profitPercentage = this.calculateProfitPercentage(cost, ivaPercentage, data.publicPrice);
    } else if (data.cost !== undefined || data.ivaPercentage !== undefined) {
      data.publicPrice = this.calculatePublicPrice(cost, ivaPercentage, product.profitPercentage);
    }

    if (imageBuffer) {
      if (product.image?.publicId) {
        await this.deleteImage(product.image.publicId);
      }
      const image = await this.uploadImage(imageBuffer, imageMimetype);
      Object.assign(data, { image });
    }

    Object.assign(product, data);
    await product.save();

    return Product.findById(id).populate('categoryId', 'name').lean();
  }

  async deleteImage(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  async uploadImage(buffer: Buffer, mimetype?: string): Promise<{ url: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'facturacion/products',
          transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
        },
        (error, result) => {
          if (error || !result) reject(error ?? new Error('Upload failed'));
          else resolve({ url: result.secure_url, publicId: result.public_id });
        },
      );
      stream.end(buffer);
    });
  }

  async softDelete(id: string): Promise<void> {
    validateObjectId(id);
    const product = await Product.findOne({ _id: id, isDeleted: false });
    if (!product) throw new AppError('Product not found', 404);
    if (product.image?.publicId) {
      await this.deleteImage(product.image.publicId).catch(() => {});
    }
    product.isDeleted = true;
    product.isActive = false;
    await product.save();
  }
}

export const productsService = new ProductsService();
