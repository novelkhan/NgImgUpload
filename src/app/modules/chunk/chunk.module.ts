import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChunkRoutingModule } from './chunk-routing.module';
import { AddChunkedComponent } from './components/add-chunked/add-chunked.component';


@NgModule({
  declarations: [
    AddChunkedComponent
  ],
  imports: [
    CommonModule,
    ChunkRoutingModule
  ]
})
export class ChunkModule { }
