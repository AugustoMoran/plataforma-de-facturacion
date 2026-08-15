# TWA (Trusted Web Activity) — Play Store Android

La PWA de Oso Sound puede publicarse en Google Play envolviendo la URL de producción con **Bubblewrap**.

## Requisitos previos

1. PWA desplegada en HTTPS (Vercel).
2. `manifest.webmanifest` generado por Vite PWA.
3. Archivo `public/.well-known/assetlinks.json` con el SHA-256 del certificado de firma del AAB.

## Pasos

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest=https://TU-DOMINIO.vercel.app/manifest.webmanifest
bubblewrap build
```

Configuración sugerida en Bubblewrap:

| Campo | Valor |
|-------|--------|
| packageId | `com.ososound.app` |
| host | tu dominio Vercel |
| name | Oso Sound |
| themeColor | `#2563eb` |
| backgroundColor | `#ffffff` |

## Digital Asset Links

1. Generá el AAB y subilo a Play Console (internal testing).
2. Copiá el SHA-256 del certificado de firma.
3. Reemplazá el valor en `frontend/public/.well-known/assetlinks.json`.
4. Redeploy Vercel.
5. Verificá: https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://TU-DOMINIO.vercel.app&relation=delegate_permission/common.handle_all_urls

## Publicación Play Store

- Cuenta Google Play Developer (USD 25 única vez).
- Política de privacidad (URL pública).
- Capturas de pantalla + icono 512×512.
- Subir `app-release-signed.aab` generado por Bubblewrap.

La app en Play Store carga la web en vivo: cada deploy en Vercel actualiza la experiencia sin republicar (salvo cambios del shell TWA).
