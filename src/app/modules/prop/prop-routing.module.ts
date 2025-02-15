import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddPropComponent } from './components/add-prop/add-prop.component';
import { PropComponent } from './components/prop/prop.component';

const routes: Routes = [
  {path:'', component: PropComponent, title: 'Props'},
  {path:'add', component: AddPropComponent, title: 'Add Prop'}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PropRoutingModule { }
