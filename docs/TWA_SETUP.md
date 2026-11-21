# Publicar Oso Sound en Google Play Store (TWA)

La tienda web (`https://www.ososoundmusic.com`) puede publicarse en Play Store como app Android usando **Trusted Web Activity (TWA)**. La app es un “caparazón” que abre tu web en pantalla completa, igual que una app nativa.

## Requisitos previos

1. Cuenta **Google Play Console** (USD 25, pago único).
2. Sitio en HTTPS con PWA activa (ya desplegada en Vercel).
3. Íconos cuadrados generados (`public/icons/pwa-192.png` y `pwa-512.png`).
4. Política de privacidad en URL pública: `https://www.ososoundmusic.com/privacidad`

---

## Paso 1 — Instalar Bubblewrap (en tu PC)

```bash
npm install -g @bubblewrap/cli
```

---

## Paso 2 — Crear el proyecto Android

```bash
mkdir ososound-twa && cd ososound-twa
bubblewrap init --manifest=https://www.ososoundmusic.com/manifest.webmanifest
```

Valores sugeridos:

| Campo | Valor |
|-------|--------|
| packageId | `com.ososound.app` |
| host | `www.ososoundmusic.com` |
| name | `Oso Sound` |
| themeColor | `#2563eb` |
| backgroundColor | `#ffffff` |
| icon | usar `pwa-512.png` de la web |

---

## Paso 3 — Compilar el AAB

```bash
bubblewrap build
```

Genera `app-release-signed.aab` listo para subir a Play Console.

---

## Paso 4 — Digital Asset Links (obligatorio)

Google verifica que tu web autoriza la app Android. El archivo debe estar en:

`https://www.ososoundmusic.com/.well-known/assetlinks.json`

1. Subí el AAB a Play Console → **Prueba interna**.
2. En Play Console → **Configuración → Integridad de la app** (o el aviso de verificación de dominio) copiá los **SHA-256** del certificado de firma (App signing + upload key si aplica).
3. El archivo del repo es `frontend/public/.well-known/assetlinks.json` (package `com.ososound.app`). No dejes placeholders: cada fingerprint debe ser un SHA-256 con dos puntos (`AA:BB:...`).
4. Redeploy del frontend en Vercel (el `public/.well-known/` se publica como estático).
5. Verificá:

```
https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://www.ososoundmusic.com&relation=delegate_permission/common.handle_all_urls
```

Debe listar `com.ososound.app` sin `ERROR_CODE_MALFORMED_CONTENT` ni `ERROR_CODE_NO_MATCHING_ASSET`.
Si Play Console seguía fallando, pedí de nuevo la verificación de dominio tras el deploy (a veces cachea unos minutos).

---

## Paso 5 — Ficha en Play Console

Prepará:

- **Icono:** 512×512 PNG (`public/icons/pwa-512.png`)
- **Capturas:** mínimo 2 de la tienda en celular
- **Descripción corta y larga**
- **URL de política de privacidad**
- **Categoría:** Música / Compras

Subí el `.aab` en **Producción** o **Prueba cerrada** y enviá a revisión.

---

## Paso 6 — Variable en Vercel (opcional)

Cuando la app esté publicada, en Vercel:

```
VITE_ANDROID_APP_URL=https://play.google.com/store/apps/details?id=com.ososound.app
```

El banner “Descargar app” en la tienda llevará directo a Play Store.

---

## Notas importantes

- Cada deploy en Vercel **actualiza la web dentro de la app** sin republicar en Play Store.
- Solo hay que republicar si cambiás el `packageId`, permisos del TWA o el certificado de firma.
- El dominio canonical debe ser **`www.ososoundmusic.com`** (igual que en Bubblewrap).
