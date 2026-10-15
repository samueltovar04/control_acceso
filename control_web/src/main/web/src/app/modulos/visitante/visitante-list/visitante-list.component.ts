import { Component, OnInit } from '@angular/core';
import { VisitanteService } from '../../../shared/visitante/visitante.service';
import { AlertModalService } from '../../../shared/services/alert-modal.service';

@Component({
  selector: 'app-visitante-list',
  templateUrl: './visitante-list.component.html',
  styleUrls: ['./visitante-list.component.css']
})
export class VisitanteListComponent implements OnInit {
  visitantes: any[] = [];
  visitantesFiltrados: any[] = [];
  itemsPaginados: any[] = [];

  filtroTexto: string = '';
  page: number = 1;
  pageSize: number = 10;
  totalPaginas: number = 1;
  paginasArray: number[] = [];

  constructor(
    private visiService: VisitanteService,
    private alertModal: AlertModalService
  ) {}

  ngOnInit(): void {
    this.reloadData();
  }

  reloadData(): void {
    this.visiService.getVisitantesList().subscribe({
      next: (data: any) => {
        this.visitantes = data || [];
        this.aplicarFiltro();
      },
      error: (err) => console.log('Error visitantes:', err)
    });
  }

  aplicarFiltro(): void {
    const q = (this.filtroTexto || '').toLowerCase().trim();
    if (!q) {
      this.visitantesFiltrados = [...this.visitantes];
    } else {
      this.visitantesFiltrados = this.visitantes.filter((v) => {
        const nombre = (v.name || v.nombre || '').toLowerCase();
        const apellido = (v.lastName || v.apellido || '').toLowerCase();
        const doc = (v.document || v.documento || '').toString();
        const email = (v.email || '').toLowerCase();
        const badge = (v.badgeAccess || '').toString();
        return (
          nombre.includes(q) ||
          apellido.includes(q) ||
          doc.includes(q) ||
          email.includes(q) ||
          badge.includes(q)
        );
      });
    }
    this.totalPaginas = Math.ceil(this.visitantesFiltrados.length / this.pageSize) || 1;
    this.page = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    const inicio = (this.page - 1) * this.pageSize;
    this.itemsPaginados = this.visitantesFiltrados.slice(inicio, inicio + this.pageSize);
    this.paginasArray = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.page = nuevaPagina;
      this.actualizarPaginacion();
    }
  }

  async deleteVisitante(id: number): Promise<void> {
    const confirmado = await this.alertModal.confirm(
      'Desea eliminar este visitante del sistema?',
      'Eliminar Visitante',
      'Eliminar',
      'Cancelar'
    );
    if (confirmado) {
      this.visiService.deleteVisitante(id).subscribe({
        next: () => this.reloadData(),
        error: (err) => console.log(err)
      });
    }
  }
}
