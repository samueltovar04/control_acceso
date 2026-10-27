package com.access.control.services;

import com.access.control.model.Cliente;
import com.access.control.model.Empleado;
import com.access.control.model.Dispositivo;
import com.access.control.model.Piso;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class AccessValidationStrategy {

    public static class ValidationResult {
        private final boolean concedido;
        private final String motivo;

        public ValidationResult(boolean concedido, String motivo) {
            this.concedido = concedido;
            this.motivo = motivo;
        }

        public boolean isConcedido() {
            return concedido;
        }

        public String getMotivo() {
            return motivo;
        }
    }

    public ValidationResult validarCliente(Cliente cliente, Dispositivo dispositivo) {
        if (cliente == null) {
            return new ValidationResult(false, "CLIENTE_NO_REGISTRADO");
        }

        // 1. Validar estado de membresia y pagos
        if ("VENCIDA".equalsIgnoreCase(cliente.getEstadoSuscripcion()) || 
            "SUSPENDIDA".equalsIgnoreCase(cliente.getEstadoSuscripcion()) ||
            "SIN_MEMBRESIA".equalsIgnoreCase(cliente.getEstadoSuscripcion())) {
            return new ValidationResult(false, "FALTA_DE_PAGO: Membresia " + cliente.getEstadoSuscripcion() + ". Pase a recepcion.");
        }

        // 2. Validar piso permitido
        if (dispositivo != null && dispositivo.getPiso() != null) {
            List<Piso> permitidos = cliente.getPisosPermitidos();
            if (permitidos != null && !permitidos.isEmpty()) {
                boolean pisoAutorizado = permitidos.stream()
                        .anyMatch(p -> p.getId().equals(dispositivo.getPiso().getId()));
                if (!pisoAutorizado) {
                    return new ValidationResult(false, "PISO_NO_AUTORIZADO: No tiene acceso al piso " + dispositivo.getPiso().getNumeroPiso());
                }
            }
        }

        return new ValidationResult(true, "ACCESO_AUTORIZADO");
    }

    public ValidationResult validarEmpleado(Empleado empleado, Dispositivo dispositivo) {
        if (empleado == null) {
            return new ValidationResult(false, "EMPLEADO_NO_REGISTRADO");
        }

        // Validar pisos permitidos
        if (dispositivo != null && dispositivo.getPiso() != null) {
            List<Piso> permitidos = empleado.getPisosPermitidos();
            if (permitidos != null && !permitidos.isEmpty()) {
                boolean pisoAutorizado = permitidos.stream()
                        .anyMatch(p -> p.getId().equals(dispositivo.getPiso().getId()));
                if (!pisoAutorizado) {
                    return new ValidationResult(false, "PISO_NO_AUTORIZADO: El empleado no tiene acceso al piso " + dispositivo.getPiso().getNumeroPiso());
                }
            }
        }

        return new ValidationResult(true, "ACCESO_EMPLEADO_AUTORIZADO");
    }
}
