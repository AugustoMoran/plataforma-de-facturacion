// Shared types used by both frontend and backend

export type PermissionsMap = {
  viewProducts?: boolean;
  createProducts?: boolean;
  editProducts?: boolean;
  deleteProducts?: boolean;
  viewSales?: boolean;
  createSales?: boolean;
  cancelSales?: boolean;
  viewStock?: boolean;
  editStock?: boolean;
  transferStock?: boolean;
  viewBranches?: boolean;
  createBranches?: boolean;
  editBranches?: boolean;
  deleteBranches?: boolean;
  viewUsers?: boolean;
  createUsers?: boolean;
  editUsers?: boolean;
  deleteUsers?: boolean;
  manageRoles?: boolean;
  viewReports?: boolean;
  [key: string]: boolean | undefined;
};

export const SOCKET_EVENTS = {
  // Stock
  STOCK_UPDATED: 'stock:updated',
  STOCK_ALERT: 'stock:alert',

  // Sales
  SALE_CREATED: 'sale:created',
  SALE_CANCELLED: 'sale:cancelled',

  // AFIP
  AFIP_STATUS_UPDATED: 'afip:status_updated',

  // Permissions
  PERMISSIONS_UPDATED: 'permissions:updated',

  // Transfers
  TRANSFER_COMPLETED: 'transfer:completed',

  // Notifications
  NOTIFICATION: 'notification',
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

export type SaleType = 'FACTURADA' | 'NO_FACTURADA';

export type SaleStatus = 'completed' | 'cancelled' | 'refunded' | 'partially_refunded';

export type StockMovementType =
  | 'SALE'
  | 'RETURN'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'MANUAL_ADJUSTMENT';

export type AfipVoucherType = 'FACTURA_A' | 'FACTURA_B' | 'TICKET' | 'NOTA_CREDITO_A' | 'NOTA_CREDITO_B';

export type AfipStatus = 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'ERROR';
