package com.access.control.repository;

import com.access.control.model.PisoPermisoVisita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository("pisoPermisoVisitaRepository")
public interface PisoPermisoVisitaRepository extends JpaRepository<PisoPermisoVisita, Long> {
}
