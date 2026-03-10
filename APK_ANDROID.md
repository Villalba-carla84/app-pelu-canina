# APK Android con contactos (Capacitor)

Este proyecto ya incluye dependencias y configuración base para empaquetar la app como APK Android y usar el selector nativo de contactos.

## 1) Requisitos

- Node.js **20 o superior** (recomendado LTS 20).
- Android Studio instalado.
- SDK de Android y emulador/dispositivo configurados.

> Nota: en este entorno la CLI detectó Node 18, por eso `cap add android` no pudo ejecutarse aquí.

## 2) Configurar URL de tu app

Editá [capacitor.config.json](capacitor.config.json) y reemplazá:

- `server.url: "https://TU-APP.onrender.com"`

por la URL real de tu app desplegada en Render.

No cambies `webDir` (debe quedar en `www`) para evitar errores de sincronización de Capacitor.

## 3) Inicializar Android (una sola vez)

```bash
npm run cap:add:android
```

Esto crea la carpeta `android/`.

## 4) Sincronizar cambios

Cada vez que cambies configuración/plugins:

```bash
npm run cap:sync
```

## 5) Abrir en Android Studio

```bash
npm run cap:open
```

En Android Studio:

- Esperá sync de Gradle.
- Elegí dispositivo/emulador.
- Ejecutá Run.

## 6) Generar APK

En Android Studio:

- Build > Build Bundle(s) / APK(s) > Build APK(s)

Luego Android Studio muestra el enlace al archivo APK generado.

## 7) Contactos en Android

La app ya intenta este orden al tocar **Elegir contacto**:

1. Selector nativo de Capacitor (APK Android).
2. Contact Picker del navegador (si existe).
3. Carga manual del teléfono.

Si el permiso de contactos se rechaza, se muestra un mensaje claro y podés seguir cargando manualmente.

## 8) Error común: `JAVA_HOME is not set`

Si al ejecutar o compilar en Android Studio aparece este error, usá el Java que trae Android Studio:

1. En Android Studio: `File > Settings > Build, Execution, Deployment > Build Tools > Gradle`.
2. En **Gradle JDK**, elegí **Embedded JDK (jbr)**.
3. Aplicá cambios y corré **Sync Project with Gradle Files**.

Opcional por terminal (solo sesión actual de PowerShell):

```powershell
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
$env:Path="$env:JAVA_HOME\bin;$env:Path"
```

Luego compilá:

```bash
cd android
./gradlew.bat assembleDebug
```
