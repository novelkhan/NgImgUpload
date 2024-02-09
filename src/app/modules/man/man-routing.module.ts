import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddManComponent } from './components/add-man/add-man.component';
import { ManComponent } from './man.component';

const routes: Routes = [
  {path:'', component: ManComponent, title: 'Man'},
  {path:'add', component: AddManComponent, title: 'Add Man'}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ManRoutingModule { }
