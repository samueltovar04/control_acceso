package com.access.control.repository;

import com.access.control.model.PisoVisita;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository("pisovisitaRepository")
public interface PisoVisitaRepository extends JpaRepository<PisoVisita, Long> {

    @Query("SELECT p FROM PisoVisita p WHERE piso = :piso")
    PisoVisita findByPiso(@Param("piso") String piso);
    @Query("SELECT p FROM PisoVisita p WHERE area = :area")
    List<PisoVisita> findByArea(@Param("area") String area);
    @Query("SELECT p FROM PisoVisita p WHERE state = :state")
    List<PisoVisita> findAllState(@Param("state") Integer state);
}
