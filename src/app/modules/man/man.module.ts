import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ManRoutingModule } from './man-routing.module';
import { ManComponent } from './man.component';
import { AddManComponent } from './components/add-man/add-man.component';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    ManComponent,
    AddManComponent
  ],
  imports: [
    CommonModule,
    ManRoutingModule,
    ReactiveFormsModule
  ]
})
export class ManModule { }
