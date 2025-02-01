import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ItemRoutingModule } from './item-routing.module';
import { ItemComponent } from './components/item/item.component';
import { AddItemComponent } from './components/add-item/add-item.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AddComponent } from './components/add/add.component';


@NgModule({
  declarations: [
    ItemComponent,
    AddItemComponent,
    AddComponent
  ],
  imports: [
    CommonModule,
    ItemRoutingModule,
    ReactiveFormsModule
  ]
})
export class ItemModule { }
