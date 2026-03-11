# Deploy en Render (Narices Frías)

## 1) Subir el proyecto a GitHub
- Crear un repositorio.
- Subir todo el contenido de esta carpeta.

## 2) Crear servicio en Render
- Entrar a Render: https://render.com
- New + > Blueprint
- Elegir el repo de GitHub.
- Render detecta `render.yaml` automáticamente.

## 3) Configurar variables de entorno
En Render, verificar/editar:
- `APP_USER` (usuario de login)
- `APP_PASS` (contraseña de login)
- `DATA_DIR` (usar `/var/data/narices-frias`)

## 4) Configurar disco persistente (OBLIGATORIO para no perder datos)
- En tu servicio de Render: **Settings > Disks > Add Disk**.
- Mount path: `/var/data`
- Tamaño: `1 GB` (o más, según necesidad)
- Guardar cambios y redeploy.

## 5) Publicar
- Deploy.
- Esperar a que termine la build.
- Abrir la URL pública de Render.

## 6) Importante sobre persistencia
- Si no configurás el disco en `/var/data`, Render puede reiniciar y perder `data.db` y `uploads`.
- Con disco persistente + `DATA_DIR=/var/data/narices-frias`, los registros y fotos se mantienen.

## 7) Uso para APK
- Cuando tengas esta URL pública en `https`, la usamos como backend para compilar la APK.
