import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ItemRoutingModule } from './item-routing.module';
import { ItemComponent } from './components/item/item.component';
import { AddItemComponent } from './components/add-item/add-item.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AddComponent } from './components/add/add.component';
import { EditItemComponent } from './components/edit-item/edit-item.component';


@NgModule({
  declarations: [
    ItemComponent,
    AddItemComponent,
    AddComponent,
    EditItemComponent
  ],
  imports: [
    CommonModule,
    ItemRoutingModule,
    ReactiveFormsModule
  ]
})
export class ItemModule { }
