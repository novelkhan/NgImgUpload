import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Man } from '../../models/man.model';
import { ManService } from '../../services/man.service';

@Component({
  selector: 'app-add-man',
  templateUrl: './add-man.component.html',
  styleUrl: './add-man.component.scss'
})
export class AddManComponent implements OnDestroy{

  @ViewChild('fileInput') fileInput: any;

  manForm = new FormGroup({
    name: new FormControl('')
  });

  
  private addPersonSubscribtion?: Subscription;
  // base64: any;
  bytesarray: any;

  constructor(private manService: ManService,
    private router: Router) {}



  onFormSubmit() {
    let file:File = this.fileInput.nativeElement.files[0];
    // let filereader:FileReader = new FileReader();
    // filereader.onload = (e) =>{
    //   // this.base64 = filereader.result
    //   this.bytesarray = this.convertDataURIToBinary(filereader.result)
    // }
    // filereader.readAsDataURL(file);

    // console.log(this.base64);
    // this.bytearray = this.convertDataURIToBinary(this.base64)

    // var p = Array.from(this.bytearray);
    // var p = [].slice.call(this.bytearray);


    const reader = new FileReader();

    reader.onload = (event: any) => {
      const byteArray = new Uint8Array(event.target.result);
      this.bytesarray = byteArray;
      console.log('Byte array:', byteArray);
      
      // You can now use 'byteArray' as needed (e.g., send it to an API)
    };

    reader.readAsArrayBuffer(file);


    let man: Man = {
      name: (this.manForm.value.name) as string,
      imagebytes: this.bytesarray
      // picturebyte: ((this.fileInput.nativeElement.files[0])?.ArrayBuffer()) as ArrayBuffer
    }
    
    this.addPersonSubscribtion = this.manService.addMan(man)
    .subscribe({
      next: (response) => {
        this.router.navigateByUrl('/man');
      }
    });
  }




//  convertDataURIToBinary(dataURI: any):any {
//     var base64Index = dataURI.indexOf(';base64,') + ';base64,'.length;
//     var base64 = dataURI.substring(base64Index);
//     var raw = window.atob(base64);
//     var rawLength = raw.length;
//     var array = new Uint8Array(new ArrayBuffer(rawLength));
  
//     for(let i = 0; i < rawLength; i++) {
//       array[i] = raw.charCodeAt(i);
//     }

//     // var data = Array.from(array)
//     return array;
//   }




  ngOnDestroy(): void {
    this.addPersonSubscribtion?.unsubscribe();
  }

}
