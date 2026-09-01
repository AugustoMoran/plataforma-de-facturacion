import React, { useState } from 'react';
import {
  ShippingOption,
  useGetProvincesQuery,
  useQuoteShippingMutation,
} from '../../services/shippingApi';
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
  const [quoteShipping, { isLoading, error }] = useQuoteShippingMutation();
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [quoteMessage, setQuoteMessage] = useState('');

  const handleQuote = async () => {
    setQuoteMessage('');
    onSelectOption(null);
    try {
      const result = await quoteShipping({
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        province,
        postalCode,
        city,
        subtotal,
      }).unwrap();
      setOptions(result.options);
      if (result.options.length === 1) {
        onSelectOption(result.options[0]);
      }
      setQuoteMessage(`Encontramos ${result.options.length} opción(es) de envío para tu zona.`);
    } catch (err: any) {
      setOptions([]);
      setQuoteMessage(err?.data?.message || 'No pudimos calcular el envío. Revisá CP y provincia.');
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
      <div>
        <h3 className="text-sm font-bold text-blue-950">Envío con EnvioPack</h3>
        <p className="mt-1 text-xs text-blue-800">
          Calculamos el costo en tiempo real. El retiro en sucursal es gratis; el envío a domicilio se suma al total.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="section-heading">Provincia</label>
          <select className="input mt-1" required value={province} onChange={(e) => onProvinceChange(e.target.value)}>
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
          <input className="input mt-1" required value={city} onChange={(e) => onCityChange(e.target.value)} />
        </div>
        <div>
          <label className="section-heading">Código postal</label>
          <input
            className="input mt-1"
            required
            inputMode="numeric"
            maxLength={4}
            value={postalCode}
            onChange={(e) => onPostalCodeChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="Ej: 1714"
          />
        </div>
      </div>

      <button type="button" onClick={handleQuote} className="btn-secondary w-full sm:w-auto" disabled={isLoading}>
        {isLoading ? 'Calculando envío...' : 'Calcular envío'}
      </button>

      {quoteMessage ? <p className="text-xs text-blue-800">{quoteMessage}</p> : null}
      {error ? <p className="text-xs text-red-600">{(error as any)?.data?.message || 'Error al cotizar envío'}</p> : null}

      {options.length > 0 ? (
        <div className="space-y-2">
          <p className="section-heading">Elegí cómo recibir tu pedido</p>
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
                    {option.sucursal?.horario ? (
                      <p className="mt-1 text-[11px] text-blue-700">Horario: {option.sucursal.horario}</p>
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
