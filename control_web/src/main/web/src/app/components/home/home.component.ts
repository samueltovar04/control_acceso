import { Component, OnInit, inject } from '@angular/core';
import { Router, Event, NavigationStart } from '@angular/router';
import { Location } from '@angular/common';
import { SidebarService } from '../../shared/services/sidebar.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  public sidebarService = inject(SidebarService);
  specialPage: boolean = false;
  title = 'Control de Acceso';
private specialPages: any[] = [
'/pages/login',
'/pages/register',
'/pages/lock',
'/pages/pricing',
'/pages/single-post',
'/pages/post-listing'
];

private currentUrl = '';
constructor(
    private router: Router,
    private location: Location
  ) {

    this.router.events.subscribe((route:any) => {
      this.currentUrl = route.url;

      this.specialPage = this.specialPages.indexOf(this.currentUrl) !== -1;
    });

  }

  ngOnInit(): void {
  }

  goBack(): void {
    this.location.back();
  }

}
