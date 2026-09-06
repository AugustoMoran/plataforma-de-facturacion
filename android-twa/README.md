# Oso Sound — App Android (TWA) para Google Play

Esta carpeta contiene la configuración para generar la app Android que abre `https://www.ososoundmusic.com`.

**No se sube a Render ni Vercel.** La compilás en **tu PC** (o Linux/CI) y subís el archivo `.aab` a **Google Play Console**.

### Build automático (Linux / macOS / Cloud Agent)

```bash
cd android-twa
npm install
npm run setup      # Android SDK (solo primera vez)
npm run build      # → output/ososound-release.aab
```

Scripts en `scripts/`: `setup-android-sdk.sh`, `generate-keystore.sh`, `build-release.sh`, `print-sha256.sh`.

---

## Por qué fallaba “Descargar” en el celu

El botón abría Play Store con `com.ososound.app`, pero **la app todavía no está publicada** → Google muestra *“No se encontró el artículo”*.

Hasta publicarla, en el celu usá **Chrome → ⋮ → Instalar app** (PWA). Cuando esté en Play Store, activás `VITE_ANDROID_APP_PUBLISHED=true` en Vercel.

---

## Requisitos en tu PC (Windows)

1. **Node.js 18+** — https://nodejs.org
2. **Android Studio** — incluye Android SDK  
   https://developer.android.com/studio
3. **JDK 17** — Android Studio suele instalarlo

Variables de entorno (Windows, una vez):

```powershell
setx ANDROID_HOME "%LOCALAPPDATA%\Android\Sdk"
setx PATH "%PATH%;%LOCALAPPDATA%\Android\Sdk\platform-tools"
```

Cerrá y abrí la terminal después.

---

## Paso 1 — Clonar / actualizar el repo

```powershell
cd C:\Users\TU_USUARIO\Desktop\trabajos\plataforma-de-facturacion
git pull
cd android-twa
```

---

## Paso 2 — Instalar Bubblewrap

```powershell
npm install -g @bubblewrap/cli
```

---

## Paso 3 — Generar el proyecto Android

Desde la carpeta `android-twa`:

```powershell
bubblewrap update
```

Esto crea los archivos Gradle/Android usando `twa-manifest.json`.

---

## Paso 4 — Crear clave de firma (solo la primera vez)

```powershell
keytool -genkeypair -v -keystore android.keystore -alias ososound -keyalg RSA -keysize 2048 -validity 10000
```

- Guardá la **contraseña** en un lugar seguro (la vas a necesitar siempre).
- **No subas** `android.keystore` a GitHub (ya está en `.gitignore`).

---

## Paso 5 — Compilar el AAB para Play Store

```powershell
$env:BUBBLEWRAP_KEYSTORE_PASSWORD="TU_CONTRASEÑA"
$env:BUBBLEWRAP_KEY_PASSWORD="TU_CONTRASEÑA"
bubblewrap build
```

Archivo generado (subir este a Play Console):

```
android-twa\app-release-bundle.aab
```

(o `app-release-signed.aab` según versión de Bubblewrap — buscá el `.aab` en la carpeta)

---

## Paso 6 — Digital Asset Links (obligatorio)

1. Subí el AAB a Play Console → **Prueba interna**.
2. Copiá el **SHA-256** del certificado de firma (Integridad de la app).
3. Editá en el repo:

   `frontend/public/.well-known/assetlinks.json`

   Reemplazá `REEMPLAZAR_CON_SHA256...` por tu SHA-256.

4. Commit, push y esperá deploy de Vercel.

5. Verificá:

   https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://www.ososoundmusic.com&relation=delegate_permission/common.handle_all_urls

---

## Paso 7 — Subir a Google Play Console

1. https://play.google.com/console
2. **Crear app** → nombre “Oso Sound”, package `com.ososound.app`
3. **Prueba interna** → subir `app-release-bundle.aab`
4. Completar ficha: ícono (`frontend/public/icons/pwa-512.png`), capturas, política de privacidad
5. Enviar a revisión

Cuando esté **publicada**, en Vercel agregá:

```
VITE_ANDROID_APP_PUBLISHED=true
VITE_ANDROID_APP_URL=https://play.google.com/store/apps/details?id=com.ososound.app
```

---

## ¿Dónde se “aloja” la app?

| Parte | Dónde vive |
|-------|------------|
| Web / catálogo | Vercel (`www.ososoundmusic.com`) |
| API | Render |
| App Android (TWA) | **Google Play** (archivo `.aab` que compilás vos) |

La app en Play Store no duplica la web: es un acceso directo a tu sitio en pantalla completa. Cada deploy en Vercel actualiza lo que ven los usuarios **sin** volver a subir el AAB (salvo cambios del shell Android).

---

## Script rápido (Windows)

```powershell
.\build-android.ps1
```

Te pide la contraseña del keystore y genera el AAB.

---

## Problemas frecuentes

| Error | Solución |
|-------|----------|
| No se encontró el artículo (Play Store) | La app no está publicada aún — usá instalación PWA o terminá Play Console |
| Bubblewrap pide JDK | Instalá Android Studio y JDK 17 |
| Asset links falla | SHA-256 incorrecto o Vercel no desplegó `assetlinks.json` |
| App abre navegador normal | Falta assetlinks.json o SHA no coincide con el AAB |
