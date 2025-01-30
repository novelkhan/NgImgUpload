import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from './components/not-found/not-found.component';


//  (BootStrap-5 Installation Guide Link- https://www.youtube.com/watch?v=TIGy3VYsG5g )



const routes: Routes = [
  {path:'', loadChildren: () => import('./modules/person/person.module').then(module => module.PersonModule)},
  // {path: '', component: HomeComponent},
  // Implementing lazy loading for Person module by following format
  {path:'person', loadChildren: () => import('./modules/person/person.module').then(module => module.PersonModule)},
  // Implementing lazy loading for Man module by following format
  {path:'man', loadChildren: () => import('./modules/man/man.module').then(module => module.ManModule)},
  // Implementing lazy loading for Item module by following format
  {path:'item', loadChildren: () => import('./modules/item/item.module').then(module => module.ItemModule)},
  {path: 'not-found', component: NotFoundComponent},
  {path: '**', component: NotFoundComponent, pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
