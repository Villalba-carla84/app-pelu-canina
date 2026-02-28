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
- `DATA_DIR` (dejar `/opt/render/project/src/data` para empezar)

## 4) Publicar
- Deploy.
- Esperar a que termine la build.
- Abrir la URL pública de Render.

## 5) Importante sobre persistencia
- En plan free, el disco puede ser efímero según configuración y reinicios.
- Para datos permanentes reales (fotos y base), usar disco persistente de Render o migrar DB a un servicio externo.

## 6) Uso para APK
- Cuando tengas esta URL pública en `https`, la usamos como backend para compilar la APK.
