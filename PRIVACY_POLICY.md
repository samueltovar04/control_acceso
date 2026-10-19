# Política de Privacidad y Seguridad de Datos

**Fecha de entrada en vigor:** 19 de Octubre de 2026  
**Aplicación:** Control de Acceso Móvil (`com.controlaccesomobile`)  
**Desarrollador / Entidad:** Control de Acceso S.A. / Andes Sistemas  
**Sitio Web:** [https://acceso.andessistemas.com](https://acceso.andessistemas.com)

---

## 1. Introducción
En **Control de Acceso S.A.** valoramos y respetamos la privacidad de nuestros usuarios. Esta Política de Privacidad describe la forma en que recopilamos, utilizamos, almacenamos y protegemos la información personal y biométrica a través de nuestra aplicación móvil.

## 2. Permisos y Datos Recopilados

### 2.1 Permiso de Cámara y Datos Biométricos
- **Permiso Requerido:** `android.permission.CAMERA`
- **Finalidad:** La cámara frontal es utilizada exclusivamente para la función de **Enrolamiento Facial Multi-Ángulo** y validación biométrica en los torniquetes de acceso.
- **Procesamiento:** Se extraen vectores numéricos de características faciales (embeddings de 512 dimensiones). Las imágenes sin procesar o fotogramas no se comercializan ni se comparten con terceros.

### 2.2 Signos Vitales y Telemetría IoT (Wearable)
- **Datos Recopilados:** Frecuencia cardíaca (BPM), saturación de oxígeno ($SpO_2$) y temperatura corporal (°C).
- **Finalidad:** Proporcionar al usuario un panel de monitoreo de salud personal mientras hace uso de las instalaciones del gimnasio o complejo deportivo.

### 2.3 Información de Identificación y Pagos
- **Datos Recopilados:** Nombre, apellido, cédula/DNI, correo electrónico, número de teléfono y comprobantes de pago adjuntos (para conciliación de membresías).
- **Finalidad:** Autenticación de cuenta, generación del pase digital QR y gestión de cobros y facturación.

## 3. Almacenamiento y Transmisión Segura de Datos
- Todos los datos transmitidos entre la aplicación móvil y los servidores del backend se realizan a través de conexiones cifradas **HTTPS / TLS 1.3** (`https://acceso.andessistemas.com`) y WebSockets Seguros (`wss://acceso.andessistemas.com`).
- Los datos de sesión y tokens de autenticación se almacenan localmente utilizando mecanismos encriptados en el dispositivo (`AsyncStorage` encriptado).

## 4. Compartición de Datos con Terceros
No vendemos, alquilamos ni transferimos bajo ninguna circunstancia los datos personales o biométricos de nuestros usuarios a terceros.

## 5. Derechos de Eliminación de Datos (Derecho al Olvido)
Los usuarios pueden solicitar la eliminación definitiva de su cuenta y vectores biométricos en cualquier momento enviando una solicitud a [soporte@andessistemas.com](mailto:soporte@andessistemas.com) o solicitando la baja en la recepción de la sucursal.

---
© 2026 Control de Acceso S.A. Todos los derechos reservados.
