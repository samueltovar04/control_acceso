import { Component, OnInit } from '@angular/core';
import { DispositivoService } from '../../../shared/dispositivo/dispositivo.service';

@Component({
  selector: 'app-dispositivo-list',
  templateUrl: './dispositivo-list.component.html',
  styleUrls: ['./dispositivo-list.component.css']
})
export class DispositivoListComponent implements OnInit {
  dispositivos: any[] = [];
  dispositivosFiltrados: any[] = [];
  itemsPaginados: any[] = [];

  filtroTexto: string = '';
  page: number = 1;
  pageSize: number = 10;
  totalPaginas: number = 1;
  paginasArray: number[] = [];

  constructor(private dispositivoService: DispositivoService) {}

  ngOnInit(): void {
    this.reloadData();
  }

  reloadData(): void {
    this.dispositivoService.getDispositivosList().subscribe({
      next: (data: any) => {
        this.dispositivos = data || [];
        this.aplicarFiltro();
      },
      error: (err) => console.log('Error dispositivos:', err)
    });
  }

  aplicarFiltro(): void {
    const q = (this.filtroTexto || '').toLowerCase().trim();
    if (!q) {
      this.dispositivosFiltrados = [...this.dispositivos];
    } else {
      this.dispositivosFiltrados = this.dispositivos.filter((d) => {
        const nombre = (d.nombre || d.descripcion || '').toLowerCase();
        const ip = (d.ip || '').toLowerCase();
        const tipo = (d.tipo || '').toLowerCase();
        const piso = (d.piso?.numeroPiso || d.piso?.descripcion || '').toLowerCase();
        return nombre.includes(q) || ip.includes(q) || tipo.includes(q) || piso.includes(q);
      });
    }
    this.totalPaginas = Math.ceil(this.dispositivosFiltrados.length / this.pageSize) || 1;
    this.page = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    const inicio = (this.page - 1) * this.pageSize;
    this.itemsPaginados = this.dispositivosFiltrados.slice(inicio, inicio + this.pageSize);
    this.paginasArray = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.page = nuevaPagina;
      this.actualizarPaginacion();
    }
  }

  deleteDispositivo(id: number): void {
    if (confirm('Desea eliminar este dispositivo?')) {
      this.dispositivoService.deleteDispositivo(id).subscribe({
        next: () => this.reloadData(),
        error: (err) => console.log(err)
      });
    }
  }

  abrirTorniquete(dispositivo: any): void {
    this.dispositivoService.abrirDispositivo(dispositivo.id).subscribe({
      next: () => {
        alert('Pulso de apertura concedido al torniquete ' + (dispositivo.nombre || dispositivo.id));
      },
      error: (err) => {
        alert('Error al enviar pulso al torniquete: ' + err.message);
      }
    });
  }
}
