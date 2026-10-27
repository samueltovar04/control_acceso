package com.access.control.repository;

import com.access.control.model.User;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class UserRepository implements PanacheRepository<User> {
    public User findByUsername(String username) {
        if (username == null) return null;
        String val = username.trim().toLowerCase();
        return find("lower(username) = ?1 or lower(email) = ?1", val).firstResult();
    }

    public User findByEmail(String email) {
        if (email == null) return null;
        return find("lower(email) = ?1", email.trim().toLowerCase()).firstResult();
    }
}
