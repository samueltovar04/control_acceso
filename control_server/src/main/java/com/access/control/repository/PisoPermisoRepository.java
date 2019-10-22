package com.access.control.repository;

import com.access.control.model.PisoPermiso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository("pisoPermisoRepository")
public interface PisoPermisoRepository extends JpaRepository<PisoPermiso, Long> {
}
