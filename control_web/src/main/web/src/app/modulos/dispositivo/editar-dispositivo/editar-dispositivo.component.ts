import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DispositivoService } from '../../../shared/dispositivo/dispositivo.service';
import { Dispositivo } from '../../../shared/dispositivo/dispositivo.model';
import { PisoService } from '../../../shared/piso/piso.service';
import { SedeService, Sede } from '../../../shared/sede/sede.service';
import { SedeStateService } from '../../../shared/sede/sede-state.service';

@Component({
  selector: 'app-editar-dispositivo',
  templateUrl: './editar-dispositivo.component.html',
  styleUrls: ['./editar-dispositivo.component.css']
})
export class EditarDispositivoComponent implements OnInit {

  dispositivo: Dispositivo = new Dispositivo();
  sedesList: Sede[] = [];
  pisosList: any[] = [];
  pisosFiltrados: any[] = [];
  sedeSeleccionadaId: number | null = null;
  sedeBloqueada: boolean = false;
  id: number;
  submitted = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dispositivoService: DispositivoService,
    private pisoService: PisoService,
    private sedeService: SedeService,
    private sedeStateService: SedeStateService
  ) { }

  ngOnInit() {
    this.submitted = false;
    this.id = this.route.snapshot.params['id'];

    this.sedeBloqueada = this.sedeStateService.esSedeBloqueada();
    this.sedeSeleccionadaId = this.sedeStateService.getSedeActualId();

    this.sedeService.getListSedes().subscribe({
      next: (sedes) => {
        this.sedesList = sedes || [];
      },
      error: (err) => console.log('Error cargando sedes:', err)
    });

    this.pisoService.getPisosList().subscribe({
      next: (pisos) => {
        this.pisosList = pisos || [];
        this.filtrarPisosPorSede();
        this.cargarDispositivo();
      },
      error: (err) => {
        console.log('Error cargando pisos:', err);
        this.cargarDispositivo();
      }
    });
  }

  cargarDispositivo() {
    this.dispositivoService.getDispositivo(this.id).subscribe({
      next: (data) => {
        this.dispositivo = data;
        if (data && data.piso && data.piso.id) {
          this.dispositivo.piso_id = data.piso.id;
          const sedeId = data.piso.sede?.id || data.piso.sede_id || data.piso.sedeId;
          if (sedeId) {
            this.sedeSeleccionadaId = Number(sedeId);
            this.filtrarPisosPorSede();
          }
        }
      },
      error: (err) => console.log('Error cargando dispositivo:', err)
    });
  }

  onSedeChange(sedeId: any) {
    this.sedeSeleccionadaId = sedeId ? Number(sedeId) : null;
    this.filtrarPisosPorSede();

    // Si el piso previamente seleccionado no pertenece a la nueva sede, resetearlo
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

  onSubmit() {
    this.submitted = true;

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

    this.dispositivoService.updateDispositivo(this.id, this.dispositivo).subscribe({
      next: () => this.gotoList(),
      error: (err) => {
        console.log('Error actualizando dispositivo:', err);
        this.submitted = false;
      }
    });
  }

  gotoList() {
    this.router.navigate(['/home/dispositivos']);
  }
}

