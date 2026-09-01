import crypto from 'crypto';
import {
  assertEnvioPackConfigured,
  envioPackGet,
  envioPackPost,
  getEnvioPackDepositId,
} from './envioPackClient';
import { buildPackagesFromItems } from './packageBuilder';
import {
  ARGENTINA_PROVINCES,
  provinceIdFromName,
  provinceNameById,
} from '../constants/argentinaProvinces';

const round2 = (value: number) => Math.round((Number(value) || 0) * 100) / 100;
const quoteSecret = () => process.env.ENVIOPACK_QUOTE_SECRET || process.env.JWT_ACCESS_TOKEN_SECRET || 'enviopack-quote';

export interface ShippingQuoteInput {
  items: Array<{ productId: string; quantity: number }>;
  province: string;
  postalCode: string;
  city?: string;
  localidadId?: number;
  subtotal?: number;
  modalidad?: 'D' | 'S' | 'all';
}

export interface ShippingOption {
  id: string;
  modalidad: 'D' | 'S';
  label: string;
  description: string;
  carrierId: string;
  carrierName: string;
  service: string;
  despacho: string;
  customerCost: number;
  sellerCost: number;
  estimatedHours?: number;
  isFree: boolean;
  sucursal?: {
    id: number;
    nombre: string;
    calle: string;
    numero: string;
    localidad: string;
    codigoPostal: string;
    horario?: string;
    correo?: string;
  };
}

export interface ShippingQuoteResult {
  provider: 'enviopack';
  province: string;
  provinceName: string;
  postalCode: string;
  city?: string;
  weight: number;
  paquetes: string;
  options: ShippingOption[];
  quoteToken: string;
}

interface EnvioPackSucursal {
  id: number;
  nombre: string;
  calle: string;
  numero: string;
  codigo_postal: string;
  horario?: string;
  correo?: { id: string; nombre: string };
  localidad?: { id: number; nombre: string };
}

interface EnvioPackQuoteRow {
  modalidad?: string;
  servicio?: string;
  valor?: string | number;
  horas_entrega?: number;
  correo?: { id: string; nombre: string };
  despacho?: string;
  sucursal?: EnvioPackSucursal;
}

const normalizeProvinceId = (province: string) => {
  const trimmed = String(province || '').trim();
  if (trimmed.length === 1 || trimmed.length === 2) {
    const upper = trimmed.toUpperCase();
    if (ARGENTINA_PROVINCES.some((item) => item.id === upper)) return upper;
  }
  return provinceIdFromName(trimmed) || trimmed.toUpperCase();
};

const normalizeText = (value: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const resolveLocalidadId = async (provinceId: string, city?: string, localidadId?: number) => {
  if (localidadId) {
    return { id: localidadId, nombre: city || '' };
  }

  const localidades = await envioPackGet<Array<{ id: number; nombre: string }>>('/localidades', {
    id_provincia: provinceId,
  });

  if (!localidades?.length) return null;

  const normalizedCity = normalizeText(city || '');
  if (!normalizedCity) return localidades[0];

  const exact = localidades.find((item) => normalizeText(item.nombre) === normalizedCity);
  if (exact) return exact;

  const partial = localidades.find((item) => {
    const name = normalizeText(item.nombre);
    return name.includes(normalizedCity) || normalizedCity.includes(name);
  });
  if (partial) return partial;

  return localidades.find((item) => normalizeText(item.nombre).startsWith(normalizedCity.slice(0, 4))) || null;
};

export const getLocalidades = async (province: string) => {
  assertEnvioPackConfigured();
  const provinceId = normalizeProvinceId(province);
  const localidades = await envioPackGet<Array<{ id: number; nombre: string }>>('/localidades', {
    id_provincia: provinceId,
  });
  return (localidades || []).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
};

const pickCheapest = (rows: EnvioPackQuoteRow[]) => {
  const sorted = [...rows].sort((a, b) => Number(a.valor || 0) - Number(b.valor || 0));
  return sorted[0];
};

const fetchSellerCost = async (input: {
  provinceId: string;
  postalCode: string;
  weight: number;
  paquetes: string;
  modalidad: 'D' | 'S';
  carrierId?: string;
  service?: string;
  despacho?: string;
}) => {
  const rows = await envioPackGet<EnvioPackQuoteRow[]>('/cotizar/costo', {
    provincia: input.provinceId,
    codigo_postal: input.postalCode,
    peso: input.weight,
    paquetes: input.paquetes,
    direccion_envio: getEnvioPackDepositId(),
    modalidad: input.modalidad,
    correo: input.carrierId,
    servicio: input.service,
    despacho: input.despacho || 'D',
  });

  const match = input.carrierId
    ? rows.find(
        (row) =>
          row.correo?.id === input.carrierId &&
          (row.servicio || 'N') === (input.service || 'N') &&
          (row.despacho || 'D') === (input.despacho || 'D')
      )
    : pickCheapest(rows);

  return round2(Number(match?.valor || pickCheapest(rows)?.valor || 0));
};

const safeSellerCost = async (input: Parameters<typeof fetchSellerCost>[0], fallback = 0) => {
  try {
    const cost = await fetchSellerCost(input);
    return cost > 0 ? cost : fallback;
  } catch {
    return fallback;
  }
};

const buildQuoteToken = (payload: Record<string, unknown>) => {
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', quoteSecret()).update(body).digest('hex');
  return Buffer.from(JSON.stringify({ payload, signature })).toString('base64url');
};

export const verifyQuoteToken = (token: string, expected: Record<string, unknown>) => {
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
    const body = JSON.stringify(decoded.payload);
    const signature = crypto.createHmac('sha256', quoteSecret()).update(body).digest('hex');
    if (signature !== decoded.signature) return false;

    const keys = Object.keys(expected);
    return keys.every((key) => JSON.stringify(decoded.payload[key]) === JSON.stringify(expected[key]));
  } catch {
    return false;
  }
};

export const getProvinces = () => ARGENTINA_PROVINCES;

export const quoteShipping = async (input: ShippingQuoteInput): Promise<ShippingQuoteResult> => {
  assertEnvioPackConfigured();

  const provinceId = normalizeProvinceId(input.province);
  const postalCode = String(input.postalCode || '').replace(/\D/g, '').slice(0, 4);
  if (!provinceId || postalCode.length !== 4) {
    throw new Error('Ingresá una provincia y un código postal válido de 4 dígitos');
  }

  const modalidadFilter = input.modalidad || 'all';
  const { weight, paquetes } = await buildPackagesFromItems(input.items);
  const depositId = getEnvioPackDepositId();
  const options: ShippingOption[] = [];

  if (modalidadFilter === 'D' || modalidadFilter === 'all') {
    const domicilioRows = await envioPackGet<EnvioPackQuoteRow[]>('/cotizar/precio/a-domicilio', {
      provincia: provinceId,
      codigo_postal: postalCode,
      peso: weight,
      paquetes,
      direccion_envio: depositId,
    });

    const domicilioGroups = new Map<string, EnvioPackQuoteRow>();
    for (const row of domicilioRows || []) {
      const service = row.servicio || 'N';
      const key = `domicilio-${service}`;
      const current = domicilioGroups.get(key);
      if (!current || Number(row.valor) < Number(current.valor)) {
        domicilioGroups.set(key, row);
      }
    }

    for (const row of domicilioGroups.values()) {
      const customerCost = round2(Number(row.valor || 0));
      const sellerCost = await safeSellerCost(
        {
          provinceId,
          postalCode,
          weight,
          paquetes,
          modalidad: 'D',
          service: row.servicio || 'N',
          despacho: 'D',
        },
        customerCost
      );

      const serviceLabel =
        row.servicio === 'X' ? 'Express' : row.servicio === 'P' ? 'Prioritario' : 'Estándar';

      options.push({
        id: `domicilio-${row.servicio || 'N'}`,
        modalidad: 'D',
        label: `Envío a domicilio · ${serviceLabel}`,
        description: row.horas_entrega
          ? `Entrega estimada en ${Math.ceil(row.horas_entrega / 24)} día(s)`
          : 'Entrega a tu domicilio con EnvioPack',
        carrierId: 'enviopack',
        carrierName: 'EnvioPack',
        service: row.servicio || 'N',
        despacho: 'D',
        customerCost,
        sellerCost,
        estimatedHours: row.horas_entrega,
        isFree: false,
      });
    }
  }

  if (modalidadFilter === 'S' || modalidadFilter === 'all') {
    const localidad = await resolveLocalidadId(provinceId, input.city, input.localidadId);
    if (!localidad) {
      if (modalidadFilter === 'S') {
        throw new Error(
          'No encontramos tu localidad para retiro en sucursal. Elegila del listado o revisá el nombre de la ciudad.'
        );
      }
    } else {
      const sucursalRows = await envioPackGet<EnvioPackQuoteRow[]>('/cotizar/precio/a-sucursal', {
        provincia: provinceId,
        localidad: localidad.id,
        peso: weight,
        paquetes,
        direccion_envio: depositId,
      });

      const branchMap = new Map<number, EnvioPackQuoteRow>();
      for (const row of sucursalRows || []) {
        const branchId = row.sucursal?.id;
        if (!branchId) continue;
        const current = branchMap.get(branchId);
        if (!current || Number(row.valor) < Number(current.valor)) {
          branchMap.set(branchId, row);
        }
      }

      for (const row of branchMap.values()) {
        if (!row.sucursal) continue;
        const carrierId = row.sucursal.correo?.id || row.correo?.id || 'andreani';
        const carrierName = row.sucursal.correo?.nombre || row.correo?.nombre || 'Correo';
        const sellerCost = await safeSellerCost(
          {
            provinceId,
            postalCode: row.sucursal.codigo_postal || postalCode,
            weight,
            paquetes,
            modalidad: 'S',
            carrierId,
            service: row.servicio || 'N',
            despacho: 'D',
          },
          round2(Number(row.valor || 0))
        );

        options.push({
          id: `sucursal-${row.sucursal.id}`,
          modalidad: 'S',
          label: `Retiro en sucursal · ${row.sucursal.nombre}`,
          description: `${carrierName} · ${row.sucursal.calle} ${row.sucursal.numero} · Gratis`,
          carrierId,
          carrierName,
          service: row.servicio || 'N',
          despacho: 'D',
          customerCost: 0,
          sellerCost,
          estimatedHours: row.horas_entrega,
          isFree: true,
          sucursal: {
            id: row.sucursal.id,
            nombre: row.sucursal.nombre,
            calle: row.sucursal.calle,
            numero: row.sucursal.numero,
            localidad: row.sucursal.localidad?.nombre || localidad.nombre,
            codigoPostal: row.sucursal.codigo_postal,
            horario: row.sucursal.horario,
            correo: carrierName,
          },
        });
      }

      if (modalidadFilter === 'S' && options.length === 0) {
        throw new Error(
          `No hay sucursales disponibles para ${localidad.nombre}. Probá con otra localidad cercana.`
        );
      }
    }
  }

  if (!options.length) {
    throw new Error('No encontramos opciones de envío para ese código postal. Probá con otro CP o contactanos.');
  }

  options.sort((a, b) => {
    if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
    return a.customerCost - b.customerCost;
  });

  const tokenPayload = {
    provinceId,
    postalCode,
    weight,
    paquetes,
    optionIds: options.map((item) => item.id),
  };

  return {
    provider: 'enviopack',
    province: provinceId,
    provinceName: provinceNameById(provinceId),
    postalCode,
    city: input.city,
    weight,
    paquetes,
    options,
    quoteToken: buildQuoteToken(tokenPayload),
  };
};

export const resolveShippingOption = async (
  input: ShippingQuoteInput,
  optionId: string
): Promise<ShippingOption> => {
  const modalidad = optionId.startsWith('sucursal-') ? 'S' : optionId.startsWith('domicilio-') ? 'D' : 'all';
  const quote = await quoteShipping({ ...input, modalidad });
  const option = quote.options.find((item) => item.id === optionId);
  if (!option) {
    throw new Error('La opción de envío seleccionada ya no está disponible. Volvé a calcular el envío.');
  }
  return option;
};

export const isEnvioPackEnabled = () => {
  try {
    assertEnvioPackConfigured();
    return true;
  } catch {
    return false;
  }
};
