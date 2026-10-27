import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { LiveAccessLogComponent } from './components/live-access-log/live-access-log.component';
import { HighlightBadgeComponent } from './components/highlight-badge/highlight-badge.component';
import { LiveMetricsStatusComponent } from './components/live-metrics-status/live-metrics-status.component';

export type DashboardTab = 'access' | 'members' | 'history' | 'settings';

@Component({
  selector: 'app-gym-access-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LiveAccessLogComponent,
    HighlightBadgeComponent,
    LiveMetricsStatusComponent
  ],
  templateUrl: './gym-access-dashboard.component.html',
  styleUrls: ['./gym-access-dashboard.component.scss']
})
export class GymAccessDashboardComponent implements OnInit {
  private http = inject(HttpClient);

  activeTab: DashboardTab = 'access';

  tabs = [
    { id: 'access' as DashboardTab, label: 'Active Access Control', icon: 'bi-broadcast' },
    { id: 'members' as DashboardTab, label: 'Members', icon: 'bi-people-fill' },
    { id: 'history' as DashboardTab, label: 'History', icon: 'bi-clock-history' },
    { id: 'settings' as DashboardTab, label: 'Settings', icon: 'bi-gear-fill' }
  ];

  // Datos tab Members
  membersList: any[] = [];
  membersSearch = '';
  loadingMembers = false;

  // Datos tab History
  historyList: any[] = [];
  historySearch = '';
  loadingHistory = false;

  // Datos tab Settings
  maxCapacity = 150;
  relayPulseMs = 3000;
  autoRefreshSeconds = 5;
  settingsSaved = false;

  ngOnInit(): void {
    this.cargarMembers();
  }

  setTab(tabId: DashboardTab): void {
    this.activeTab = tabId;
    if (tabId === 'members' && this.membersList.length === 0) {
      this.cargarMembers();
    } else if (tabId === 'history' && this.historyList.length === 0) {
      this.cargarHistory();
    }
  }

  cargarMembers(): void {
    this.loadingMembers = true;
    this.http.get<any[]>('/api/v1/clientes').subscribe({
      next: (data) => {
        this.membersList = data || [];
        this.loadingMembers = false;
      },
      error: () => {
        this.loadingMembers = false;
      }
    });
  }

  cargarHistory(): void {
    this.loadingHistory = true;
    this.http.get<any[]>('/api/v1/acceso/registros').subscribe({
      next: (data) => {
        this.historyList = (data || []).filter(r => r.cliente);
        this.loadingHistory = false;
      },
      error: () => {
        this.loadingHistory = false;
      }
    });
  }

  get filteredMembers(): any[] {
    if (!this.membersSearch.trim()) return this.membersList;
    const q = this.membersSearch.toLowerCase();
    return this.membersList.filter(m => 
      (m.nombre && m.nombre.toLowerCase().includes(q)) ||
      (m.apellido && m.apellido.toLowerCase().includes(q)) ||
      (m.documento && m.documento.toLowerCase().includes(q))
    );
  }

  get filteredHistory(): any[] {
    if (!this.historySearch.trim()) return this.historyList;
    const q = this.historySearch.toLowerCase();
    return this.historyList.filter(h => {
      const cli = h.cliente;
      const nom = cli ? `${cli.nombre || ''} ${cli.apellido || ''}`.toLowerCase() : '';
      const doc = cli?.documento?.toLowerCase() || '';
      return nom.includes(q) || doc.includes(q);
    });
  }

  guardarSettings(): void {
    this.settingsSaved = true;
    setTimeout(() => {
      this.settingsSaved = false;
    }, 3000);
  }
}
