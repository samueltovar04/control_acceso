package com.access.control.services;

import com.access.control.dto.UserDTO;
import com.access.control.model.AuditoriaAcceso;
import com.access.control.model.SesionActiva;
import com.access.control.model.User;
import java.util.List;

public interface UsuarioService {
    List<UserDTO> listarUsuarios();
    UserDTO obtenerPorId(Long id);
    UserDTO crearUsuario(UserDTO dto);
    UserDTO actualizarUsuario(Long id, UserDTO dto);
    boolean cambiarEstado(Long id, boolean enabled);
    boolean forzarReseteoPassword(Long id);
    boolean cambiarPassword(String username, String currentPassword, String newPassword);
    
    // Auditoria y sesiones
    void registrarAuditoria(String username, Long userId, Long sedeId, String sedeNombre,
                            String ip, String userAgent, String accion, String estado, String detalles);
    void registrarSesionActiva(Long userId, String username, String ip, String userAgent, Long sedeId, String sedeNombre);
    List<AuditoriaAcceso> listarAuditoria(int limit);
    List<SesionActiva> listarSesionesActivas();
    boolean revocarSesion(Long sesionId);
    void revocarSesionPorUsername(String username, String ip, String userAgent);
}
