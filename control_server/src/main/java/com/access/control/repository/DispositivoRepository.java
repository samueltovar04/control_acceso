package com.access.control.repository;

import com.access.control.model.Dispositivo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository("dispositivoRepository")
public interface DispositivoRepository extends JpaRepository<Dispositivo, Long> {
    @Query("SELECT d FROM Dispositivo d WHERE d.state=:estado")
    List<Dispositivo> findAllDispositivosEnabled(@Param("estado") Integer estado);
}
