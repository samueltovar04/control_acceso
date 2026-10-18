package com.access.control.dto;

import java.util.Date;
import java.util.Set;

public class UserDTO {
    public Long id;
    public String username;
    public String email;
    public String nombreCompleto;
    public Boolean enabled;
    public Boolean requiresPasswordReset;
    public Date lastLogin;
    public Long sedeId;
    public String sedeNombre;
    public Set<String> roles;
    public String password; // Solo para creacion o reseteo
}
