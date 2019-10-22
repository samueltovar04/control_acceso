import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-left-menu',
  templateUrl: './left-menu.component.html',
  styleUrls: ['./left-menu.component.scss']
})
export class LeftMenuComponent implements OnInit {
  showLeftMenu: boolean = false;
  showSubmenu: boolean = false;
  changeOnlySubmenu: boolean = false;

  constructor() { }

  ngOnInit() {
      this.showLeftMenu=false;
  }

  openLeftMenu(){
    if(!this.changeOnlySubmenu){
      if(this.showSubmenu === false){
        var element= document.getElementById("leftMenu");
        element.classList.toggle('left-menu-open');
        this.showLeftMenu = !this.showLeftMenu;
      }
    }
    else{
      this.changeOnlySubmenu = false;
    }
  }

  openCustomersSubmenu(){
    var element = document.getElementById("customersSubmenu");
    var button = document.getElementById("buttonCustomers");

    if(this.showLeftMenu === true){
      element.classList.toggle('submenu-open');
      button.classList.toggle('toogle-button');
      this.showSubmenu = !this.showSubmenu;
      this.changeOnlySubmenu = true;
    }
    else {
      var element= document.getElementById("leftMenu");
      element.classList.toggle('left-menu-open');
      this.showLeftMenu = !this.showLeftMenu;
      this.changeOnlySubmenu = true;
    }

  }

  closeCustomerSubmenu(){
    var leftMenu= document.getElementById("leftMenu");
    var submenu = document.getElementById("customersSubmenu");

    this.showLeftMenu = false;
    this.showSubmenu = false;
    this.changeOnlySubmenu = true;
    submenu.classList.toggle('submenu-open');
    leftMenu.classList.toggle('left-menu-open');
  }

openVisitsSubmenu(){
    var element = document.getElementById("visitsSubmenu");
    var button = document.getElementById("buttonVisits");

    if(this.showLeftMenu === true){
      element.classList.toggle('submenu-open');
      button.classList.toggle('toogle-button');
      this.showSubmenu = !this.showSubmenu;
      this.changeOnlySubmenu = true;
    }
    else {
      var element= document.getElementById("leftMenu");
      element.classList.toggle('left-menu-open');
      this.showLeftMenu = !this.showLeftMenu;
      this.changeOnlySubmenu = true;
    }

  }

closeVisitSubmenu(){
    var leftMenu= document.getElementById("leftMenu");
    var submenu = document.getElementById("visitsSubmenu");

    this.showLeftMenu = false;
    this.showSubmenu = false;
    this.changeOnlySubmenu = true;
    submenu.classList.toggle('submenu-open');
    leftMenu.classList.toggle('left-menu-open');
  }

openDisposSubmenu(){
    var element = document.getElementById("disposSubmenu");
    var button = document.getElementById("buttonDispos");

    if(this.showLeftMenu === true){
      element.classList.toggle('submenu-open');
      button.classList.toggle('toogle-button');
      this.showSubmenu = !this.showSubmenu;
      this.changeOnlySubmenu = true;
    }
    else {
      var element= document.getElementById("leftMenu");
      element.classList.toggle('left-menu-open');
      this.showLeftMenu = !this.showLeftMenu;
      this.changeOnlySubmenu = true;
    }

  }

closeDisposSubmenu(){
    var leftMenu= document.getElementById("leftMenu");
    var submenu = document.getElementById("disposSubmenu");

    this.showLeftMenu = false;
    this.showSubmenu = false;
    this.changeOnlySubmenu = true;
    submenu.classList.toggle('submenu-open');
    leftMenu.classList.toggle('left-menu-open');
  }

openPisosSubmenu(){
    var element = document.getElementById("pisosSubmenu");
    var button = document.getElementById("buttonPisos");

    if(this.showLeftMenu === true){
      element.classList.toggle('submenu-open');
      button.classList.toggle('toogle-button');
      this.showSubmenu = !this.showSubmenu;
      this.changeOnlySubmenu = true;
    }
    else {
      var element= document.getElementById("leftMenu");
      element.classList.toggle('left-menu-open');
      this.showLeftMenu = !this.showLeftMenu;
      this.changeOnlySubmenu = true;
    }

  }

closePisosSubmenu(){
    var leftMenu= document.getElementById("leftMenu");
    var submenu = document.getElementById("pisosSubmenu");

    this.showLeftMenu = false;
    this.showSubmenu = false;
    this.changeOnlySubmenu = true;
    submenu.classList.toggle('submenu-open');
    leftMenu.classList.toggle('left-menu-open');
  }

}
