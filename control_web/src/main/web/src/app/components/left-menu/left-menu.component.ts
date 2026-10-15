import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarService } from '../../shared/services/sidebar.service';

@Component({
  selector: 'app-left-menu',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './left-menu.component.html',
  styleUrls: ['./left-menu.component.css']
})
export class LeftMenuComponent {
  public sidebarService = inject(SidebarService);
  menuPagosAbierto: boolean = true;

  onNavClick(): void {
    if (window.innerWidth < 768) {
      this.sidebarService.close();
    }
  }
}
