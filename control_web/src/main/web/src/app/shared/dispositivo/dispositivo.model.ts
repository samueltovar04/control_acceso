import { Component, OnInit } from '@angular/core';
export class Dispositivo
{
    public state: number = 1;
    public ip: string = "";
    public port: number = 0;
    public descripcion: string = "";
    public ping: boolean = true;
    public entradaSalida: number = 0;
    public color: string = "";
    public piso_id: number;
}
