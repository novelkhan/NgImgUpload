import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Man } from '../../models/man.model';
import { ManService } from '../../services/man.service';

@Component({
  selector: 'app-add-man',
  templateUrl: './add-man.component.html',
  styleUrls: ['./add-man.component.scss'] // Fixed typo here
})
export class AddManComponent implements OnDestroy {

  // @ViewChild('fileInput') fileInput: any;
  @ViewChild('fileInput', { static: false }) fileInput: any;


  manForm = new FormGroup({
    name: new FormControl('') // A form control for the name
  });

  private addManSubscription?: Subscription;
  base64String: any; // Directly using Uint8Array
  fileName: string = ''; // Default to empty string if undefined
  fileType: string = ''; // Default to empty string if undefined
  fileSize: string = ''; // Default to empty string if undefined

  constructor(private manService: ManService, private router: Router) {}

  onFormSubmit() {
    // Ensure the payload for the backend
    const man: Man = {
      name: this.manForm.value.name as string, // Use the form value
      filename: this.fileName, // Ensure fileName is always a string (fallback to empty string)
      filetype: this.fileType,
      filesize: this.fileSize,
      base64string: this.base64String
    };

    //console.log('Payload to send:', JSON.stringify(man));

    // Make the API call
    this.addManSubscription = this.manService.addMan(man).subscribe({
      next: (response) => {
        console.log('Response:', response);
        this.router.navigateByUrl('/man'); // Navigate on success
      },
      error: (error) => {
        console.error('Error occurred:', error);
      }
    });
    
  }

  async onFileSelected() {
    const file: File = this.fileInput.nativeElement.files[0];
    if (file) {
      this.fileName = file.name; // Set file name
      this.fileType = file.type;
      this.fileSize = this.getFileSizeString(file);
      this.base64String = await this.fileToBase64String(file);
      /* const reader = new FileReader();
      reader.onload = (event: any) => {
        this.base64String = (reader.result as string).split(',')[1];
      };
      reader.onerror = () => {
        console.error('Error reading file');
      };
      reader.readAsDataURL(file); */
    }
  }




  fileToBase64String(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
  
      reader.onload = () => {
        const base64Strings = (reader.result as string).split(',')[1];
        resolve(base64Strings);
      };
  
      reader.onerror = () => {
        reject('Error reading file');
      };
  
      reader.readAsDataURL(file);
    });
  }



  getFileSizeString(file: File): string {
    const size = file.size; // file size in bytes
    let sizeString = '';
  
    if (size / 1024 < 1024) {
      const length = size / 1024; // Convert to KB
      sizeString = `${Math.round(length * 100) / 100} KB(s)`;
    } else {
      const length = size / (1024 * 1024); // Convert to MB
      sizeString = `${Math.round(length * 100) / 100} MB(s)`;
    }
  
    return sizeString;
  }
  




  fileToUint8Array(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
  
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(new Uint8Array(reader.result));
        } else {
          reject('Error converting file to ArrayBuffer');
        }
      };
  
      reader.onerror = () => {
        reject('Error reading file');
      };
  
      reader.readAsArrayBuffer(file);
    });
  }
  
  




  ngOnDestroy(): void {
    this.addManSubscription?.unsubscribe();
  }
}
