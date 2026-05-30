import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { selectIsAuthenticated } from '../auth/authSlice';
import { updatePermissions } from '../auth/authSlice';
import { addNotification } from '../notifications/notificationsSlice';
import { apiSlice } from '../../api/apiSlice';

const SOCKET_URL = import.meta.env['VITE_SOCKET_URL'] ?? '';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!isAuthenticated) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    // Stock events
    socket.on('stock:updated', (data) => {
      dispatch(apiSlice.util.invalidateTags([{ type: 'Stock', id: 'LIST' }]));
    });

    socket.on('stock:alert', (data: { productName: string; quantity: number; minStock: number }) => {
      toast.warning(`Stock bajo: ${data.productName}`, {
        description: `${data.quantity} unidades restantes (mínimo: ${data.minStock})`,
        duration: 8000,
      });

      dispatch(addNotification({
        _id: Date.now().toString(),
        type: 'STOCK_ALERT',
        severity: data.quantity === 0 ? 'error' : 'warning',
        title: 'Alerta de stock',
        message: `${data.productName} tiene stock bajo: ${data.quantity} unidades`,
        isRead: false,
        createdAt: new Date().toISOString(),
      }));
    });

    // Sale events
    socket.on('sale:created', () => {
      dispatch(apiSlice.util.invalidateTags([{ type: 'Sale', id: 'LIST' }]));
    });

    socket.on('sale:cancelled', () => {
      dispatch(apiSlice.util.invalidateTags([{ type: 'Sale', id: 'LIST' }]));
    });

    // AFIP events
    socket.on('afip:status_updated', (data: { saleId: string; status: string; cae?: string }) => {
      dispatch(apiSlice.util.invalidateTags([{ type: 'Sale', id: data.saleId }]));

      if (data.status === 'APPROVED') {
        toast.success(`Factura aprobada`, { description: `CAE: ${data.cae}` });
      } else if (data.status === 'ERROR') {
        toast.error('Error en facturación AFIP', { description: 'Revisar estado de la venta' });
      }
    });

    // Permissions events - real-time permission updates
    socket.on('permissions:updated', (data: { permissions: Record<string, boolean> }) => {
      dispatch(updatePermissions(data.permissions));
      toast.info('Permisos actualizados por el administrador');
    });

    // Transfer events
    socket.on('transfer:completed', () => {
      dispatch(apiSlice.util.invalidateTags([{ type: 'Stock', id: 'LIST' }]));
      toast.info('Transferencia de stock completada');
    });

    // Generic notifications
    socket.on('notification', (notification) => {
      dispatch(addNotification({
        ...notification,
        _id: notification._id ?? Date.now().toString(),
        createdAt: notification.createdAt ?? new Date().toISOString(),
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, dispatch]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
