import { Observable, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { DispositivoService } from '../../../shared/dispositivo/dispositivo.service';
import { Dispositivo } from '../../../shared/dispositivo/dispositivo.model';
import { PisoService } from '../../../shared/piso/piso.service';
import { SedeService, Sede } from '../../../shared/sede/sede.service';
import { SedeStateService } from '../../../shared/sede/sede-state.service';

@Component({
  selector: 'app-crear-dispositivo',
  templateUrl: './crear-dispositivo.component.html',
  styleUrls: ['./crear-dispositivo.component.css']
})
export class CrearDispositivoComponent implements OnInit {

  dispositivo: Dispositivo = new Dispositivo();
  sedesList: Sede[] = [];
  pisosList: any[] = [];
  pisosFiltrados: any[] = [];
  sedeSeleccionadaId: number | null = null;
  sedeBloqueada: boolean = false;
  submitted = false;

  constructor(
    private dispositivoService: DispositivoService,
    private pisoService: PisoService,
    private sedeService: SedeService,
    private sedeStateService: SedeStateService,
    private router: Router
  ) { }

  ngOnInit() {
    this.sedeBloqueada = this.sedeStateService.esSedeBloqueada();
    this.sedeSeleccionadaId = this.sedeStateService.getSedeActualId();

    this.sedeService.getListSedes().subscribe({
      next: (sedes) => {
        this.sedesList = sedes || [];
      },
      error: (err) => console.log('Error cargando sedes:', err)
    });

    this.cargarPisos();
  }

  cargarPisos() {
    this.pisoService.getPisosList().subscribe({
      next: (data) => {
        this.pisosList = data || [];
        this.filtrarPisosPorSede();
      },
      error: (err) => console.log('Error cargando pisos:', err)
    });
  }

  onSedeChange(sedeId: any) {
    this.sedeSeleccionadaId = sedeId ? Number(sedeId) : null;
    this.filtrarPisosPorSede();

    if (this.dispositivo.piso_id) {
      const pisoValido = this.pisosFiltrados.some(p => p.id === this.dispositivo.piso_id);
      if (!pisoValido) {
        this.dispositivo.piso_id = null;
      }
    }
  }

  onPisoChange(pisoId: any) {
    if (!pisoId) {
      this.dispositivo.piso_id = null;
      this.dispositivo.pisoId = null;
      this.dispositivo.piso = null;
      return;
    }
    const idNum = Number(pisoId);
    this.dispositivo.piso_id = idNum;
    this.dispositivo.pisoId = idNum;
    const pisoSel = this.pisosList.find(p => p.id === idNum);
    if (pisoSel) {
      this.dispositivo.piso = pisoSel;
      const sedePisoId = pisoSel.sede?.id || pisoSel.sede_id || pisoSel.sedeId;
      if (sedePisoId && this.sedeSeleccionadaId !== Number(sedePisoId)) {
        this.sedeSeleccionadaId = Number(sedePisoId);
        this.filtrarPisosPorSede();
      }
    }
  }

  filtrarPisosPorSede() {
    if (this.sedeSeleccionadaId === null) {
      this.pisosFiltrados = [...this.pisosList];
    } else {
      this.pisosFiltrados = this.pisosList.filter(p => {
        const sId = p.sede?.id || p.sede_id || p.sedeId;
        return Number(sId) === Number(this.sedeSeleccionadaId);
      });
    }
  }

  newDispositivo(): void {
    this.submitted = false;
    this.dispositivo = new Dispositivo();
  }

  save() {
    if (this.dispositivo.piso_id) {
      const pId = Number(this.dispositivo.piso_id);
      this.dispositivo.piso_id = pId;
      this.dispositivo.pisoId = pId;
      const pisoSel = this.pisosList.find(p => p.id === pId);
      this.dispositivo.piso = pisoSel || { id: pId };
    } else {
      this.dispositivo.piso_id = null;
      this.dispositivo.pisoId = null;
      this.dispositivo.piso = null;
    }

    if (this.dispositivo.descripcion) {
      this.dispositivo.nombre = this.dispositivo.descripcion;
    }
    if (this.dispositivo.tipoDispositivo) {
      this.dispositivo.tipo = this.dispositivo.tipoDispositivo;
    }
    if (this.dispositivo.port) {
      this.dispositivo.port = Number(this.dispositivo.port);
    }
    if (this.dispositivo.entradaSalida !== undefined && this.dispositivo.entradaSalida !== null) {
      this.dispositivo.entradaSalida = Number(this.dispositivo.entradaSalida);
    }
    if (this.dispositivo.state !== undefined && this.dispositivo.state !== null) {
      this.dispositivo.state = Number(this.dispositivo.state);
    }

    this.dispositivoService.createDispositivo(this.dispositivo).subscribe({
      next: () => {
        this.dispositivo = new Dispositivo();
        this.gotoList();
      },
      error: (err) => {
        console.log('Error creando dispositivo:', err);
        this.submitted = false;
      }
    });
  }

  onSubmit() {
    this.submitted = true;
    this.save();
  }

  gotoList() {
    this.router.navigate(['/home/dispositivos']);
  }
}

