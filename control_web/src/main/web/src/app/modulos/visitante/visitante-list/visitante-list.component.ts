import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { VisitanteService } from '../../../shared/visitante/visitante.service';
import { AlertModalService } from '../../../shared/services/alert-modal.service';
import { SedeStateService } from '../../../shared/sede/sede-state.service';

@Component({
  selector: 'app-visitante-list',
  templateUrl: './visitante-list.component.html',
  styleUrls: ['./visitante-list.component.css']
})
export class VisitanteListComponent implements OnInit, OnDestroy {
  visitantes: any[] = [];
  visitantesFiltrados: any[] = [];
  itemsPaginados: any[] = [];

  filtroTexto: string = '';
  filtroSedeId: number | null = null;
  private sedeSub?: Subscription;

  page: number = 1;
  pageSize: number = 10;
  totalPaginas: number = 1;
  paginasArray: number[] = [];

  constructor(
    private visiService: VisitanteService,
    private alertModal: AlertModalService,
    private sedeStateService: SedeStateService
  ) {}

  ngOnInit(): void {
    this.sedeSub = this.sedeStateService.sedeSeleccionadaId$.subscribe((sedeId) => {
      this.filtroSedeId = sedeId;
      this.aplicarFiltro();
    });
    this.reloadData();
  }

  ngOnDestroy(): void {
    this.sedeSub?.unsubscribe();
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
    this.visitantesFiltrados = this.visitantes.filter((v) => {
      if (this.filtroSedeId) {
        const vSedeId = v.sede?.id ?? v.empleadoAVisitar?.sede?.id ?? v.sedeId;
        if (vSedeId && Number(vSedeId) !== Number(this.filtroSedeId)) {
          return false;
        }
      }

      if (!q) {
        return true;
      }

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
