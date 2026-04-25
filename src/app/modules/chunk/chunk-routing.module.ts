// ==========================================
// chunk-routing.module.ts
// ==========================================
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChunkedComponent } from './components/chunked/chunked.component';
import { AddChunkedComponent } from './components/add-chunked/add-chunked.component';

const routes: Routes = [
  { path: '', component: ChunkedComponent, title: 'Chunked Files' },
  { path: 'add', component: AddChunkedComponent, title: 'Upload Chunked File' },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChunkRoutingModule {}