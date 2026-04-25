// ==========================================
// chunk.module.ts
// ==========================================
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ChunkRoutingModule } from './chunk-routing.module';
import { ChunkedComponent } from './components/chunked/chunked.component';
import { AddChunkedComponent } from './components/add-chunked/add-chunked.component';

@NgModule({
  declarations: [
    ChunkedComponent,
    AddChunkedComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    ChunkRoutingModule
  ]
})
export class ChunkModule {}