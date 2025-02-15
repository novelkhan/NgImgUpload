import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PropRoutingModule } from './prop-routing.module';
import { PropComponent } from './components/prop/prop.component';
import { AddPropComponent } from './components/add-prop/add-prop.component';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    PropComponent,
    AddPropComponent
  ],
  imports: [
    CommonModule,
    PropRoutingModule,
    ReactiveFormsModule
  ]
})
export class PropModule { }
