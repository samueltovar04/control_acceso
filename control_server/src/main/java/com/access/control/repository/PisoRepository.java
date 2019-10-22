package com.access.control.repository;

import com.access.control.model.Piso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository("pisoRepository")
public interface PisoRepository extends JpaRepository<Piso, Long> {

    @Query("SELECT p FROM Piso p WHERE piso = :piso")
    Piso findByPiso(@Param("piso") String piso);
    @Query("SELECT p FROM Piso p WHERE area = :area")
    List<Piso> findByArea(@Param("area") String area);
}
