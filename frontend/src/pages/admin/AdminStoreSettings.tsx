import React, { useRef, useState, useEffect } from 'react';
import {
  useClearBannerImagesMutation,
  useClearPromoBannerImageMutation,
  useClearPromoTripletImagesMutation,
  useGetAdminSettingsQuery,
  useUpdateSettingsMutation,
  useUploadBannerImagesMutation,
  useUploadPromoBannerImageMutation,
  useUploadPromoTripletImagesMutation,
} from '../../services/settingsApi';

const MAX_BANNERS = 10;
const MAX_PROMO_TRIPLET = 3;

const PROMO_TRIPLET_SLOTS = [
  {
    index: 0,
    title: 'Columna izquierda',
    hint: 'Primera imagen promocional del home',
  },
  {
    index: 1,
    title: 'Columna centro',
    hint: 'Segunda imagen promocional del home',
  },
  {
    index: 2,
    title: 'Columna derecha — Afinador',
    hint: 'Imagen de fondo del afinador (al tocarla se abre la herramienta)',
  },
] as const;

export const AdminStoreSettings: React.FC = () => {
  const carouselInputRef = useRef<HTMLInputElement>(null);
  const tripletInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const singleInputRef = useRef<HTMLInputElement>(null);

  const { data: settings, isLoading } = useGetAdminSettingsQuery();
  const [uploadBanners, { isLoading: uploading }] = useUploadBannerImagesMutation();
  const [clearBanners, { isLoading: clearing }] = useClearBannerImagesMutation();
  const [uploadTriplet, { isLoading: uploadingTriplet }] = useUploadPromoTripletImagesMutation();
  const [clearTriplet, { isLoading: clearingTriplet }] = useClearPromoTripletImagesMutation();
  const [uploadSingle, { isLoading: uploadingSingle }] = useUploadPromoBannerImageMutation();
  const [clearSingle, { isLoading: clearingSingle }] = useClearPromoBannerImageMutation();
  const [updateSettings, { isLoading: saving }] = useUpdateSettingsMutation();

  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [initialized, setInitialized] = useState(false);

  const [carouselFiles, setCarouselFiles] = useState<File[]>([]);
  const [carouselPreviews, setCarouselPreviews] = useState<string[]>([]);
  const [tripletSlotFiles, setTripletSlotFiles] = useState<Array<File | null>>([null, null, null]);
  const [tripletSlotPreviews, setTripletSlotPreviews] = useState<Array<string | null>>([null, null, null]);
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [singlePreview, setSinglePreview] = useState<string | null>(null);

  useEffect(() => {
    if (settings && !initialized) {
      setStoreName(settings.storeName || '');
      setStoreDescription(settings.storeDescription || '');
      setInitialized(true);
    }
  }, [settings, initialized]);

  const revokePreviews = (urls: string[]) => urls.forEach((url) => URL.revokeObjectURL(url));

  const handleCarouselChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_BANNERS);
    setCarouselFiles(files);
    revokePreviews(carouselPreviews);
    setCarouselPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleTripletSlotChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target.files || [])[0] || null;
    setTripletSlotFiles((prev) => {
      const next = [...prev];
      next[index] = file;
      return next;
    });

    setTripletSlotPreviews((prev) => {
      const next = [...prev];
      if (next[index]) URL.revokeObjectURL(next[index] as string);
      next[index] = file ? URL.createObjectURL(file) : null;
      return next;
    });
  };

  const clearTripletSlotSelection = (index: number) => {
    setTripletSlotFiles((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setTripletSlotPreviews((prev) => {
      const next = [...prev];
      if (next[index]) URL.revokeObjectURL(next[index] as string);
      next[index] = null;
      return next;
    });
    const input = tripletInputRefs.current[index];
    if (input) input.value = '';
  };

  const handleSingleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = (e.target.files || [])[0] || null;
    setSingleFile(file);
    if (singlePreview) URL.revokeObjectURL(singlePreview);
    setSinglePreview(file ? URL.createObjectURL(file) : null);
  };

  const handleUploadBanners = async () => {
    if (!carouselFiles.length) {
      alert('Seleccioná al menos una imagen');
      return;
    }

    const formData = new FormData();
    carouselFiles.forEach((file) => formData.append('banners', file));

    try {
      await uploadBanners(formData).unwrap();
      setCarouselFiles([]);
      revokePreviews(carouselPreviews);
      setCarouselPreviews([]);
      if (carouselInputRef.current) carouselInputRef.current.value = '';
      alert('Carrusel actualizado.');
    } catch (err: any) {
      alert(err?.data?.message || 'Error al subir imágenes');
    }
  };

  const handleClearBanners = async () => {
    if (!confirm('¿Restaurar las imágenes por defecto del carrusel?')) return;
    try {
      await clearBanners().unwrap();
      alert('Carrusel restaurado a imágenes por defecto');
    } catch (err: any) {
      alert(err?.data?.message || 'Error al restaurar carrusel');
    }
  };

  const handleUploadTriplet = async () => {
    const hasNewFile = tripletSlotFiles.some(Boolean);
    if (!hasNewFile) {
      alert('Elegí al menos una imagen en la posición que querés cambiar');
      return;
    }

    const formData = new FormData();
    for (let index = 0; index < MAX_PROMO_TRIPLET; index += 1) {
      const file = tripletSlotFiles[index];
      if (file) {
        formData.append(`slot${index}`, file);
      } else if (currentTriplet[index]) {
        formData.append(`existing${index}`, currentTriplet[index]);
      }
    }

    try {
      await uploadTriplet(formData).unwrap();
      tripletSlotPreviews.forEach((preview) => {
        if (preview) URL.revokeObjectURL(preview);
      });
      setTripletSlotFiles([null, null, null]);
      setTripletSlotPreviews([null, null, null]);
      tripletInputRefs.current.forEach((input) => {
        if (input) input.value = '';
      });
      alert('Banner triple actualizado.');
    } catch (err: any) {
      alert(err?.data?.message || 'Error al subir imágenes');
    }
  };

  const handleClearTriplet = async () => {
    if (!confirm('¿Restaurar las imágenes por defecto del banner triple?')) return;
    try {
      await clearTriplet().unwrap();
      alert('Banner triple restaurado a imágenes por defecto');
    } catch (err: any) {
      alert(err?.data?.message || 'Error al restaurar banner triple');
    }
  };

  const handleUploadSingle = async () => {
    if (!singleFile) {
      alert('Seleccioná una imagen');
      return;
    }

    const formData = new FormData();
    formData.append('promo', singleFile);

    try {
      await uploadSingle(formData).unwrap();
      setSingleFile(null);
      if (singlePreview) URL.revokeObjectURL(singlePreview);
      setSinglePreview(null);
      if (singleInputRef.current) singleInputRef.current.value = '';
      alert('Banner único actualizado.');
    } catch (err: any) {
      alert(err?.data?.message || 'Error al subir imagen');
    }
  };

  const handleClearSingle = async () => {
    if (!confirm('¿Restaurar la imagen por defecto del banner único?')) return;
    try {
      await clearSingle().unwrap();
      alert('Banner único restaurado a imagen por defecto');
    } catch (err: any) {
      alert(err?.data?.message || 'Error al restaurar banner');
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettings({
        storeName: storeName.trim() || 'Tienda Online',
        storeDescription: storeDescription.trim(),
        freeShippingThreshold: 0,
      }).unwrap();
      alert('Configuración guardada');
    } catch (err: any) {
      alert(err?.data?.message || 'Error al guardar');
    }
  };

  const currentBanners = settings?.bannerImages || [];
  const currentTriplet = settings?.promoTripletImages || [];
  const currentSingle = settings?.promoBannerImage || '';

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h1 className="page-title">Tienda online</h1>
        <p className="page-sub">Carrusel, banners promocionales y textos del home</p>
      </div>

      {isLoading ? (
        <div className="text-slate-500 text-sm">Cargando configuración...</div>
      ) : (
        <>
          <section className="card p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Datos de la tienda</h2>
              <p className="text-sm text-slate-500 mt-1">Nombre y descripción visibles en el home</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="label">Nombre de la tienda</label>
                <input className="input" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
              </div>
            </div>
            <p className="text-xs text-blue-700/70">
              Los envíos se cotizan con EnvíoPack al checkout y son a cargo del cliente.
            </p>
            <div>
              <label className="label">Descripción</label>
              <textarea
                className="input min-h-[90px]"
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                placeholder="Ej: Tu tienda de instrumentos y audio profesional"
              />
            </div>
            <button type="button" className="btn-primary" onClick={handleSaveSettings} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar datos'}
            </button>
          </section>

          <section className="card p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Carrusel del home</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Hasta {MAX_BANNERS} imágenes. Al subir nuevas, reemplazan todas las actuales.
                </p>
                {settings?.usingDefaultBanners && (
                  <span className="inline-block mt-2 badge-blue text-[10px]">Usando imágenes por defecto</span>
                )}
              </div>
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={handleClearBanners}
                disabled={clearing || settings?.usingDefaultBanners}
              >
                Restaurar defaults
              </button>
            </div>

            {currentBanners.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {currentBanners.map((url, index) => (
                  <div key={`${url}-${index}`} className="aspect-[16/9] rounded-lg overflow-hidden ring-1 ring-white/10">
                    <img src={url} alt={`Banner ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="border border-dashed border-white/10 rounded-xl p-5 space-y-4">
              <input
                ref={carouselInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-500/20 file:text-brand-300 hover:file:bg-brand-500/30"
                onChange={handleCarouselChange}
              />
              {carouselPreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {carouselPreviews.map((url, index) => (
                    <div key={url} className="aspect-[16/9] rounded-lg overflow-hidden ring-1 ring-brand-500/30">
                      <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                className="btn-primary"
                onClick={handleUploadBanners}
                disabled={uploading || !carouselFiles.length}
              >
                {uploading ? 'Subiendo...' : `Subir carrusel (${carouselFiles.length || 0}/${MAX_BANNERS})`}
              </button>
            </div>
          </section>

          <section className="card p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Banner triple (3 imágenes)</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Elegí qué imagen va en cada columna. La tercera es el afinador interactivo.
                </p>
                {settings?.usingDefaultPromoTriplet && (
                  <span className="inline-block mt-2 badge-blue text-[10px]">Usando imágenes por defecto</span>
                )}
              </div>
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={handleClearTriplet}
                disabled={clearingTriplet || settings?.usingDefaultPromoTriplet}
              >
                Restaurar defaults
              </button>
            </div>

            {currentTriplet.length > 0 && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {PROMO_TRIPLET_SLOTS.map((slot) => {
                  const currentUrl = currentTriplet[slot.index];
                  const previewUrl = tripletSlotPreviews[slot.index];
                  const hasPendingFile = Boolean(tripletSlotFiles[slot.index]);

                  return (
                    <div
                      key={slot.index}
                      className="rounded-xl border border-white/10 bg-slate-900/40 p-4 space-y-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{slot.title}</p>
                        <p className="text-xs text-slate-500 mt-1">{slot.hint}</p>
                      </div>

                      <div className="aspect-[4/3] rounded-lg overflow-hidden ring-1 ring-white/10 bg-slate-950/40">
                        {previewUrl || currentUrl ? (
                          <img
                            src={previewUrl || currentUrl}
                            alt={slot.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-slate-500">
                            Sin imagen
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <input
                          ref={(element) => {
                            tripletInputRefs.current[slot.index] = element;
                          }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="block w-full text-sm text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand-500/20 file:text-brand-300 hover:file:bg-brand-500/30"
                          onChange={(event) => handleTripletSlotChange(slot.index, event)}
                        />
                        {hasPendingFile ? (
                          <button
                            type="button"
                            className="text-xs text-slate-400 hover:text-white"
                            onClick={() => clearTripletSlotSelection(slot.index)}
                          >
                            Quitar selección
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="border border-dashed border-white/10 rounded-xl p-5 space-y-4">
              <p className="text-sm text-slate-400">
                Cambiá solo la posición que necesites. Las demás conservan la imagen actual al guardar.
              </p>
              <button
                type="button"
                className="btn-primary"
                onClick={handleUploadTriplet}
                disabled={uploadingTriplet || !tripletSlotFiles.some(Boolean)}
              >
                {uploadingTriplet
                  ? 'Guardando...'
                  : `Guardar banner triple (${tripletSlotFiles.filter(Boolean).length} cambio(s))`}
              </button>
            </div>
          </section>

          <section className="card p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Banner único</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Una imagen ancha debajo del banner triple.
                </p>
                {settings?.usingDefaultPromoBanner && (
                  <span className="inline-block mt-2 badge-blue text-[10px]">Usando imagen por defecto</span>
                )}
              </div>
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={handleClearSingle}
                disabled={clearingSingle || settings?.usingDefaultPromoBanner}
              >
                Restaurar default
              </button>
            </div>

            {currentSingle && (
              <div className="aspect-[21/6] rounded-lg overflow-hidden ring-1 ring-white/10 max-h-48">
                <img src={currentSingle} alt="Banner único actual" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="border border-dashed border-white/10 rounded-xl p-5 space-y-4">
              <input
                ref={singleInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-500/20 file:text-brand-300 hover:file:bg-brand-500/30"
                onChange={handleSingleChange}
              />
              {singlePreview && (
                <div className="aspect-[21/6] rounded-lg overflow-hidden ring-1 ring-brand-500/30 max-h-48">
                  <img src={singlePreview} alt="Preview banner único" className="w-full h-full object-cover" />
                </div>
              )}
              <button
                type="button"
                className="btn-primary"
                onClick={handleUploadSingle}
                disabled={uploadingSingle || !singleFile}
              >
                {uploadingSingle ? 'Subiendo...' : 'Subir banner único'}
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
};
