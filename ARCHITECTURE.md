# ARCHITECTURE.md - Architecture & Design Decisions

## 1. Diseno Arquitectonico Global
El sistema opera bajo principios de Clean Architecture y microservicios desacoplados:
- **Core Access Control**: Backend Quarkus 3.x (Java 17) con base de datos PostgreSQL 15 para control relacional de usuarios, credenciales, membresias y torniquetes.
- **Biomedical Telemetry**: Modulo IoT NoSQL desacoplado montado sobre MongoDB 6.0 (`biotrack_mongo`) para almacenamiento y streaming en tiempo real de constantes vitales.
- **Frontend SPA**: Angular 17 servido via Nginx con proxy reverso y componentes modulares.
- **Edge Hardware Integration**: Puentes y daemons de hardware locales que comunican con puertos fisicos USB y red local sin contaminar el dominio central.

---

## 2. Aislamiento de Dependencias Binarias de Hardware (`infrastructure/libs/`)

### Decision Arquitectonica
Para la integracion de drivers y SDKs biometricos propietarios (especificamente el Suprema BioMini SDK v3.8.0.2364 y su biblioteca de enlace dinamico `libUFScanner.dylib` para macOS), se establece una politica estricta de aislamiento de binarios nativos bajo la capa de infraestructura:
```
infrastructure/
└── libs/
    └── mac/
        ├── libUFScanner.dylib
        └── INSTRUCCIONES.md
```

### Justificacion y Principios:
1. **Clean Architecture (Dependency Rule):**
   - Los componentes de dominio y aplicacion no dependen de librerias C/C++ ni de rutas absolutas del sistema operativo (`/usr/local/lib` o `/System/Library`).
   - El puente de integracion de hardware (`BioMiniScanner`) localiza dinamicamente el binario relativo a la raiz del repositorio (`pathlib.Path`), permitiendo que el proyecto sea portable e independiente del entorno de maquina del desarrollador.
2. **Resiliencia de Despliegue y Fallback:**
   - La inclusion del SDK nativo requiere licencia o acceso de partner de Suprema.
   - El wrapper en Python implementa el patron de carga dinamica segura con Context Manager (`with ...`). Si el binario `.dylib` no esta presente en `infrastructure/libs/mac/`, el sistema realiza fallback transparente a la emulacion de hardware de alta fidelidad basada en descriptores USB del kernel de macOS (`ioreg`), evitando roturas de build o ejecucion.
3. **Control de Versionado y Seguridad:**
   - Los binarios propietarios no se comitean sin autorizacion de licencia y permanecen encapsulados en `infrastructure/libs/`.
   - Se provee documentacion tecnica de provisionamiento en `INSTRUCCIONES.md` dentro de la carpeta contenedora.
