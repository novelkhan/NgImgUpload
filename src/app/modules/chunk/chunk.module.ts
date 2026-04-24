import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChunkRoutingModule } from './chunk-routing.module';
import { AddChunkedComponent } from './components/add-chunked/add-chunked.component';
import { ChunkedComponent } from './components/chunked/chunked.component';


@NgModule({
  declarations: [
    AddChunkedComponent,
    ChunkedComponent
  ],
  imports: [
    CommonModule,
    ChunkRoutingModule
  ]
})
export class ChunkModule { }
