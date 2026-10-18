package com.access.control.model;

import com.access.control.model.generic.AbstractEntity;
import jakarta.persistence.*;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
public class User extends AbstractEntity {

    @Column(unique = true, nullable = false)
    private String username;

    private String password;

    private Boolean enabled = true;

    @Column(name = "requires_password_reset")
    private Boolean requiresPasswordReset = false;

    @Column(name = "email")
    private String email;

    @Column(name = "nombre_completo")
    private String nombreCompleto;

    @Column(name = "last_login")
    @Temporal(TemporalType.TIMESTAMP)
    private Date lastLogin;

    @ManyToOne
    @JoinColumn(name = "sede_id")
    private Sede sede;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "user_authorities",
        joinColumns = @JoinColumn(name = "user_id"),
        inverseJoinColumns = @JoinColumn(name = "authority_id")
    )
    private Set<Authority> authorities = new HashSet<>();

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Boolean getEnabled() {
        return enabled;
    }

    public void setEnabled(Boolean enabled) {
        this.enabled = enabled;
    }

    public Boolean getRequiresPasswordReset() {
        return requiresPasswordReset != null ? requiresPasswordReset : false;
    }

    public void setRequiresPasswordReset(Boolean requiresPasswordReset) {
        this.requiresPasswordReset = requiresPasswordReset;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getNombreCompleto() {
        return nombreCompleto;
    }

    public void setNombreCompleto(String nombreCompleto) {
        this.nombreCompleto = nombreCompleto;
    }

    public Date getLastLogin() {
        return lastLogin;
    }

    public void setLastLogin(Date lastLogin) {
        this.lastLogin = lastLogin;
    }

    public Sede getSede() {
        return sede;
    }

    public void setSede(Sede sede) {
        this.sede = sede;
    }

    public Set<Authority> getAuthorities() {
        return authorities;
    }

    public void setAuthorities(Set<Authority> authorities) {
        this.authorities = authorities;
    }

    public boolean isAdminOrSuperAdmin() {
        if (authorities == null) return false;
        for (Authority auth : authorities) {
            if (auth != null && auth.getName() != null) {
                String name = auth.getName().trim().toUpperCase();
                if (name.equals("ROLE_ADMIN") || name.equals("ROLE_SUPER_ADMIN") ||
                    name.equals("ADMIN") || name.equals("SUPER_ADMIN") || name.equals("SUPERADMIN")) {
                    return true;
                }
            }
        }
        return false;
    }
}
