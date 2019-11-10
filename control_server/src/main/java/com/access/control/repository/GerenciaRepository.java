package com.access.control.repository;

import com.access.control.model.Gerencia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GerenciaRepository  extends JpaRepository<Gerencia, Long> {
}
