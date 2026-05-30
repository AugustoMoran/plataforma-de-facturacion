import fs from 'fs';
import https from 'https';
import { DOMParser } from '@xmldom/xmldom';

import { config } from '../../config/env';
import { logger } from '../../config/logger';
import type { ISale } from '../../database/models/sale.model';

// AFIP Web Services endpoints
const AFIP_WSAA_HOMO = 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms?wsdl';
const AFIP_WSAA_PROD = 'https://wsaa.afip.gov.ar/ws/services/LoginCms?wsdl';
const AFIP_WSFE_HOMO = 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx?wsdl';
const AFIP_WSFE_PROD = 'https://servicios1.afip.gov.ar/wsfev1/service.asmx?wsdl';

// Voucher type mappings
const VOUCHER_TYPE_MAP: Record<string, number> = {
  FACTURA_A: 1,
  FACTURA_B: 6,
  NOTA_CREDITO_A: 3,
  NOTA_CREDITO_B: 8,
  TICKET: 11,
};

// Point of sale number (must be configured in AFIP)
const PUNTO_DE_VENTA = 1;

export interface AfipVoucherResult {
  cae: string;
  caeDueDate: string;
  voucherNumber: number;
}

export interface AfipAuthToken {
  token: string;
  sign: string;
  expirationTime: Date;
}

export class AfipService {
  private cachedToken: AfipAuthToken | null = null;

  private getWsaaUrl(): string {
    return config.afip.environment === 'produccion' ? AFIP_WSAA_PROD : AFIP_WSAA_HOMO;
  }

  private getWsfeUrl(): string {
    return config.afip.environment === 'produccion' ? AFIP_WSFE_PROD : AFIP_WSFE_HOMO;
  }

  private buildLoginTicketRequest(service: string): string {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours

    return `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${Math.floor(Date.now() / 1000)}</uniqueId>
    <generationTime>${now.toISOString()}</generationTime>
    <expirationTime>${expiresAt.toISOString()}</expirationTime>
  </header>
  <service>${service}</service>
</loginTicketRequest>`;
  }

  async getAuthToken(): Promise<AfipAuthToken> {
    // Return cached token if still valid
    if (this.cachedToken && this.cachedToken.expirationTime > new Date()) {
      return this.cachedToken;
    }

    if (!fs.existsSync(config.afip.certPath) || !fs.existsSync(config.afip.keyPath)) {
      throw new Error('AFIP certificates not found. Please configure AFIP_CERT_PATH and AFIP_KEY_PATH');
    }

    // In a real implementation, this would use SOAP with the actual WSAA
    // This is the correct architecture pattern - the actual SOAP call would use
    // the afip.ts library or a custom implementation
    logger.info('[AFIP] Requesting authentication token from WSAA');

    // Placeholder for actual WSAA implementation
    // In production, use: await afipLib.getServiceTA('wsfe');
    throw new Error('AFIP WSAA integration requires valid certificates. Configure certs and use afip.ts library.');
  }

  async getLastVoucherNumber(voucherType: number): Promise<number> {
    const auth = await this.getAuthToken();
    logger.info(`[AFIP] Getting last voucher number for type ${voucherType}`);
    // Actual WSFE call: FECompUltimoAutorizado
    return 0;
  }

  async emitVoucher(sale: ISale): Promise<AfipVoucherResult> {
    const voucherTypeNum = VOUCHER_TYPE_MAP[sale.afip!.voucherType];
    if (!voucherTypeNum) {
      throw new Error(`Unsupported voucher type: ${sale.afip!.voucherType}`);
    }

    const lastVoucher = await this.getLastVoucherNumber(voucherTypeNum);
    const newVoucherNumber = lastVoucher + 1;

    const saleDate = new Date(sale.createdAt);
    const cbteDesde = newVoucherNumber;
    const cbteHasta = newVoucherNumber;

    logger.info(`[AFIP] Emitting voucher ${sale.afip!.voucherType} #${newVoucherNumber} for sale ${sale._id}`);

    // Build FECAESolicitar request
    const importeNeto = sale.subtotal - sale.totalIva;
    const importeIva = sale.totalIva;
    const importeTotal = sale.total;

    const request = {
      Auth: {
        Cuit: config.afip.cuit,
        PtoVta: PUNTO_DE_VENTA,
        CbteTipo: voucherTypeNum,
      },
      FeCAEReq: {
        FeCabReq: {
          CantReg: 1,
          PtoVta: PUNTO_DE_VENTA,
          CbteTipo: voucherTypeNum,
        },
        FeDetReq: {
          FECAEDetRequest: {
            Concepto: 1, // Productos
            DocTipo: sale.customerCuit ? 80 : 99, // CUIT or Consumidor Final
            DocNro: sale.customerCuit ?? 0,
            CbteDesde: cbteDesde,
            CbteHasta: cbteHasta,
            CbteFch: saleDate.toISOString().slice(0, 10).replace(/-/g, ''),
            ImpTotal: importeTotal,
            ImpTotConc: 0,
            ImpNeto: importeNeto,
            ImpOpEx: 0,
            ImpIVA: importeIva,
            ImpTrib: 0,
            MonId: 'PES',
            MonCotiz: 1,
            Iva: {
              AlicIva: {
                Id: 5, // 21%
                BaseImp: importeNeto,
                Importe: importeIva,
              },
            },
          },
        },
      },
    };

    logger.debug('[AFIP] WSFE request:', JSON.stringify(request, null, 2));

    // Actual call would be: const result = await wsfeClient.FECAESolicitar(request);
    // For now, throw to indicate configuration needed
    throw new Error('AFIP WSFE requires valid credentials. Configure certificates in backend/certs/');
  }
}

export const afipService = new AfipService();
