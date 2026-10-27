package com.access.control.repository;

import com.access.control.model.ConfiguracionFinanciera;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class ConfiguracionFinancieraRepository implements PanacheRepository<ConfiguracionFinanciera> {

    public ConfiguracionFinanciera obtenerConfiguracionActiva() {
        ConfiguracionFinanciera config = find("order by id asc").firstResult();
        if (config == null) {
            config = new ConfiguracionFinanciera();
            persist(config);
        }
        return config;
    }
}
