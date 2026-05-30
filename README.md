# Plataforma de Facturación Enterprise

Sistema completo de facturación, stock y ventas con integración AFIP real, preparado para producción.

## Stack

**Frontend:** React 18 + TypeScript + Vite + Redux Toolkit + RTK Query + TailwindCSS + Socket.IO Client  
**Backend:** Node.js + Express + TypeScript + MongoDB Atlas + Mongoose + Socket.IO + BullMQ  
**Infraestructura:** Docker + Nginx Reverse Proxy + Redis  

## Estructura

```
root/
├── frontend/          # React SPA
├── backend/           # Express API
├── shared/            # Tipos compartidos
├── nginx/             # Configuración Nginx
├── scripts/           # Scripts de inicialización
└── docker-compose.yml
```

## Inicio rápido

### Prerrequisitos

- Docker & Docker Compose
- Node.js 20+

### Desarrollo con Docker

1. Configurar variables de entorno:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

2. Editar `.env` con tus valores (MongoDB Atlas, Cloudinary, JWT secrets)

3. Levantar servicios:
```bash
docker-compose up -d
```

4. Seed inicial:
```bash
docker-compose exec backend npm run seed
```

5. Acceder:
   - App: http://localhost
   - Admin: `admin@empresa.com` / `Admin123!`
   - Vendedor: `vendedor@empresa.com` / `Vendedor123!`

### Desarrollo local

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend (otra terminal)
cd frontend && npm install && npm run dev
```

## Variables de entorno

Ver `.env.example` en root y `backend/.env.example` para lista completa.

| Variable | Descripción |
|----------|-------------|
| `MONGODB_URI` | URI de MongoDB Atlas |
| `JWT_ACCESS_SECRET` | Secret access tokens (min 32 chars) |
| `JWT_REFRESH_SECRET` | Secret refresh tokens (min 32 chars) |
| `CLOUDINARY_*` | Credenciales Cloudinary |
| `AFIP_CUIT` | CUIT del emisor |
| `REDIS_URL` | URL de Redis |

## Autenticación (JWT HttpOnly)

```
Login → Access Token (15min) + Refresh Token (7d) en cookies HttpOnly
Requests → Middleware verifica Access Token automáticamente
Token expirado → /api/auth/refresh (rotación automática)
Logout → Invalida refresh token en DB
```

**Reuse Detection:** Si se detecta uso de un refresh token ya utilizado, toda la familia de tokens es revocada.

## Roles y Permisos Dinámicos

Los permisos se almacenan por usuario y se propagan en tiempo real via Socket.IO.

```typescript
permissions: {
  viewProducts: true,
  createSales: true,
  cancelSales: false,
  editStock: false,
  // ...
}
```

Cuando el admin modifica permisos → Socket.IO → Redux state → UI rerenderea instantáneamente.

## Flujo AFIP

```
Venta facturada → BullMQ Queue → Worker (WSAA + WSFE) → CAE → Socket.IO → Frontend
```

Para producción real, colocar certificados en `backend/certs/` y configurar `AFIP_ENVIRONMENT=production`.

## Stock

Todo movimiento de stock genera un `StockMovement` con historial completo:

- `SALE` — Venta
- `RETURN` — Devolución
- `TRANSFER_IN/OUT` — Transferencias entre sucursales
- `MANUAL_ADJUSTMENT` — Ajuste manual (admin)

## Testing

```bash
# Backend (Jest + Supertest)
cd backend && npm test

# Frontend (React Testing Library)
cd frontend && npm test

# E2E (Playwright)
cd frontend && npx playwright test
```

## Deploy producción

```bash
docker-compose up -d
docker-compose exec backend npm run seed
```

## Licencia

MIT
