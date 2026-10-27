import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { SedeStateService } from '../../../../shared/sede/sede-state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-highlight-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './highlight-badge.component.html',
  styleUrls: ['./highlight-badge.component.scss']
})
export class HighlightBadgeComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private sedeStateService = inject(SedeStateService);
  private sub?: Subscription;

  memberOfMonth = {
    name: 'Carlos Mendoza',
    streakDays: 45,
    checkIns: 120,
    category: 'CrossFit Athlete',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces'
  };

  ngOnInit(): void {
    this.cargarTopAsistencia();
    this.sub = this.sedeStateService.sedeSeleccionadaId$.subscribe(() => {
      this.cargarTopAsistencia();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  cargarTopAsistencia(): void {
    const sId = this.sedeStateService.getSedeActualId();
    const url = sId ? `/api/v1/acceso/gimnasio/top-asistencia?sedeId=${sId}` : '/api/v1/acceso/gimnasio/top-asistencia';

    this.http.get<any>(url).subscribe({
      next: (top) => {
        if (top && top.nombre && top.nombre !== 'Sin Registros') {
          const avatar = top.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(top.nombre)}&background=ffd700&color=000`;
          this.memberOfMonth = {
            name: top.nombre,
            streakDays: top.diasConsecutivos || 1,
            checkIns: top.checkInsTotales || 1,
            category: top.categoria || 'Miembro VIP Pro',
            avatar: avatar
          };
        }
      },
      error: () => {}
    });
  }
}
