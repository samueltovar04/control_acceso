package com.access.control.util;

import com.access.control.model.Dispositivo;

import java.net.InetAddress;

public class PingState {

    static public boolean ping(Dispositivo servidor) {
        try {
            InetAddress in = InetAddress.getByName(servidor.getIp());
            if (in.isReachable(1000)) {
                System.out.println("Dirección accesible! :) ");
                return true;
            } else {
                System.out.println("La dirección indicada es inaccesible :(");
                return false;
            }
        } catch (Exception e) {
            return false;
        }

    }

}
