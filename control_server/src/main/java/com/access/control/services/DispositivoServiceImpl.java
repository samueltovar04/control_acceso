package com.access.control.services;

import com.access.control.model.Dispositivo;
import com.access.control.repository.DispositivoRepository;
import com.access.control.dto.DispositivoEscaneoDTO;
import com.access.control.dto.DispositivoDescubiertoDTO;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.InputStreamReader;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@ApplicationScoped
public class DispositivoServiceImpl implements DispositivoService {

    @Inject
    DispositivoRepository dispositivoRepository;

    @Inject
    com.access.control.repository.PisoRepository pisoRepository;

    @Override
    public Dispositivo getDispositivoById(Long id) {
        return dispositivoRepository.findById(id);
    }

    @Override
    public List<Dispositivo> getListDispositivos() {
        return dispositivoRepository.listAll();
    }

    @Override
    public List<Dispositivo> findAllEnabled() {
        return dispositivoRepository.list("state = 1");
    }

    @Override
    @Transactional
    public Dispositivo addDispositivo(Dispositivo dispositivo) {
        if (dispositivo.getState() == null) {
            dispositivo.setState(1);
        }
        if (dispositivo.getTipoDispositivo() == null) {
            dispositivo.setTipoDispositivo(inferirTipoPorDefecto(dispositivo));
        }
        if (dispositivo.getSistemaOperativo() == null) {
            dispositivo.setSistemaOperativo(inferirSOPorDefecto(dispositivo));
        }
        if (dispositivo.getPisoId() != null) {
            dispositivo.setPiso(pisoRepository.findById(dispositivo.getPisoId()));
        } else if (dispositivo.getPiso() != null && dispositivo.getPiso().getId() != null) {
            dispositivo.setPiso(pisoRepository.findById(dispositivo.getPiso().getId()));
        }
        dispositivoRepository.persist(dispositivo);
        return dispositivo;
    }

    @Override
    @Transactional
    public Dispositivo updateDispositivo(Dispositivo dispositivo, Long id) {
        Dispositivo d = dispositivoRepository.findById(id);
        if (d != null) {
            String desc = (dispositivo.getDescripcion() != null && !dispositivo.getDescripcion().trim().isEmpty())
                    ? dispositivo.getDescripcion()
                    : dispositivo.getNombre();
            if (desc != null) {
                d.setDescripcion(desc);
            }
            if (dispositivo.getIp() != null) {
                d.setIp(dispositivo.getIp());
            }
            if (dispositivo.getPort() != null) {
                d.setPort(dispositivo.getPort());
            }
            if (dispositivo.getEntradaSalida() != null) {
                d.setEntradaSalida(dispositivo.getEntradaSalida());
            }
            if (dispositivo.getPing() != null) {
                d.setPing(dispositivo.getPing());
            }

            Long targetPisoId = dispositivo.getPisoId();
            if (targetPisoId == null && dispositivo.getPiso() != null && dispositivo.getPiso().getId() != null) {
                targetPisoId = dispositivo.getPiso().getId();
            }
            if (targetPisoId != null) {
                d.setPiso(pisoRepository.findById(targetPisoId));
            } else if (dispositivo.getPiso() == null && dispositivo.getPisoId() == null) {
                d.setPiso(null);
            }

            if (dispositivo.getState() != null) {
                d.setState(dispositivo.getState());
            }
            String tipo = (dispositivo.getTipoDispositivo() != null && !dispositivo.getTipoDispositivo().trim().isEmpty())
                    ? dispositivo.getTipoDispositivo()
                    : dispositivo.getTipo();
            if (tipo != null) {
                d.setTipoDispositivo(tipo);
            }
            if (dispositivo.getSistemaOperativo() != null) {
                d.setSistemaOperativo(dispositivo.getSistemaOperativo());
            }
            if (dispositivo.getRuta() != null) {
                d.setRuta(dispositivo.getRuta());
            }
        }
        return d;
    }

    @Override
    @Transactional
    public Dispositivo toggleState(Long id) {
        Dispositivo d = dispositivoRepository.findById(id);
        if (d != null) {
            int currentState = d.getState() != null ? d.getState() : 0;
            d.setState(currentState == 1 ? 0 : 1);
            if (d.getState() == 0) {
                d.setPing(false);
            }
        }
        return d;
    }

    @Override
    @Transactional
    public boolean deleteDispositivo(Dispositivo dispositivo) {
        if (dispositivo != null && dispositivo.getId() != null) {
            return dispositivoRepository.deleteById(dispositivo.getId());
        }
        return false;
    }

    @Override
    @Transactional
    public boolean checkPing(Dispositivo d) {
        if (d == null || d.getIp() == null || d.getIp().trim().isEmpty()) {
            return false;
        }
        boolean reachable = false;
        try {
            InetAddress address = InetAddress.getByName(d.getIp().trim());
            reachable = address.isReachable(600);
            if (!reachable) {
                int port = (d.getPort() != null && d.getPort() > 0) ? d.getPort() : 80;
                try (Socket socket = new Socket()) {
                    socket.connect(new InetSocketAddress(address, port), 600);
                    reachable = true;
                } catch (Exception ignored) {
                }
            }
        } catch (Exception e) {
            reachable = false;
        }
        d.setPing(reachable);
        return reachable;
    }

    @Override
    @Transactional
    public List<Dispositivo> pingAllDispositivos() {
        List<Dispositivo> list = dispositivoRepository.listAll();
        for (Dispositivo d : list) {
            if (d.getTipoDispositivo() == null) {
                d.setTipoDispositivo(inferirTipoPorDefecto(d));
            }
            if (d.getSistemaOperativo() == null) {
                d.setSistemaOperativo(inferirSOPorDefecto(d));
            }
            if (d.getState() != null && d.getState() == 1) {
                checkPing(d);
            } else {
                d.setPing(false);
            }
        }
        return list;
    }

    @Override
    @Transactional
    public DispositivoEscaneoDTO escanearDispositivo(Long id) {
        Dispositivo d = dispositivoRepository.findById(id);
        if (d == null) {
            return null;
        }

        DispositivoEscaneoDTO dto = new DispositivoEscaneoDTO();
        dto.setId(d.getId());
        dto.setDescripcion(d.getDescripcion());
        String rawIp = d.getIp() != null ? d.getIp().trim().replace(',', '.') : "";
        dto.setIp(rawIp);
        dto.setPort(d.getPort() != null ? d.getPort() : 80);

        long start = System.currentTimeMillis();
        boolean isOnline = false;

        int mainPort = (d.getPort() != null && d.getPort() > 0) ? d.getPort() : 80;
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(rawIp, mainPort), 450);
            isOnline = true;
        } catch (Exception e) {
            try {
                InetAddress addr = InetAddress.getByName(rawIp);
                isOnline = addr.isReachable(600);
            } catch (Exception ex) {
                isOnline = false;
            }
        }

        long latencia = System.currentTimeMillis() - start;
        dto.setOnline(isOnline);
        dto.setLatenciaMs(isOnline ? Math.max(latencia, 1) : 0);

        String hostname = rawIp;
        if (isOnline) {
            try {
                InetAddress addr = InetAddress.getByName(rawIp);
                String h = addr.getCanonicalHostName();
                if (h != null && !h.isEmpty() && !h.equals(rawIp)) {
                    hostname = h;
                }
            } catch (Exception ignored) {
            }
        }
        dto.setHostname(hostname);

        String mac = resolverMac(rawIp);
        if (mac != null && !mac.isEmpty()) {
            dto.setMac(mac);
            dto.setFabricante(resolverFabricante(mac));
        } else {
            dto.setMac(isOnline ? "No resuelta en cache ARP local" : "Inalcanzable (Host Offline)");
            dto.setFabricante(isOnline ? "No disponible (Sin entrada ARP)" : "No detectable");
        }

        List<Integer> puertosDetectados = new ArrayList<>();
        Map<String, String> servicios = new LinkedHashMap<>();

        if (isOnline) {
            int[] puertosComunes = { 22, 23, 53, 80, 443, 554, 3001, 4370, 8000, 8080 };
            for (int p : puertosComunes) {
                if (testPuerto(rawIp, p, 350)) {
                    puertosDetectados.add(p);
                    servicios.put(String.valueOf(p), identificarServicio(p));
                }
            }
            if (d.getPort() != null && d.getPort() > 0 && !puertosDetectados.contains(d.getPort())) {
                if (testPuerto(rawIp, d.getPort(), 350)) {
                    puertosDetectados.add(d.getPort());
                    servicios.put(String.valueOf(d.getPort()), identificarServicio(d.getPort()));
                }
            }
        }
        dto.setPuertosAbiertos(puertosDetectados);
        dto.setServiciosDetectados(servicios);

        String bannerHttp = null;
        if (puertosDetectados.contains(80)) {
            bannerHttp = obtenerBannerHttp(rawIp, 80);
        } else if (puertosDetectados.contains(8080)) {
            bannerHttp = obtenerBannerHttp(rawIp, 8080);
        } else if (puertosDetectados.contains(443)) {
            bannerHttp = obtenerBannerHttp(rawIp, 443);
        }

        String bannerSsh = null;
        if (puertosDetectados.contains(22)) {
            bannerSsh = obtenerBannerSsh(rawIp);
        }

        inferirTipoYSO(dto, bannerHttp, bannerSsh);
        d.setPing(dto.getOnline());

        dto.setFechaEscaneo(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        return dto;
    }

    private String obtenerBannerHttp(String ip, int port) {
        try {
            java.net.URL url = java.net.URI.create("http://" + ip + ":" + port + "/").toURL();
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(400);
            conn.setReadTimeout(400);
            conn.setRequestMethod("GET");
            conn.connect();
            String server = conn.getHeaderField("Server");
            if (server != null && !server.isEmpty()) {
                return server;
            }
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
                String line;
                int count = 0;
                while ((line = reader.readLine()) != null && count < 25) {
                    if (line.toLowerCase().contains("<title>")) {
                        int start = line.toLowerCase().indexOf("<title>") + 7;
                        int end = line.toLowerCase().indexOf("</title>", start);
                        if (end > start) {
                            return line.substring(start, end).trim();
                        }
                    }
                    count++;
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private String obtenerBannerSsh(String ip) {
        try (Socket s = new Socket()) {
            s.connect(new InetSocketAddress(ip, 22), 400);
            s.setSoTimeout(400);
            BufferedReader reader = new BufferedReader(new InputStreamReader(s.getInputStream()));
            String banner = reader.readLine();
            if (banner != null && banner.startsWith("SSH-")) {
                return banner.trim();
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private String resolverMac(String ip) {
        if (ip == null || ip.isEmpty()) return null;

        File hostArp = new File("/host_tmp/host_arp.txt");
        if (hostArp.exists() && hostArp.canRead()) {
            String mac = parsearArpMac(hostArp, ip);
            if (mac != null) return mac;
        }

        File localTmpArp = new File("/tmp/host_arp.txt");
        if (localTmpArp.exists() && localTmpArp.canRead()) {
            String mac = parsearArpMac(localTmpArp, ip);
            if (mac != null) return mac;
        }

        File procArp = new File("/proc/net/arp");
        if (procArp.exists() && procArp.canRead()) {
            try (BufferedReader br = new BufferedReader(new FileReader(procArp))) {
                String line;
                while ((line = br.readLine()) != null) {
                    String[] tokens = line.trim().split("\\s+");
                    if (tokens.length >= 4 && tokens[0].equalsIgnoreCase(ip)) {
                        String mac = tokens[3];
                        if (!"00:00:00:00:00:00".equals(mac)) {
                            return normalizarMac(mac);
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }

        try {
            Process p = Runtime.getRuntime().exec(new String[] { "arp", "-n", ip });
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
                String line;
                Pattern macPattern = Pattern.compile("([0-9a-fA-F]{1,2}[:-]){5}([0-9a-fA-F]{1,2})");
                while ((line = reader.readLine()) != null) {
                    if (line.toLowerCase().contains("incomplete")) {
                        return null;
                    }
                    Matcher m = macPattern.matcher(line);
                    if (m.find()) {
                        return normalizarMac(m.group(0));
                    }
                }
            }
        } catch (Exception ignored) {
        }

        return null;
    }

    private String parsearArpMac(File file, String ip) {
        try (BufferedReader br = new BufferedReader(new FileReader(file))) {
            String line;
            Pattern macPattern = Pattern.compile("([0-9a-fA-F]{1,2}[:-]){5}([0-9a-fA-F]{1,2})");
            while ((line = br.readLine()) != null) {
                if (line.contains("(" + ip + ")") || line.startsWith(ip + " ") || line.contains(" " + ip + " ")) {
                    if (line.toLowerCase().contains("incomplete")) {
                        return null;
                    }
                    Matcher m = macPattern.matcher(line);
                    if (m.find()) {
                        return normalizarMac(m.group(0));
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private String normalizarMac(String rawMac) {
        if (rawMac == null) return null;
        String[] parts = rawMac.split("[:-]");
        if (parts.length != 6) return rawMac.toLowerCase();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (i > 0) sb.append(":");
            if (parts[i].length() == 1) {
                sb.append("0").append(parts[i].toLowerCase());
            } else {
                sb.append(parts[i].toLowerCase());
            }
        }
        return sb.toString();
    }

    private String resolverFabricante(String mac) {
        if (mac == null || mac.equals("00:00:00:00:00:00") || mac.isEmpty()) {
            return "No disponible (Host inalcanzable)";
        }
        String cleanMac = mac.replace(":", "").replace("-", "").toLowerCase();
        if (cleanMac.length() >= 6) {
            char secondChar = cleanMac.charAt(1);
            if (secondChar == '2' || secondChar == '6' || secondChar == 'a' || secondChar == 'e') {
                return "Direccion MAC Aleatoria / Privacidad Wi-Fi (iOS / Android / macOS)";
            }
            String oui = cleanMac.substring(0, 6);
            if (oui.startsWith("84e657")) {
                return "Sony Interactive Entertainment Inc.";
            }
            if (oui.startsWith("001a8c") || oui.startsWith("1868cb") || oui.startsWith("bcad28")) {
                return "Hikvision Digital Technology";
            }
            if (oui.startsWith("38af29") || oui.startsWith("e0508b") || oui.startsWith("4c11bf")) {
                return "Dahua Technology";
            }
            if (oui.startsWith("001761") || oui.startsWith("90b686") || oui.startsWith("00264a")) {
                return "ZKTeco Inc. (Biometric & Access Control)";
            }
            if (oui.startsWith("b827eb") || oui.startsWith("dca632") || oui.startsWith("e45f01") || oui.startsWith("28cdc1")) {
                return "Raspberry Pi Foundation";
            }
            if (oui.startsWith("240ac4") || oui.startsWith("30aea4") || oui.startsWith("84f703") || oui.startsWith("a020a6") || oui.startsWith("cc50e3")) {
                return "Espressif Inc. (ESP32 IoT Controller)";
            }
            if (oui.startsWith("0242ac") || oui.startsWith("0242f7")) {
                return "Docker Virtual Bridge Interface";
            }
            if (oui.startsWith("74cc40") || oui.startsWith("00ebd8")) {
                return "TP-Link Technologies Co., Ltd.";
            }
            if (oui.startsWith("ae2f57") || oui.startsWith("06ceb3") || oui.startsWith("04bfd5") || oui.startsWith("3455e5")) {
                return "Apple, Inc. (Terminal / Mac / iPhone)";
            }
            if (oui.startsWith("000c29") || oui.startsWith("005056")) {
                return "VMware Virtual Platform";
            }
            return "Fabricante de Red (" + oui.substring(0, 2) + ":" + oui.substring(2, 4) + ":" + oui.substring(4, 6) + ")";
        }
        return "Dispositivo de Red Local";
    }

    private void inferirTipoYSO(DispositivoEscaneoDTO dto, String bannerHttp, String bannerSsh) {
        if (!dto.getOnline()) {
            dto.setTipoDispositivo("No detectable (Dispositivo Offline)");
            dto.setSistemaOperativo("Desconocido (Sin respuesta de red)");
            dto.setFirmware("No disponible (Host inalcanzable)");
            return;
        }

        List<Integer> ports = dto.getPuertosAbiertos();
        String fabricante = dto.getFabricante() != null ? dto.getFabricante().toLowerCase() : "";

        if (ports != null && ports.contains(4370)) {
            dto.setTipoDispositivo("Lector ZKTeco");
            dto.setSistemaOperativo("Linux Embedded (ZKOS)");
            dto.setFirmware("Protocolo ZK Standalone 4370");
        } else if (ports != null && (ports.contains(8000) || ports.contains(554))) {
            dto.setTipoDispositivo("Terminal Biometrica Facial");
            dto.setSistemaOperativo("Linux Embedded (HikOS)");
            dto.setFirmware("ISAPI Streaming v5.x");
        } else if (ports != null && ports.contains(3001)) {
            dto.setTipoDispositivo("Torniquete con Relay TCP");
            dto.setSistemaOperativo("RTOS / Microcontrolador Relay");
            dto.setFirmware("Controlador TCP Relay v2.x");
        } else if (ports != null && (ports.contains(80) || ports.contains(8080) || ports.contains(443))) {
            if (bannerHttp != null && (bannerHttp.toLowerCase().contains("quarkus") || bannerHttp.toLowerCase().contains("nginx") || bannerHttp.toLowerCase().contains("apache") || bannerHttp.toLowerCase().contains("control") || bannerHttp.toLowerCase().contains("acceso"))) {
                dto.setTipoDispositivo("Servidor de Control");
                dto.setSistemaOperativo("macOS/Linux 64-bit");
                dto.setFirmware(bannerHttp.length() > 40 ? bannerHttp.substring(0, 40) : bannerHttp);
            } else if (fabricante.contains("tp-link") || ports.contains(53)) {
                dto.setTipoDispositivo("Router / Gateway de Red");
                dto.setSistemaOperativo("Linux Embedded (Firmware Router)");
                dto.setFirmware(bannerHttp != null && !bannerHttp.isEmpty() ? bannerHttp : "Web Admin Interface");
            } else {
                dto.setTipoDispositivo("Servidor de Control / Web");
                dto.setSistemaOperativo("Linux / Web Server");
                dto.setFirmware(bannerHttp != null && !bannerHttp.isEmpty() ? bannerHttp : "Servicio HTTP Estandar");
            }
        } else if (ports != null && ports.contains(22)) {
            dto.setTipoDispositivo("Servidor de Control");
            dto.setSistemaOperativo(bannerSsh != null && bannerSsh.contains("Ubuntu") ? "Linux Ubuntu 64-bit" : "Linux/macOS 64-bit");
            dto.setFirmware(bannerSsh != null ? bannerSsh : "OpenSSH Terminal");
        } else {
            if (fabricante.contains("apple")) {
                dto.setTipoDispositivo("Terminal Movil / Host Apple");
                dto.setSistemaOperativo("iOS / macOS (Firewall activo)");
                dto.setFirmware("No expuesto por dispositivo");
            } else if (fabricante.contains("sony")) {
                dto.setTipoDispositivo("Terminal Multimedia (Sony)");
                dto.setSistemaOperativo("PlayStation OS / Embedded");
                dto.setFirmware("No expuesto (Sin servicios de control)");
            } else if (fabricante.contains("zkteco")) {
                dto.setTipoDispositivo("Dispositivo ZKTeco en Red");
                dto.setSistemaOperativo("Linux Embedded (ZKOS)");
                dto.setFirmware("Modo Push / UDP (Puertos TCP inactivos)");
            } else if (fabricante.contains("hikvision")) {
                dto.setTipoDispositivo("Terminal Hikvision");
                dto.setSistemaOperativo("Linux Embedded (HikOS)");
                dto.setFirmware("No expuesto en red");
            } else if (fabricante.contains("espressif")) {
                dto.setTipoDispositivo("Modulo IoT (ESP32)");
                dto.setSistemaOperativo("FreeRTOS");
                dto.setFirmware("Firmware IoT");
            } else if (fabricante.contains("aleatoria")) {
                dto.setTipoDispositivo("Terminal Movil");
                dto.setSistemaOperativo("Android/iOS");
                dto.setFirmware("No expuesto (MAC Privada)");
            } else {
                dto.setTipoDispositivo("Host de Red Local");
                dto.setSistemaOperativo("Plataforma no determinada (Puertos cerrados)");
                dto.setFirmware("No expuesto en red");
            }
        }
    }

    private String inferirTipoPorDefecto(Dispositivo d) {
        String desc = d.getDescripcion() != null ? d.getDescripcion().toLowerCase() : "";
        if (desc.contains("facial") || desc.contains("puerta")) return "Terminal Biometrica Facial";
        if (desc.contains("lector") || desc.contains("huella") || desc.contains("zkteco")) return "Lector ZKTeco";
        if (desc.contains("celular") || desc.contains("movil")) return "Terminal Movil";
        if (desc.contains("servidor") || desc.contains("laptop") || desc.contains("pc")) return "Servidor de Control";
        return "Torniquete con Relay TCP";
    }

    private String inferirSOPorDefecto(Dispositivo d) {
        String desc = d.getDescripcion() != null ? d.getDescripcion().toLowerCase() : "";
        if (desc.contains("celular") || desc.contains("movil")) return "Android/iOS";
        if (desc.contains("servidor") || desc.contains("laptop") || desc.contains("pc")) return "macOS/Linux 64-bit";
        if (desc.contains("facial") || desc.contains("lector") || desc.contains("huella")) return "Linux Embedded (ZKOS / HikOS)";
        return "Linux Embedded (ZKOS / HikOS)";
    }

    private String identificarServicio(int puerto) {
        switch (puerto) {
            case 22: return "SSH (Administracion Segura de Terminal)";
            case 23: return "Telnet (Terminal Remoto sin Cifrar)";
            case 53: return "DNS (Servicio de Nombres de Dominio)";
            case 80: return "HTTP (Panel Web de Configuracion)";
            case 443: return "HTTPS (Consola Web Cifrada SSL)";
            case 554: return "RTSP (Stream de Video en Vivo Facial)";
            case 3001: return "Relay TCP / Control de Torniquete";
            case 4370: return "Protocolo ZKTeco Standalone Biometria";
            case 8000: return "SDK Hikvision / Protocolo ISAPI";
            case 8080: return "HTTP Alternativo / API Microservicio";
            default: return "Servicio TCP (" + puerto + ")";
        }
    }

    private boolean testPuerto(String ip, int puerto, int timeoutMs) {
        try (Socket s = new Socket()) {
            s.connect(new InetSocketAddress(ip, puerto), timeoutMs);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public List<DispositivoDescubiertoDTO> descubrirDispositivosNoRegistrados() {
        List<Dispositivo> existentes = dispositivoRepository.listAll();
        java.util.Set<String> ipsRegistradas = new java.util.HashSet<>();
        for (Dispositivo d : existentes) {
            if (d.getIp() != null) {
                ipsRegistradas.add(d.getIp().trim().replace(',', '.'));
            }
        }

        java.util.Set<String> candidatosIps = new java.util.LinkedHashSet<>();
        extraerIpsDeArchivo(new File("/host_tmp/host_arp.txt"), candidatosIps);
        extraerIpsDeArchivo(new File("/tmp/host_arp.txt"), candidatosIps);
        extraerIpsDeArchivo(new File("/proc/net/arp"), candidatosIps);

        List<DispositivoDescubiertoDTO> descubiertos = new ArrayList<>();

        for (String ip : candidatosIps) {
            if (ip.endsWith(".255") || ip.endsWith(".0") || ip.startsWith("127.") || ip.startsWith("224.") || ip.startsWith("172.18.") || ip.equals("255.255.255.255")) {
                continue;
            }
            if (ipsRegistradas.contains(ip)) {
                continue;
            }

            long start = System.currentTimeMillis();
            String mac = resolverMac(ip);
            boolean online = (mac != null && !mac.isEmpty() && !mac.equals("00:00:00:00:00:00"));

            int[] testPorts = { 80, 443, 22, 4370, 8000, 3001, 8080 };
            for (int p : testPorts) {
                if (testPuerto(ip, p, 200)) {
                    online = true;
                    break;
                }
            }
            if (!online) {
                try {
                    InetAddress addr = InetAddress.getByName(ip);
                    online = addr.isReachable(350);
                } catch (Exception ignored) {
                }
            }

            if (!online) {
                continue;
            }

            long latencia = System.currentTimeMillis() - start;
            DispositivoDescubiertoDTO dto = new DispositivoDescubiertoDTO();
            dto.setIp(ip);
            dto.setOnline(true);
            dto.setLatenciaMs(latencia > 0 ? latencia : 5);
            dto.setMac(mac != null ? mac : "00:00:00:00:00:00");
            dto.setFabricante(resolverFabricante(dto.getMac()));

            String hostname = ip;
            try {
                InetAddress addr = InetAddress.getByName(ip);
                String h = addr.getCanonicalHostName();
                if (h != null && !h.isEmpty() && !h.equals(ip)) {
                    hostname = h;
                }
            } catch (Exception ignored) {
            }
            dto.setHostname(hostname);

            List<Integer> puertos = new ArrayList<>();
            for (int p : testPorts) {
                if (testPuerto(ip, p, 200)) {
                    puertos.add(p);
                }
            }
            dto.setPuertosAbiertos(puertos);

            int puertoSugerido = 3001;
            String tipo = "Torniquete con Relay TCP";
            String so = "RTOS";

            if (puertos.contains(4370)) {
                tipo = "Lector ZKTeco";
                so = "Linux Embedded (ZKOS)";
                puertoSugerido = 4370;
            } else if (puertos.contains(8000) || puertos.contains(554)) {
                tipo = "Terminal Biometrica Facial";
                so = "Linux Embedded (HikOS)";
                puertoSugerido = 8000;
            } else if (puertos.contains(3001)) {
                tipo = "Torniquete con Relay TCP";
                so = "RTOS";
                puertoSugerido = 3001;
            } else if (puertos.contains(8080) || puertos.contains(80) || puertos.contains(22)) {
                tipo = "Servidor de Control";
                so = "macOS/Linux 64-bit";
                puertoSugerido = puertos.contains(8080) ? 8080 : (puertos.contains(80) ? 80 : 22);
            } else {
                String fab = dto.getFabricante().toLowerCase();
                if (fab.contains("apple") || fab.contains("aleatoria")) {
                    tipo = "Terminal Movil";
                    so = "Android/iOS";
                    puertoSugerido = 3001;
                } else if (fab.contains("tp-link")) {
                    tipo = "Dispositivo de Red / Router";
                    so = "Linux Embedded";
                    puertoSugerido = 80;
                } else {
                    tipo = "Dispositivo de Red Local";
                    so = "Linux Embedded";
                    puertoSugerido = 3001;
                }
            }

            dto.setTipoDispositivo(tipo);
            dto.setSistemaOperativo(so);
            dto.setPort(puertoSugerido);
            dto.setDescripcion(tipo + " - " + ip);
            dto.setPisoId(1L);
            dto.setEntradaSalida(0);
            dto.setSeleccionado(true);

            descubiertos.add(dto);
        }

        return descubiertos;
    }

    private void extraerIpsDeArchivo(File f, java.util.Set<String> set) {
        if (!f.exists() || !f.canRead()) return;
        try (BufferedReader br = new BufferedReader(new FileReader(f))) {
            String line;
            Pattern ipPattern = Pattern.compile("\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b");
            while ((line = br.readLine()) != null) {
                if (line.toLowerCase().contains("incomplete")) continue;
                Matcher m = ipPattern.matcher(line);
                if (m.find()) {
                    set.add(m.group(0));
                }
            }
        } catch (Exception ignored) {
        }
    }

    @Override
    @Transactional
    public List<Dispositivo> registrarLote(List<Dispositivo> dispositivos) {
        List<Dispositivo> creados = new ArrayList<>();
        if (dispositivos == null || dispositivos.isEmpty()) {
            return creados;
        }

        for (Dispositivo d : dispositivos) {
            if (d.getIp() == null || d.getIp().trim().isEmpty()) {
                continue;
            }
            d.setId(null);
            if (d.getNombre() == null || d.getNombre().trim().isEmpty()) {
                d.setNombre(d.getDescripcion() != null ? d.getDescripcion() : "Dispositivo " + d.getIp());
            }
            if (d.getDescripcion() == null || d.getDescripcion().trim().isEmpty()) {
                d.setDescripcion(d.getNombre());
            }
            if (d.getPort() == null || d.getPort() <= 0) {
                d.setPort(3001);
            }
            if (d.getState() == null) {
                d.setState(1);
            }
            if (d.getEntradaSalida() == null) {
                d.setEntradaSalida(0);
            }
            d.setPing(true);
            d.setEstadoConexion(true);

            if (d.getPisoId() != null && d.getPiso() == null) {
                com.access.control.model.Piso p = pisoRepository.findById(d.getPisoId());
                if (p != null) {
                    d.setPiso(p);
                }
            }
            dispositivoRepository.persist(d);
            creados.add(d);
        }

        return creados;
    }
}
