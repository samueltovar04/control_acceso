import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UsuarioService, UserDTO, AuditoriaAcceso, SesionActiva } from '../../../core/services/usuario.service';
import { SedeService, Sede } from '../../../shared/sede/sede.service';
import { EmpleadoService } from '../../../shared/empleado/empleado.service';

@Component({
  selector: 'app-usuario-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './usuario-list.component.html',
  styleUrls: ['./usuario-list.component.css']
})
export class UsuarioListComponent implements OnInit {
  public tabActiva: 'usuarios' | 'auditoria' | 'sesiones' = 'usuarios';

  // Usuarios
  public usuarios: UserDTO[] = [];
  public usuariosFiltrados: UserDTO[] = [];
  public sedes: Sede[] = [];
  public filtroTexto: string = '';
  public filtroEstado: string = 'TODOS';
  public cargando: boolean = false;
  public mensajeExito: string = '';
  public mensajeError: string = '';

  // Modal Usuario (Crear / Editar)
  public mostrarModalUsuario: boolean = false;
  public esEdicion: boolean = false;
  public usuarioForm: UserDTO = this.crearUsuarioVacio();
  public rolSeleccionado: string = 'ROLE_RECEPCION';

  // Busqueda de Empleados
  public empleados: any[] = [];
  public busquedaEmpleado: string = '';
  public empleadosEncontrados: any[] = [];
  public buscandoEmpleado: boolean = false;
  public empleadoSeleccionado: any = null;

  // Manejo de Contrasena
  public passwordConfirm: string = '';
  public mostrarPassword1: boolean = false;
  public mostrarPassword2: boolean = false;

  // Auditoria
  public auditorias: AuditoriaAcceso[] = [];
  public cargandoAuditoria: boolean = false;
  public filtroAuditoria: string = '';

  // Sesiones Activas
  public sesiones: SesionActiva[] = [];
  public cargandoSesiones: boolean = false;

  constructor(
    private usuarioService: UsuarioService,
    private sedeService: SedeService,
    private empleadoService: EmpleadoService
  ) {}

  ngOnInit(): void {
    this.cargarSedes();
    this.cargarUsuarios();
  }

  cargarSedes(): void {
    this.sedeService.getListSedes().subscribe({
      next: (res) => this.sedes = res || [],
      error: () => {}
    });
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.usuarioService.getUsuarios().subscribe({
      next: (res) => {
        this.usuarios = res || [];
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.mensajeError = 'Error al cargar usuarios.';
      }
    });
  }

  aplicarFiltros(): void {
    const term = this.filtroTexto.trim().toLowerCase();
    this.usuariosFiltrados = this.usuarios.filter(u => {
      const matchText = !term ||
        (u.username && u.username.toLowerCase().includes(term)) ||
        (u.nombreCompleto && u.nombreCompleto.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term)) ||
        (u.sedeNombre && u.sedeNombre.toLowerCase().includes(term));

      let matchEstado = true;
      if (this.filtroEstado === 'ACTIVOS') matchEstado = !!u.enabled;
      else if (this.filtroEstado === 'INACTIVOS') matchEstado = !u.enabled;
      else if (this.filtroEstado === 'RESETEO') matchEstado = !!u.requiresPasswordReset;

      return matchText && matchEstado;
    });
  }

  cambiarTab(tab: 'usuarios' | 'auditoria' | 'sesiones'): void {
    this.tabActiva = tab;
    this.limpiarMensajes();
    if (tab === 'auditoria') {
      this.cargarAuditoria();
    } else if (tab === 'sesiones') {
      this.cargarSesiones();
    } else {
      this.cargarUsuarios();
    }
  }

  cargarAuditoria(): void {
    this.cargandoAuditoria = true;
    this.usuarioService.getAuditoria(150).subscribe({
      next: (res) => {
        this.auditorias = res || [];
        this.cargandoAuditoria = false;
      },
      error: () => {
        this.cargandoAuditoria = false;
        this.mensajeError = 'Error al cargar registros de auditoria.';
      }
    });
  }

  cargarSesiones(): void {
    this.cargandoSesiones = true;
    this.usuarioService.getSesionesActivas().subscribe({
      next: (res) => {
        this.sesiones = res || [];
        this.cargandoSesiones = false;
      },
      error: () => {
        this.cargandoSesiones = false;
        this.mensajeError = 'Error al cargar sesiones activas.';
      }
    });
  }

  abrirCrearUsuario(): void {
    this.esEdicion = false;
    this.usuarioForm = this.crearUsuarioVacio();
    this.rolSeleccionado = 'ROLE_RECEPCION';
    this.busquedaEmpleado = '';
    this.empleadosEncontrados = [];
    this.empleadoSeleccionado = null;
    this.passwordConfirm = '';
    this.mostrarPassword1 = false;
    this.mostrarPassword2 = false;
    this.mostrarModalUsuario = true;
    this.limpiarMensajes();
    this.cargarEmpleados();
  }

  cargarEmpleados(): void {
    if (this.empleados.length === 0) {
      this.empleadoService.getEmployeesList().subscribe({
        next: (res) => {
          this.empleados = res || [];
        },
        error: () => {}
      });
    }
  }

  onBuscarEmpleado(): void {
    const term = (this.busquedaEmpleado || '').trim().toLowerCase();
    if (!term) {
      this.empleadosEncontrados = [];
      return;
    }
    this.empleadosEncontrados = this.empleados.filter(e => {
      const nombre = (e.name || e.nombre || '').toLowerCase();
      const apellido = (e.lastName || e.apellido || '').toLowerCase();
      const doc = (e.document || e.documento || '').toString().toLowerCase();
      const legajo = (e.legajo || '').toString().toLowerCase();
      const email = (e.email || '').toLowerCase();
      return nombre.includes(term) || apellido.includes(term) || doc.includes(term) || legajo.includes(term) || email.includes(term);
    }).slice(0, 10);
  }

  seleccionarEmpleado(emp: any): void {
    this.empleadoSeleccionado = emp;
    const nombre = (emp.name || emp.nombre || '').trim();
    const apellido = (emp.lastName || emp.apellido || '').trim();
    this.usuarioForm.nombreCompleto = `${nombre} ${apellido}`.trim();
    this.usuarioForm.email = emp.email || '';

    if (!this.usuarioForm.username) {
      const n = (emp.name || emp.nombre || '').trim().split(' ')[0] || '';
      const a = (emp.lastName || emp.apellido || '').trim().split(' ')[0] || '';
      if (n && a) {
        this.usuarioForm.username = (n.charAt(0) + a).toLowerCase().replace(/[^a-z0-9]/g, '');
      } else if (emp.document || emp.documento) {
        this.usuarioForm.username = 'u' + (emp.document || emp.documento);
      }
    }

    if (emp.sede && emp.sede.id) {
      this.usuarioForm.sedeId = emp.sede.id;
    }

    this.busquedaEmpleado = `${this.usuarioForm.nombreCompleto} (${emp.document || emp.documento || ''})`.trim();
    this.empleadosEncontrados = [];
  }

  limpiarEmpleadoSeleccionado(): void {
    this.empleadoSeleccionado = null;
    this.busquedaEmpleado = '';
    this.empleadosEncontrados = [];
  }

  abrirEditarUsuario(u: UserDTO): void {
    this.esEdicion = true;
    this.usuarioForm = {
      id: u.id,
      username: u.username,
      email: u.email,
      nombreCompleto: u.nombreCompleto,
      enabled: u.enabled,
      requiresPasswordReset: u.requiresPasswordReset,
      sedeId: u.sedeId,
      roles: u.roles ? [...u.roles] : [],
      password: ''
    };
    if (u.roles && u.roles.length > 0) {
      this.rolSeleccionado = u.roles[0];
    } else {
      this.rolSeleccionado = 'ROLE_RECEPCION';
    }
    this.busquedaEmpleado = '';
    this.empleadosEncontrados = [];
    this.empleadoSeleccionado = null;
    this.passwordConfirm = '';
    this.mostrarPassword1 = false;
    this.mostrarPassword2 = false;
    this.mostrarModalUsuario = true;
    this.limpiarMensajes();
    this.cargarEmpleados();
  }

  cerrarModalUsuario(): void {
    this.mostrarModalUsuario = false;
  }

  validarPasswordSegura(p: string): { valida: boolean; mensaje: string } {
    if (!p || p.length < 8) {
      return { valida: false, mensaje: 'La contrasena debe tener al menos 8 caracteres.' };
    }
    if (!/[A-Z]/.test(p)) {
      return { valida: false, mensaje: 'La contrasena debe contener al menos una letra mayuscula.' };
    }
    if (!/[a-z]/.test(p)) {
      return { valida: false, mensaje: 'La contrasena debe contener al menos una letra minuscula.' };
    }
    if (!/[0-9]/.test(p)) {
      return { valida: false, mensaje: 'La contrasena debe contener al menos un numero.' };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p)) {
      return { valida: false, mensaje: 'La contrasena debe contener al menos un caracter especial (!@#$%...)' };
    }
    return { valida: true, mensaje: '' };
  }

  guardarUsuario(): void {
    if (!this.usuarioForm.username || !this.usuarioForm.username.trim()) {
      this.mensajeError = 'El nombre de usuario es obligatorio.';
      return;
    }

    if (!this.esEdicion) {
      if (!this.usuarioForm.password) {
        this.mensajeError = 'La contrasena es obligatoria.';
        return;
      }
      const val = this.validarPasswordSegura(this.usuarioForm.password);
      if (!val.valida) {
        this.mensajeError = val.mensaje;
        return;
      }
      if (this.usuarioForm.password !== this.passwordConfirm) {
        this.mensajeError = 'Las contrasenas no coinciden.';
        return;
      }
    } else {
      // En modo edicion, si escribio una nueva contrasena, validarla
      if (this.usuarioForm.password && this.usuarioForm.password.trim()) {
        const val = this.validarPasswordSegura(this.usuarioForm.password);
        if (!val.valida) {
          this.mensajeError = val.mensaje;
          return;
        }
        if (this.usuarioForm.password !== this.passwordConfirm) {
          this.mensajeError = 'Las contrasenas no coinciden.';
          return;
        }
      }
    }

    this.usuarioForm.roles = [this.rolSeleccionado];

    this.cargando = true;
    if (this.esEdicion && this.usuarioForm.id) {
      this.usuarioService.actualizarUsuario(this.usuarioForm.id, this.usuarioForm).subscribe({
        next: () => {
          this.cargando = false;
          this.mostrarModalUsuario = false;
          this.mensajeExito = 'Usuario actualizado exitosamente.';
          this.cargarUsuarios();
        },
        error: (err) => {
          this.cargando = false;
          this.mensajeError = 'Error al actualizar usuario: ' + (err.error?.error || err.message);
        }
      });
    } else {
      this.usuarioService.crearUsuario(this.usuarioForm).subscribe({
        next: () => {
          this.cargando = false;
          this.mostrarModalUsuario = false;
          this.mensajeExito = 'Usuario creado exitosamente.';
          this.cargarUsuarios();
        },
        error: (err) => {
          this.cargando = false;
          this.mensajeError = 'Error al crear usuario: ' + (err.error?.error || err.message);
        }
      });
    }
  }

  toggleEstado(u: UserDTO): void {
    if (!u.id) return;
    const nuevoEstado = !u.enabled;
    this.usuarioService.cambiarEstado(u.id, nuevoEstado).subscribe({
      next: () => {
        u.enabled = nuevoEstado;
        this.mensajeExito = `Usuario ${u.username} ${nuevoEstado ? 'activado' : 'inactivado'} correctamente.`;
        this.aplicarFiltros();
      },
      error: () => {
        this.mensajeError = `Error al cambiar estado del usuario ${u.username}.`;
      }
    });
  }

  forzarReseteo(u: UserDTO): void {
    if (!u.id) return;
    this.usuarioService.forzarReseteoPassword(u.id).subscribe({
      next: () => {
        u.requiresPasswordReset = true;
        this.mensajeExito = `Usuario ${u.username} puesto en estado de reseteo obligatorio de clave.`;
        this.aplicarFiltros();
      },
      error: () => {
        this.mensajeError = `Error al forzar reseteo para ${u.username}.`;
      }
    });
  }

  revocarSesion(s: SesionActiva): void {
    this.usuarioService.revocarSesion(s.id).subscribe({
      next: () => {
        s.activa = false;
        this.sesiones = this.sesiones.filter(item => item.id !== s.id);
        this.mensajeExito = `Sesion de ${s.username} revocada y cerrada con exito.`;
      },
      error: () => {
        this.mensajeError = `Error al revocar sesion de ${s.username}.`;
      }
    });
  }

  limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  private crearUsuarioVacio(): UserDTO {
    return {
      username: '',
      email: '',
      nombreCompleto: '',
      enabled: true,
      requiresPasswordReset: true,
      sedeId: undefined,
      roles: ['ROLE_RECEPCION'],
      password: ''
    };
  }
}
