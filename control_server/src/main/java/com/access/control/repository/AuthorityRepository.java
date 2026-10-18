package com.access.control.repository;

import com.access.control.model.Authority;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class AuthorityRepository implements PanacheRepository<Authority> {

    public Authority findByName(String name) {
        return find("name", name).firstResult();
    }
}
