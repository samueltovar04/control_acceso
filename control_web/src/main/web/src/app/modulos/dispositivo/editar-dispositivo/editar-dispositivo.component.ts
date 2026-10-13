import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DispositivoService } from '../../../shared/dispositivo/dispositivo.service';
import { Dispositivo } from '../../../shared/dispositivo/dispositivo.model';
import { PisoService } from '../../../shared/piso/piso.service';

@Component({
  selector: 'app-editar-dispositivo',
  templateUrl: './editar-dispositivo.component.html',
  styleUrls: ['./editar-dispositivo.component.css']
})
export class EditarDispositivoComponent implements OnInit {

  dispositivo: Dispositivo = new Dispositivo();
  pisosList: any[] = [];
  id: number;
  submitted = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dispositivoService: DispositivoService,
    private pisoService: PisoService
  ) { }

  ngOnInit() {
    this.submitted = false;
    this.id = this.route.snapshot.params['id'];

    this.pisoService.getPisosList().subscribe({
      next: (pisos) => (this.pisosList = pisos || []),
      error: (err) => console.log('Error cargando pisos:', err)
    });

    this.dispositivoService.getDispositivo(this.id).subscribe({
      next: (data) => {
        this.dispositivo = data;
        if (data && data.piso && data.piso.id) {
          this.dispositivo.piso_id = data.piso.id;
        }
      },
      error: (err) => console.log('Error cargando dispositivo:', err)
    });
  }

  onSubmit() {
    this.submitted = true;
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
