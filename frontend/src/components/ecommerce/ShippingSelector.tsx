import React, { useEffect, useMemo, useState } from 'react';
import {
  ShippingOption,
  useGetLocalidadesQuery,
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

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

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
  const { data: localidades = [], isFetching: loadingLocalidades } = useGetLocalidadesQuery(province, {
    skip: !province,
  });
  const [quoteShipping, { isLoading, error }] = useQuoteShippingMutation();
  const [deliveryMode, setDeliveryMode] = useState<'D' | 'S' | null>(null);
  const [localidadId, setLocalidadId] = useState<number | ''>('');
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [quoteMessage, setQuoteMessage] = useState('');

  const matchedLocalidad = useMemo(() => {
    if (!city || localidades.length === 0) return null;
    const normalizedCity = normalizeText(city);
    return (
      localidades.find((item) => normalizeText(item.nombre) === normalizedCity) ||
      localidades.find((item) => {
        const name = normalizeText(item.nombre);
        return name.includes(normalizedCity) || normalizedCity.includes(name);
      }) ||
      null
    );
  }, [city, localidades]);

  useEffect(() => {
    if (matchedLocalidad) {
      setLocalidadId(matchedLocalidad.id);
    }
  }, [matchedLocalidad]);

  const resetQuote = () => {
    setOptions([]);
    setQuoteMessage('');
    onSelectOption(null);
  };

  const handleModeChange = (mode: 'D' | 'S') => {
    setDeliveryMode(mode);
    resetQuote();
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
    if (deliveryMode === 'S' && !localidadId) {
      setQuoteMessage('Seleccioná tu localidad para ver sucursales disponibles.');
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
        localidadId: localidadId ? Number(localidadId) : undefined,
        subtotal,
        modalidad: deliveryMode,
      }).unwrap();
      setOptions(result.options);
      if (result.options.length === 1) {
        onSelectOption(result.options[0]);
      }
      setQuoteMessage(
        deliveryMode === 'S'
          ? `Encontramos ${result.options.length} sucursal(es) para retiro gratis.`
          : `Encontramos ${result.options.length} opción(es) de envío a domicilio.`
      );
    } catch (err: any) {
      setOptions([]);
      setQuoteMessage(err?.data?.message || 'No pudimos calcular el envío. Revisá los datos e intentá de nuevo.');
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
      <div>
        <h3 className="text-sm font-bold text-blue-950">¿Cómo querés recibir tu pedido?</h3>
        <p className="mt-1 text-xs text-blue-800">
          Elegí el tipo de entrega y después calculamos las opciones disponibles para tu zona.
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
          <p className="mt-1 text-xs text-emerald-700 font-semibold">Gratis</p>
          <p className="mt-1 text-xs text-blue-800">Retirás en Andreani, OCA u otro correo cerca tuyo.</p>
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
          <p className="mt-1 text-xs text-brand-700 font-semibold">Costo según tu CP</p>
          <p className="mt-1 text-xs text-blue-800">Te lo enviamos a la dirección que indiques.</p>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="section-heading">Provincia</label>
          <select
            className="input mt-1"
            required
            value={province}
            onChange={(e) => {
              onProvinceChange(e.target.value);
              setLocalidadId('');
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
              setLocalidadId('');
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

      {deliveryMode === 'S' ? (
        <div>
          <label className="section-heading">Localidad para sucursales</label>
          <select
            className="input mt-1"
            value={localidadId}
            onChange={(e) => {
              setLocalidadId(e.target.value ? Number(e.target.value) : '');
              resetQuote();
            }}
            disabled={!province || loadingLocalidades}
          >
            <option value="">
              {loadingLocalidades ? 'Cargando localidades...' : 'Seleccioná tu localidad'}
            </option>
            {localidades.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-blue-700">
            Si tu ciudad no aparece, elegí la localidad más cercana para ver sucursales disponibles.
          </p>
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleQuote}
        className="btn-secondary w-full sm:w-auto"
        disabled={isLoading || !deliveryMode}
      >
        {isLoading
          ? 'Calculando...'
          : deliveryMode === 'S'
            ? 'Buscar sucursales gratis'
            : deliveryMode === 'D'
              ? 'Calcular envío a domicilio'
              : 'Elegí un tipo de entrega'}
      </button>

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
