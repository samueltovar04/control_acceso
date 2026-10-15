-- ====================================================================
-- Script de Migracion Delta: Membresias, Tasas BCV y Control de Acceso
-- ====================================================================

-- 1. Columnas delta sobre la tabla clientes existente
ALTER TABLE clientes 
    ADD COLUMN IF NOT EXISTS qr_token_dinamico VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS fecha_vencimiento_membresia DATE NULL,
    ADD COLUMN IF NOT EXISTS fecha_proximo_cobro DATE NULL,
    ADD COLUMN IF NOT EXISTS membresia_actual_id BIGINT NULL REFERENCES membresias(id),
    ADD COLUMN IF NOT EXISTS comprobante_pendiente_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS dias_gracia_usados INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS congelado_hasta DATE NULL;

CREATE INDEX IF NOT EXISTS idx_clientes_documento_estado ON clientes(documento, estado_suscripcion);
CREATE INDEX IF NOT EXISTS idx_clientes_insignia_estado ON clientes(codigo_insignia, estado_suscripcion);
CREATE INDEX IF NOT EXISTS idx_clientes_qr ON clientes(qr_token_dinamico);

-- 2. Registro historico diario de tasas BCV
CREATE TABLE IF NOT EXISTS tasa_cambio (
    id BIGSERIAL PRIMARY KEY,
    moneda_origen VARCHAR(3) NOT NULL DEFAULT 'USD',
    moneda_destino VARCHAR(3) NOT NULL DEFAULT 'VES',
    valor NUMERIC(14, 4) NOT NULL,
    fecha_vigencia DATE NOT NULL,
    fecha_captura TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    origen_captura VARCHAR(50) NOT NULL DEFAULT 'BCV_SCRAPER_AUTO',
    usuario_id BIGINT NULL,
    CONSTRAINT uq_tasa_diaria UNIQUE (moneda_origen, moneda_destino, fecha_vigencia)
);
CREATE INDEX IF NOT EXISTS idx_tasa_vigencia ON tasa_cambio(fecha_vigencia DESC);

-- 3. Configuracion financiera del gimnasio
CREATE TABLE IF NOT EXISTS configuracion_financiera (
    id BIGSERIAL PRIMARY KEY,
    moneda_base VARCHAR(3) NOT NULL DEFAULT 'USD',
    moneda_equivalencia_defecto VARCHAR(3) NOT NULL DEFAULT 'VES',
    regla_redondeo VARCHAR(20) NOT NULL DEFAULT 'HALF_UP',
    decimales_fijacion INT NOT NULL DEFAULT 2,
    margen_tolerancia_pago_ves NUMERIC(10, 2) NOT NULL DEFAULT 0.50,
    dias_gracia_conciliacion INT NOT NULL DEFAULT 2,
    actualizado_el TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Ampliar tabla pagos para soporte multimoneda y antifraude
ALTER TABLE pagos
    ADD COLUMN IF NOT EXISTS moneda_declarada VARCHAR(3) NOT NULL DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS tasa_bcv_aplicada NUMERIC(14, 4) NOT NULL DEFAULT 1.0000,
    ADD COLUMN IF NOT EXISTS monto_equivalente_ves NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS comprobante_sha256 VARCHAR(64) NULL,
    ADD COLUMN IF NOT EXISTS usuario_concilia_id BIGINT NULL,
    ADD COLUMN IF NOT EXISTS fecha_conciliacion TIMESTAMP WITHOUT TIME ZONE NULL,
    ADD COLUMN IF NOT EXISTS motivo_rechazo VARCHAR(255) NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_pago_referencia_banco ON pagos(metodo_pago, numero_referencia, fecha_pago);
CREATE INDEX IF NOT EXISTS idx_pagos_sha256 ON pagos(comprobante_sha256);
