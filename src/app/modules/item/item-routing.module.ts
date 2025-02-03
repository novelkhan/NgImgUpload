import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ItemComponent } from './components/item/item.component';
import { AddItemComponent } from './components/add-item/add-item.component';
import { AddComponent } from './components/add/add.component';
import { EditItemComponent } from './components/edit-item/edit-item.component';

const routes: Routes = [
    {path:'', component: ItemComponent, title: 'Items'},
    {path:'add', component: AddItemComponent, title: 'Add Item'},
    {path:'new', component: AddComponent, title: 'Add Item'},
    { path: 'edit/:id', component: EditItemComponent, title: 'Edit Item' },
  { path: '', redirectTo: '/item', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ItemRoutingModule { }
