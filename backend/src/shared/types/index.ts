// ===================================================
// SHARED TYPES - Used by both backend and frontend
// ===================================================

// --- Auth ---
export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: string;
  branchId?: string;
  permissions: Record<string, boolean>;
}

// --- Pagination ---
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// --- API Response ---
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

// --- Roles ---
export type UserRole = 'admin' | 'vendedor' | 'supervisor' | 'auditor' | 'deposito' | 'cajero';

// --- Permissions ---
export interface PermissionsMap {
  // Products
  viewProducts: boolean;
  createProducts: boolean;
  editProducts: boolean;
  deleteProducts: boolean;
  // Stock
  viewStock: boolean;
  adjustStock: boolean;
  transferStock: boolean;
  // Sales
  viewSales: boolean;
  createSales: boolean;
  cancelSales: boolean;
  refundSales: boolean;
  // Users
  viewUsers: boolean;
  createUsers: boolean;
  editUsers: boolean;
  deleteUsers: boolean;
  // Branches
  viewBranches: boolean;
  manageBranches: boolean;
  // Reports
  viewReports: boolean;
  exportReports: boolean;
  // AFIP
  manageAfip: boolean;
  // Roles
  manageRoles: boolean;
  managePermissions: boolean;
  // Categories
  manageCategories: boolean;
}

// --- Stock Movement Types ---
export type StockMovementType =
  | 'SALE'
  | 'RETURN'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'MANUAL_ADJUSTMENT'
  | 'INITIAL';

// --- Sale Types ---
export type SaleType = 'FACTURADA' | 'NO_FACTURADA';
export type SaleStatus = 'completed' | 'cancelled' | 'refunded' | 'partially_refunded';

// --- AFIP ---
export type AfipVoucherType = 'FACTURA_A' | 'FACTURA_B' | 'TICKET' | 'NOTA_CREDITO_A' | 'NOTA_CREDITO_B';
export type AfipStatus = 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'ERROR';

// --- Socket Events ---
export const SOCKET_EVENTS = {
  // Stock
  STOCK_UPDATED: 'stock:updated',
  STOCK_ALERT: 'stock:alert',
  // Sales
  SALE_CREATED: 'sale:created',
  SALE_UPDATED: 'sale:updated',
  SALE_CANCELLED: 'sale:cancelled',
  // AFIP
  AFIP_STATUS_UPDATED: 'afip:status_updated',
  // Permissions
  PERMISSIONS_UPDATED: 'permissions:updated',
  // Transfers
  TRANSFER_CREATED: 'transfer:created',
  TRANSFER_COMPLETED: 'transfer:completed',
  // Notifications
  NOTIFICATION: 'notification',
  // Users
  USER_LOGGED_IN: 'user:logged_in',
  USER_LOGGED_OUT: 'user:logged_out',
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
