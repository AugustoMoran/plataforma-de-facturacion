import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import { Branch } from '../src/database/models/branch.model';
import { Category } from '../src/database/models/category.model';
import { Role } from '../src/database/models/role.model';
import { User } from '../src/database/models/user.model';

const ADMIN_PERMISSIONS = {
  viewProducts: true, createProducts: true, editProducts: true, deleteProducts: true,
  viewStock: true, adjustStock: true, transferStock: true,
  viewSales: true, createSales: true, cancelSales: true, refundSales: true,
  viewUsers: true, createUsers: true, editUsers: true, deleteUsers: true,
  viewBranches: true, manageBranches: true,
  viewReports: true, exportReports: true,
  manageAfip: true,
  manageRoles: true, managePermissions: true,
  manageCategories: true,
};

const VENDEDOR_PERMISSIONS = {
  viewProducts: true, createProducts: false, editProducts: false, deleteProducts: false,
  viewStock: true, adjustStock: false, transferStock: false,
  viewSales: true, createSales: true, cancelSales: false, refundSales: false,
  viewUsers: false, createUsers: false, editUsers: false, deleteUsers: false,
  viewBranches: true, manageBranches: false,
  viewReports: false, exportReports: false,
  manageAfip: false,
  manageRoles: false, managePermissions: false,
  manageCategories: false,
};

async function seed(): Promise<void> {
  console.log('🌱 Starting database seed...');

  await mongoose.connect(process.env['MONGODB_URI']!);
  console.log('✅ Connected to MongoDB');

  // Roles
  const adminRole = await Role.findOneAndUpdate(
    { name: 'admin' },
    {
      name: 'admin', displayName: 'Administrador',
      description: 'Full system access',
      permissions: ADMIN_PERMISSIONS,
      isSystem: true, isActive: true,
    },
    { upsert: true, new: true },
  );

  const vendedorRole = await Role.findOneAndUpdate(
    { name: 'vendedor' },
    {
      name: 'vendedor', displayName: 'Vendedor',
      description: 'Sales and stock view',
      permissions: VENDEDOR_PERMISSIONS,
      isSystem: true, isActive: true,
    },
    { upsert: true, new: true },
  );

  console.log('✅ Roles created');

  // Default branch
  const branch = await Branch.findOneAndUpdate(
    { name: 'Casa Central' },
    { name: 'Casa Central', address: 'Av. Principal 1234', isActive: true },
    { upsert: true, new: true },
  );

  console.log('✅ Branch created');

  // Admin user
  const adminUser = await User.findOne({ email: 'admin@facturacion.com' });
  if (!adminUser) {
    await User.create({
      email: 'admin@facturacion.com',
      password: 'Admin1234!',
      firstName: 'Admin',
      lastName: 'Sistema',
      roleId: adminRole._id,
      branchId: branch._id,
      commissionPercentage: 0,
      isActive: true,
    });
    console.log('✅ Admin user created: admin@facturacion.com / Admin1234!');
  }

  // Vendedor user
  const vendedorUser = await User.findOne({ email: 'vendedor@facturacion.com' });
  if (!vendedorUser) {
    await User.create({
      email: 'vendedor@facturacion.com',
      password: 'Vendedor1234!',
      firstName: 'Juan',
      lastName: 'Pérez',
      roleId: vendedorRole._id,
      branchId: branch._id,
      commissionPercentage: 5,
      isActive: true,
    });
    console.log('✅ Vendedor user created: vendedor@facturacion.com / Vendedor1234!');
  }

  // Sample categories
  const categories = ['Electrónica', 'Ropa', 'Alimentos', 'Ferretería', 'Librería'];
  for (const name of categories) {
    await Category.findOneAndUpdate(
      { name },
      { name, isActive: true },
      { upsert: true },
    );
  }
  console.log('✅ Categories created');

  console.log('\n🎉 Seed completed successfully!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
