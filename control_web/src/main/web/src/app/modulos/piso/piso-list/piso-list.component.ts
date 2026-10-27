import { Component, OnInit } from '@angular/core';
import { PisoService } from '../../../shared/piso/piso.service';
import { SedeService, Sede } from '../../../shared/sede/sede.service';
import { Piso } from '../../../shared/piso/piso.model';
import { AlertModalService } from '../../../shared/services/alert-modal.service';

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

  // Sedes y modal emergente de Piso (Nuevo / Editar)
  sedesList: any[] = [];
  mostrarModalPiso: boolean = false;
  esEdicion: boolean = false;
  guardandoPiso: boolean = false;
  mensajeExito: string = '';
  errorModal: string = '';

  pisoForm: Piso = new Piso();

  constructor(
    private pisoService: PisoService,
    private sedeService: SedeService,
    private alertModal: AlertModalService
  ) {}

  ngOnInit(): void {
    this.reloadData();
    this.cargarSedes();
  }

  cargarSedes(): void {
    this.sedeService.getListSedes().subscribe({
      next: (data) => this.sedesList = data || [],
      error: (err) => console.error('Error cargando sedes:', err)
    });
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

  abrirModalNuevo(): void {
    this.esEdicion = false;
    this.mensajeExito = '';
    this.errorModal = '';
    this.pisoForm = new Piso();
    this.pisoForm.piso = '';
    this.pisoForm.descripcion = '';
    this.pisoForm.area = '';
    this.pisoForm.sede_id = this.sedesList.length > 0 ? this.sedesList[0].id : null;
    this.mostrarModalPiso = true;
  }

  abrirModalEditar(p: any): void {
    this.esEdicion = true;
    this.mensajeExito = '';
    this.errorModal = '';
    this.pisoForm = new Piso();
    this.pisoForm.id = p.id;
    // Si piso esta vacio en la base de datos preexistente, autocompletar con descripcion para evitar campos en blanco
    this.pisoForm.piso = p.piso || p.numeroPiso || p.descripcion || '';
    this.pisoForm.descripcion = p.descripcion || '';
    this.pisoForm.area = p.area || '';
    this.pisoForm.sede_id = p.sede?.id || p.sedeId || null;
    this.mostrarModalPiso = true;
  }

  cerrarModal(): void {
    this.mostrarModalPiso = false;
  }

  guardarPiso(): void {
    this.errorModal = '';
    this.mensajeExito = '';

    if (!this.pisoForm.piso || !this.pisoForm.piso.trim()) {
      this.errorModal = 'El numero o nombre de piso es requerido.';
      return;
    }
    if (!this.pisoForm.descripcion || !this.pisoForm.descripcion.trim()) {
      this.errorModal = 'La descripcion del piso es requerida.';
      return;
    }

    if (this.pisoForm.sede_id) {
      this.pisoForm.sedeId = this.pisoForm.sede_id;
    }

    this.guardandoPiso = true;
    if (this.esEdicion && this.pisoForm.id) {
      this.pisoService.updatePiso(this.pisoForm.id, this.pisoForm).subscribe({
        next: () => {
          this.mensajeExito = 'Piso actualizado exitosamente.';
          this.guardandoPiso = false;
          this.reloadData();
          setTimeout(() => this.cerrarModal(), 900);
        },
        error: (err) => {
          this.errorModal = 'Error al actualizar el piso.';
          this.guardandoPiso = false;
        }
      });
    } else {
      this.pisoService.createPiso(this.pisoForm).subscribe({
        next: () => {
          this.mensajeExito = 'Piso registrado exitosamente.';
          this.guardandoPiso = false;
          this.reloadData();
          setTimeout(() => this.cerrarModal(), 900);
        },
        error: (err) => {
          this.errorModal = 'Error al registrar el piso.';
          this.guardandoPiso = false;
        }
      });
    }
  }

  async deletePiso(id: number): Promise<void> {
    const confirmado = await this.alertModal.confirm(
      'Desea eliminar este piso del sistema?',
      'Eliminar Piso',
      'Eliminar',
      'Cancelar'
    );
    if (confirmado) {
      this.pisoService.deletePiso(id).subscribe({
        next: () => this.reloadData(),
        error: (err) => console.log(err)
      });
    }
  }
}
