import React, { useEffect, useMemo, useState } from 'react';
import {
  ShippingOption,
  useGetProvincesQuery,
  useQuoteShippingMutation,
} from '../../services/shippingApi';
import { useGetPublicBranchesQuery } from '../../services/branchApi';
import { CartItem } from '../../store/cartSlice';

interface ShippingSelectorProps {
  items: CartItem[];
  subtotal: number;
  province: string;
  city: string;
  postalCode: string;
  onProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onPostalCodeChange: (value: string) => void;
  selectedOptionId: string | null;
  onSelectOption: (option: ShippingOption | null) => void;
}

const branchToShippingOption = (branch: {
  _id: string;
  name: string;
  address: string;
  city?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
}): ShippingOption => ({
  id: `store-${branch._id}`,
  modalidad: 'S',
  label: `Retiro en sucursal · ${branch.name}`,
  description: [branch.address, branch.city, branch.province].filter(Boolean).join(' · '),
  carrierId: 'store',
  carrierName: 'OsoSound',
  service: 'PICKUP',
  despacho: 'S',
  customerCost: 0,
  sellerCost: 0,
  isFree: true,
  pickupBranch: {
    id: branch._id,
    name: branch.name,
    address: branch.address,
    city: branch.city,
    province: branch.province,
    postalCode: branch.postalCode,
    phone: branch.phone,
  },
});

export const ShippingSelector: React.FC<ShippingSelectorProps> = ({
  items,
  subtotal,
  province,
  city,
  postalCode,
  onProvinceChange,
  onCityChange,
  onPostalCodeChange,
  selectedOptionId,
  onSelectOption,
}) => {
  const { data: provinces = [] } = useGetProvincesQuery();
  const { data: storeBranches = [], isLoading: loadingBranches } = useGetPublicBranchesQuery();
  const [quoteShipping, { isLoading, error }] = useQuoteShippingMutation();
  const [deliveryMode, setDeliveryMode] = useState<'D' | 'S' | null>(null);
  const [domicilioOptions, setDomicilioOptions] = useState<ShippingOption[]>([]);
  const [quoteMessage, setQuoteMessage] = useState('');

  const storeOptions = useMemo(
    () => storeBranches.map((branch) => branchToShippingOption(branch)),
    [storeBranches]
  );

  const options = deliveryMode === 'S' ? storeOptions : domicilioOptions;

  useEffect(() => {
    if (deliveryMode !== 'S' || storeOptions.length !== 1) return;
    onSelectOption(storeOptions[0]);
  }, [deliveryMode, onSelectOption, storeOptions]);

  const resetQuote = () => {
    setDomicilioOptions([]);
    setQuoteMessage('');
    onSelectOption(null);
  };

  const handleModeChange = (mode: 'D' | 'S') => {
    setDeliveryMode(mode);
    resetQuote();
    if (mode === 'S' && storeOptions.length === 1) {
      onSelectOption(storeOptions[0]);
    }
  };

  const handleQuote = async () => {
    if (!deliveryMode) {
      setQuoteMessage('Elegí primero si querés envío a domicilio o retiro en sucursal.');
      return;
    }
    if (!province || !postalCode || postalCode.length !== 4) {
      setQuoteMessage('Completá provincia y código postal de 4 dígitos.');
      return;
    }

    setQuoteMessage('');
    onSelectOption(null);
    try {
      const result = await quoteShipping({
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        province,
        postalCode,
        city,
        subtotal,
        modalidad: 'D',
      }).unwrap();
      setDomicilioOptions(result.options);
      if (result.options.length === 1) {
        onSelectOption(result.options[0]);
      }
      setQuoteMessage(`Encontramos ${result.options.length} opción(es) de envío a domicilio.`);
    } catch (err: any) {
      setDomicilioOptions([]);
      setQuoteMessage(err?.data?.message || 'No pudimos calcular el envío. Revisá los datos e intentá de nuevo.');
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
      <div>
        <h3 className="text-sm font-bold text-blue-950">¿Cómo querés recibir tu pedido?</h3>
        <p className="mt-1 text-xs text-blue-800">
          Elegí el tipo de entrega y después seleccioná la opción que prefieras.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => handleModeChange('S')}
          className={`rounded-2xl border p-4 text-left transition-all ${
            deliveryMode === 'S'
              ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
              : 'border-blue-200 bg-white hover:border-blue-300'
          }`}
        >
          <p className="text-sm font-bold text-blue-950">Retiro en sucursal</p>
          <p className="mt-1 text-xs font-semibold text-emerald-700">Gratis</p>
          <p className="mt-1 text-xs text-blue-800">Retirás en una de nuestras sucursales OsoSound.</p>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('D')}
          className={`rounded-2xl border p-4 text-left transition-all ${
            deliveryMode === 'D'
              ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-200'
              : 'border-blue-200 bg-white hover:border-blue-300'
          }`}
        >
          <p className="text-sm font-bold text-blue-950">Envío a domicilio</p>
          <p className="mt-1 text-xs font-semibold text-brand-700">Costo según tu CP</p>
          <p className="mt-1 text-xs text-blue-800">Te lo enviamos a la dirección que indiques.</p>
        </button>
      </div>

      {deliveryMode === 'D' ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="section-heading">Provincia</label>
              <select
                className="input mt-1"
                required
                value={province}
                onChange={(e) => {
                  onProvinceChange(e.target.value);
                  resetQuote();
                }}
              >
                <option value="">Seleccioná</option>
                {provinces.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="section-heading">Ciudad / Localidad</label>
              <input
                className="input mt-1"
                required
                value={city}
                onChange={(e) => {
                  onCityChange(e.target.value);
                  resetQuote();
                }}
                placeholder="Ej: Morón"
              />
            </div>
            <div>
              <label className="section-heading">Código postal</label>
              <input
                className="input mt-1"
                required
                inputMode="numeric"
                maxLength={4}
                value={postalCode}
                onChange={(e) => {
                  onPostalCodeChange(e.target.value.replace(/\D/g, '').slice(0, 4));
                  resetQuote();
                }}
                placeholder="Ej: 1708"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleQuote}
            className="btn-secondary w-full sm:w-auto"
            disabled={isLoading}
          >
            {isLoading ? 'Calculando...' : 'Calcular envío a domicilio'}
          </button>
        </>
      ) : null}

      {deliveryMode === 'S' ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-blue-900">
          {loadingBranches ? (
            <p>Cargando sucursales...</p>
          ) : storeOptions.length > 0 ? (
            <p>Elegí la sucursal donde querés retirar tu pedido. El retiro es gratis.</p>
          ) : (
            <p>No hay sucursales cargadas en este momento. Contactanos para coordinar el retiro.</p>
          )}
        </div>
      ) : null}

      {quoteMessage ? <p className="text-xs text-blue-800">{quoteMessage}</p> : null}
      {error ? <p className="text-xs text-red-600">{(error as any)?.data?.message || 'Error al cotizar envío'}</p> : null}

      {options.length > 0 ? (
        <div className="space-y-2">
          <p className="section-heading">
            {deliveryMode === 'S' ? 'Elegí la sucursal' : 'Elegí el servicio de envío'}
          </p>
          {options.map((option) => {
            const selected = selectedOptionId === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => onSelectOption(option)}
                className={`w-full rounded-xl border p-4 text-left transition-all ${
                  selected
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-200'
                    : 'border-blue-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-blue-950">{option.label}</p>
                    <p className="mt-1 text-xs text-blue-800">{option.description}</p>
                    {option.pickupBranch?.phone ? (
                      <p className="mt-1 text-[11px] text-blue-700">Tel: {option.pickupBranch.phone}</p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${option.isFree ? 'text-emerald-600' : 'text-brand-700'}`}>
                      {option.isFree
                        ? 'Gratis'
                        : `$${option.customerCost.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
