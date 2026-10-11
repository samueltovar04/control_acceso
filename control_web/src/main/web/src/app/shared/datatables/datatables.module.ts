import { Directive, Input, NgModule } from '@angular/core';

@Directive({
  selector: '[datatable]'
})
export class DataTableDirective {
  @Input() dtOptions: any;
  @Input() dtTrigger: any;
}

@NgModule({
  declarations: [DataTableDirective],
  exports: [DataTableDirective]
})
export class DataTablesModule {}
