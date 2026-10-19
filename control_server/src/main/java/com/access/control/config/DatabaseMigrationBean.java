package com.access.control.config;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

@ApplicationScoped
public class DatabaseMigrationBean {

    private static final Logger LOG = Logger.getLogger(DatabaseMigrationBean.class);

    @Inject
    EntityManager em;

    @Transactional
    public void onStart(@Observes StartupEvent ev) {
        LOG.info("Ejecutando verificacion DDL delta en PostgreSQL para columnas de clientes...");
        try {
            em.createNativeQuery("ALTER TABLE clientes ALTER COLUMN foto TYPE TEXT").executeUpdate();
            em.createNativeQuery("ALTER TABLE clientes ALTER COLUMN face_vector TYPE TEXT").executeUpdate();
            em.createNativeQuery("ALTER TABLE clientes ALTER COLUMN huella1 TYPE TEXT").executeUpdate();
            em.createNativeQuery("ALTER TABLE clientes ALTER COLUMN huella2 TYPE TEXT").executeUpdate();
            LOG.info("Verificacion DDL delta de columnas clientes completada exitosamente.");
        } catch (Exception e) {
            LOG.warn("Aviso DDL delta clientes: " + e.getMessage());
        }
    }
}
