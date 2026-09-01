export const ARGENTINA_PROVINCES = [
  { id: 'C', name: 'Ciudad Autónoma de Buenos Aires' },
  { id: 'B', name: 'Buenos Aires' },
  { id: 'K', name: 'Catamarca' },
  { id: 'H', name: 'Chaco' },
  { id: 'U', name: 'Chubut' },
  { id: 'X', name: 'Córdoba' },
  { id: 'W', name: 'Corrientes' },
  { id: 'E', name: 'Entre Ríos' },
  { id: 'P', name: 'Formosa' },
  { id: 'Y', name: 'Jujuy' },
  { id: 'L', name: 'La Pampa' },
  { id: 'F', name: 'La Rioja' },
  { id: 'M', name: 'Mendoza' },
  { id: 'N', name: 'Misiones' },
  { id: 'Q', name: 'Neuquén' },
  { id: 'R', name: 'Río Negro' },
  { id: 'A', name: 'Salta' },
  { id: 'J', name: 'San Juan' },
  { id: 'D', name: 'San Luis' },
  { id: 'Z', name: 'Santa Cruz' },
  { id: 'S', name: 'Santa Fe' },
  { id: 'G', name: 'Santiago del Estero' },
  { id: 'V', name: 'Tierra del Fuego' },
  { id: 'T', name: 'Tucumán' },
] as const;

export const provinceNameById = (id: string) =>
  ARGENTINA_PROVINCES.find((item) => item.id === id)?.name || id;

export const provinceIdFromName = (name: string) => {
  const normalized = name.trim().toLowerCase();
  const match = ARGENTINA_PROVINCES.find(
    (item) =>
      item.name.toLowerCase() === normalized ||
      item.id.toLowerCase() === normalized ||
      item.name.toLowerCase().includes(normalized) ||
      normalized.includes(item.name.toLowerCase())
  );
  return match?.id;
};
