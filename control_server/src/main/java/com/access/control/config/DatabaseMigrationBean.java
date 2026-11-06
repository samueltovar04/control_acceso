package com.access.control.config;

import com.access.control.model.Authority;
import com.access.control.model.User;
import com.access.control.repository.AuthorityRepository;
import com.access.control.repository.UserRepository;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;
import org.mindrot.jbcrypt.BCrypt;

import java.util.HashSet;
import java.util.Set;

@ApplicationScoped
public class DatabaseMigrationBean {

    private static final Logger LOG = Logger.getLogger(DatabaseMigrationBean.class);

    @Inject
    EntityManager em;

    @Inject
    UserRepository userRepository;

    @Inject
    AuthorityRepository authorityRepository;

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

        asegurarUsuariosAdministrativos();
    }

    private void asegurarUsuariosAdministrativos() {
        try {
            Authority authSuper = authorityRepository.findByName("ROLE_SUPER_ADMIN");
            if (authSuper == null) {
                authSuper = new Authority();
                authSuper.setName("ROLE_SUPER_ADMIN");
                authSuper.setState(1);
                authorityRepository.persist(authSuper);
            }

            Authority authAdmin = authorityRepository.findByName("ROLE_ADMIN");
            if (authAdmin == null) {
                authAdmin = new Authority();
                authAdmin.setName("ROLE_ADMIN");
                authAdmin.setState(1);
                authorityRepository.persist(authAdmin);
            }

            String hashAdmin123 = BCrypt.hashpw("Admin123!", BCrypt.gensalt(10));

            // 1. Asegurar superadmin
            User superadmin = userRepository.findByUsername("superadmin");
            if (superadmin == null) {
                superadmin = new User();
                superadmin.setUsername("superadmin");
                superadmin.setEmail("superadmin@controlacceso.com");
                superadmin.setNombreCompleto("Super Administrador del Sistema");
                superadmin.setPassword(hashAdmin123);
                superadmin.setEnabled(true);
                superadmin.setRequiresPasswordReset(false);
                Set<Authority> auths = new HashSet<>();
                auths.add(authSuper);
                auths.add(authAdmin);
                superadmin.setAuthorities(auths);
                userRepository.persist(superadmin);
                LOG.info("Usuario superadmin creado exitosamente.");
            } else {
                superadmin.setEnabled(true);
                superadmin.setRequiresPasswordReset(false);
                if (!superadmin.getPassword().startsWith("$2a$") && !superadmin.getPassword().startsWith("$2b$")) {
                    superadmin.setPassword(hashAdmin123);
                }
                if (superadmin.getAuthorities() == null) {
                    superadmin.setAuthorities(new HashSet<>());
                }
                superadmin.getAuthorities().add(authSuper);
                superadmin.getAuthorities().add(authAdmin);
                userRepository.persist(superadmin);
                LOG.info("Usuario superadmin verificado y actualizado con BCrypt.");
            }

            // 2. Asegurar admin
            User adminUser = userRepository.findByUsername("admin");
            if (adminUser == null) {
                adminUser = new User();
                adminUser.setUsername("admin");
                adminUser.setEmail("admin@controlacceso.com");
                adminUser.setNombreCompleto("Administrador General");
                adminUser.setPassword(hashAdmin123);
                adminUser.setEnabled(true);
                adminUser.setRequiresPasswordReset(false);
                Set<Authority> auths = new HashSet<>();
                auths.add(authAdmin);
                adminUser.setAuthorities(auths);
                userRepository.persist(adminUser);
                LOG.info("Usuario admin creado exitosamente con rol ROLE_ADMIN.");
            } else {
                adminUser.setEnabled(true);
                adminUser.setRequiresPasswordReset(false);
                if (adminUser.getAuthorities() == null) {
                    adminUser.setAuthorities(new HashSet<>());
                }
                adminUser.getAuthorities().add(authAdmin);
                userRepository.persist(adminUser);
                LOG.info("Usuario admin verificado y actualizado.");
            }

            // 3. Desvincular usuarios administradores de la tabla clientes para evitar degradacion de perfil
            try {
                em.createNativeQuery("UPDATE clientes SET user_id = NULL WHERE user_id IN (SELECT id FROM users WHERE username IN ('superadmin', 'admin'))").executeUpdate();
            } catch (Exception ignored) {}

        } catch (Exception e) {
            LOG.error("Error al asegurar usuarios administrativos: " + e.getMessage(), e);
        }
    }
}
