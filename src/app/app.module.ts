import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { PersonModule } from './modules/person/person.module';
import { ManModule } from './modules/man/man.module';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { HomeComponent } from './components/home/home.component';
import { ItemModule } from './modules/item/item.module';
import { PropModule } from './modules/prop/prop.module';

@NgModule({
  declarations: [
    AppComponent,
    NotFoundComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    PersonModule,
    ManModule,
    ItemModule,
    PropModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
