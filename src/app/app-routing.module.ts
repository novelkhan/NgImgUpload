import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { NotFoundComponent } from './components/not-found/not-found.component';

const routes: Routes = [
  {path: '', component: HomeComponent},
  // Implementing lazy loading for Person module by following format
  {path:'person', loadChildren: () => import('./modules/person/person.module').then(module => module.PersonModule)},
  // Implementing lazy loading for Man module by following format
  {path:'man', loadChildren: () => import('./modules/man/man.module').then(module => module.ManModule)},
  {path: 'not-found', component: NotFoundComponent},
  {path: '**', component: NotFoundComponent, pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
