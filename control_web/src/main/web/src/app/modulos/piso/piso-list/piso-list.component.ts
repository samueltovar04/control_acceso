import { Component, OnInit } from '@angular/core';
import { PisoService } from '../../../shared/piso/piso.service';

@Component({
  selector: 'app-piso-list',
  templateUrl: './piso-list.component.html',
  styleUrls: ['./piso-list.component.css']
})
export class PisoListComponent implements OnInit {
  pisos: any[] = [];
  pisosFiltrados: any[] = [];
  itemsPaginados: any[] = [];

  filtroTexto: string = '';
  page: number = 1;
  pageSize: number = 10;
  totalPaginas: number = 1;
  paginasArray: number[] = [];

  constructor(private pisoService: PisoService) {}

  ngOnInit(): void {
    this.reloadData();
  }

  reloadData(): void {
    this.pisoService.getPisosList().subscribe({
      next: (data: any) => {
        this.pisos = data || [];
        this.aplicarFiltro();
      },
      error: (err) => console.log('Error pisos:', err)
    });
  }

  aplicarFiltro(): void {
    const q = (this.filtroTexto || '').toLowerCase().trim();
    if (!q) {
      this.pisosFiltrados = [...this.pisos];
    } else {
      this.pisosFiltrados = this.pisos.filter((p) => {
        const num = (p.numeroPiso || p.piso || '').toString().toLowerCase();
        const desc = (p.descripcion || '').toLowerCase();
        const area = (p.area || '').toLowerCase();
        const sede = (p.sede?.sede || p.sede?.nombre || '').toLowerCase();
        return num.includes(q) || desc.includes(q) || area.includes(q) || sede.includes(q);
      });
    }
    this.totalPaginas = Math.ceil(this.pisosFiltrados.length / this.pageSize) || 1;
    this.page = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    const inicio = (this.page - 1) * this.pageSize;
    this.itemsPaginados = this.pisosFiltrados.slice(inicio, inicio + this.pageSize);
    this.paginasArray = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.page = nuevaPagina;
      this.actualizarPaginacion();
    }
  }

  deletePiso(id: number): void {
    if (confirm('Desea eliminar este piso?')) {
      this.pisoService.deletePiso(id).subscribe({
        next: () => this.reloadData(),
        error: (err) => console.log(err)
      });
    }
  }
}
