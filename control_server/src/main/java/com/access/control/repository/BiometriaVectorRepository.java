package com.access.control.repository;

import com.access.control.dto.BiometriaMatchDTO;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class BiometriaVectorRepository {

    @Inject
    EntityManager em;

    public Optional<BiometriaMatchDTO> findClosestMatch(float[] embedding, double threshold) {
        if (embedding == null || embedding.length == 0) {
            return Optional.empty();
        }

        String vectorStr = Arrays.toString(embedding);

        String sql = """
            SELECT id, name, last_name, 'EMPLEADO' as tipo, (face_embedding <=> cast(:vector as vector)) as distancia
            FROM empleados
            WHERE face_embedding IS NOT NULL AND (face_embedding <=> cast(:vector as vector)) < :threshold
            UNION ALL
            SELECT id, nombre as name, apellido as last_name, 'CLIENTE' as tipo, (face_embedding <=> cast(:vector as vector)) as distancia
            FROM clientes
            WHERE face_embedding IS NOT NULL AND (face_embedding <=> cast(:vector as vector)) < :threshold
            UNION ALL
            SELECT id, name, last_name, 'VISITANTE' as tipo, (face_embedding <=> cast(:vector as vector)) as distancia
            FROM visitantes
            WHERE face_embedding IS NOT NULL AND (face_embedding <=> cast(:vector as vector)) < :threshold
            ORDER BY distancia ASC
            LIMIT 1
        """;

        try {
            List<?> results = em.createNativeQuery(sql)
                .setParameter("vector", vectorStr)
                .setParameter("threshold", threshold)
                .getResultList();

            if (results.isEmpty()) {
                return Optional.empty();
            }

            Object[] row = (Object[]) results.get(0);
            Long id = ((Number) row[0]).longValue();
            String nombre = (String) row[1];
            String apellido = (String) row[2];
            String tipo = (String) row[3];
            Double distancia = ((Number) row[4]).doubleValue();
            Double confianza = Math.max(0.0, 1.0 - distancia);

            return Optional.of(new BiometriaMatchDTO(id, nombre, apellido, tipo, distancia, confianza));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public void updateFaceEmbedding(String tabla, Long id, float[] embedding) {
        if (embedding == null || embedding.length == 0 || id == null || tabla == null) {
            return;
        }
        String tableName = tabla.toLowerCase().trim();
        if (!tableName.equals("clientes") && !tableName.equals("empleados") && !tableName.equals("visitantes")) {
            return;
        }

        String vectorStr = Arrays.toString(embedding);
        // 1. Try updating as TEXT first (100% works without aborting active JPA transaction)
        try {
            String sqlText = "UPDATE " + tableName + " SET face_embedding = :vector WHERE id = :id";
            em.createNativeQuery(sqlText)
                .setParameter("vector", vectorStr)
                .setParameter("id", id)
                .executeUpdate();
        } catch (Exception e1) {
            // 2. Fallback: Try pgvector cast
            try {
                String sqlVector = "UPDATE " + tableName + " SET face_embedding = cast(:vector as vector) WHERE id = :id";
                em.createNativeQuery(sqlVector)
                    .setParameter("vector", vectorStr)
                    .setParameter("id", id)
                    .executeUpdate();
            } catch (Exception e2) {
                System.err.println("[BiometriaVectorRepository] Error actualizando face_embedding en " + tableName + ": " + e2.getMessage());
            }
        }
    }

    public void updateFaceEmbeddingFromString(String tabla, Long id, String vectorRaw) {
        if (vectorRaw == null || vectorRaw.trim().isEmpty() || id == null || tabla == null) {
            return;
        }
        try {
            float[] vec = parsearEmbedding(vectorRaw);
            if (vec != null) {
                updateFaceEmbedding(tabla, id, vec);
            }
        } catch (Exception ignored) {
        }
    }

    public float[] parsearEmbedding(String vectorRaw) {
        if (vectorRaw == null || vectorRaw.trim().isEmpty()) {
            return null;
        }
        String clean = vectorRaw.trim();
        if (clean.startsWith("[") && clean.endsWith("]")) {
            // Arreglo multi-vector o vector regular
            if (clean.contains("\"")) {
                java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\"([^\"]+)\"");
                java.util.regex.Matcher matcher = pattern.matcher(clean);
                if (matcher.find()) {
                    clean = matcher.group(1);
                }
            } else {
                clean = clean.substring(1, clean.length() - 1);
            }
        }
        String[] parts = clean.split(",");
        if (parts.length == 0) return null;

        float[] arr = new float[512];
        if (parts.length >= 512) {
            for (int i = 0; i < 512; i++) {
                try {
                    arr[i] = Float.parseFloat(parts[i].trim());
                } catch (Exception e) {
                    arr[i] = 0.0f;
                }
            }
        } else {
            // Interpolacion lineal uniforme de N descriptores a 512 dimensiones
            float[] orig = new float[parts.length];
            for (int i = 0; i < parts.length; i++) {
                try {
                    orig[i] = Float.parseFloat(parts[i].trim());
                } catch (Exception e) {
                    orig[i] = 0.0f;
                }
            }
            int n = parts.length;
            for (int i = 0; i < 512; i++) {
                double pos = (i * (n - 1.0)) / 511.0;
                int idx = (int) Math.floor(pos);
                double frac = pos - idx;
                float v1 = orig[idx];
                float v2 = (idx + 1 < n) ? orig[idx + 1] : v1;
                arr[i] = (float) (v1 * (1.0 - frac) + v2 * frac);
            }
        }

        // Normalizacion a norma unitaria L2 (requerida por pgvector cosine)
        double normSq = 0.0;
        for (float v : arr) {
            normSq += (v * v);
        }
        if (normSq > 0.0) {
            float invNorm = (float) (1.0 / Math.sqrt(normSq));
            for (int i = 0; i < 512; i++) {
                arr[i] *= invNorm;
            }
        }

        return arr;
    }
}
