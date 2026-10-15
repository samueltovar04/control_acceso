import { Component, OnInit } from '@angular/core';
import { EmpleadoService } from '../../../shared/empleado/empleado.service';
import { AlertModalService } from '../../../shared/services/alert-modal.service';

@Component({
  selector: 'app-empleado-list',
  templateUrl: './empleado-list.component.html',
  styleUrls: ['./empleado-list.component.css']
})
export class EmpleadoListComponent implements OnInit {
  empleados: any[] = [];
  empleadosFiltrados: any[] = [];
  itemsPaginados: any[] = [];

  filtroTexto: string = '';
  page: number = 1;
  pageSize: number = 10;
  totalPaginas: number = 1;
  paginasArray: number[] = [];

  constructor(
    private empleService: EmpleadoService,
    private alertModal: AlertModalService
  ) {}

  ngOnInit(): void {
    this.reloadData();
  }

  reloadData(): void {
    this.empleService.getEmployeesList().subscribe({
      next: (data: any) => {
        this.empleados = data || [];
        this.aplicarFiltro();
      },
      error: (err) => console.log('Error empleados:', err)
    });
  }

  aplicarFiltro(): void {
    const q = (this.filtroTexto || '').toLowerCase().trim();
    if (!q) {
      this.empleadosFiltrados = [...this.empleados];
    } else {
      this.empleadosFiltrados = this.empleados.filter((e) => {
        const nombre = (e.name || e.nombre || '').toLowerCase();
        const apellido = (e.lastName || e.apellido || '').toLowerCase();
        const doc = (e.document || e.documento || '').toString();
        const badge = (e.badgeAccess || e.badge_access || '').toString();
        const email = (e.email || '').toLowerCase();
        const gerencia = (e.gerencia?.gerencia || '').toLowerCase();
        const sede = (e.sede?.sede || '').toLowerCase();
        return (
          nombre.includes(q) ||
          apellido.includes(q) ||
          doc.includes(q) ||
          badge.includes(q) ||
          email.includes(q) ||
          gerencia.includes(q) ||
          sede.includes(q)
        );
      });
    }
    this.totalPaginas = Math.ceil(this.empleadosFiltrados.length / this.pageSize) || 1;
    this.page = 1;
    this.actualizarPaginacion();
  }

  actualizarPaginacion(): void {
    const inicio = (this.page - 1) * this.pageSize;
    this.itemsPaginados = this.empleadosFiltrados.slice(inicio, inicio + this.pageSize);
    
    // Ventana deslizante para paginacion (max 7 botones)
    const total = this.totalPaginas;
    const actual = this.page;
    let start = Math.max(1, actual - 3);
    let end = Math.min(total, start + 6);
    if (end - start < 6) {
      start = Math.max(1, end - 6);
    }
    this.paginasArray = [];
    for (let i = start; i <= end; i++) {
      this.paginasArray.push(i);
    }
  }

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.page = nuevaPagina;
      this.actualizarPaginacion();
    }
  }

  cambiarPageSize(nuevoTamano: number): void {
    this.pageSize = Number(nuevoTamano);
    this.totalPaginas = Math.ceil(this.empleadosFiltrados.length / this.pageSize) || 1;
    this.page = 1;
    this.actualizarPaginacion();
  }

  async deleteEmployee(id: number): Promise<void> {
    const confirmado = await this.alertModal.confirm(
      'Desea eliminar este empleado del sistema?',
      'Eliminar Empleado',
      'Eliminar',
      'Cancelar'
    );
    if (confirmado) {
      this.empleService.deleteEmployee(id).subscribe({
        next: () => this.reloadData(),
        error: (err) => console.log(err)
      });
    }
  }
}
