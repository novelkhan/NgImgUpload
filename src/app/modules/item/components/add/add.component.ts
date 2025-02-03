import { Component, OnDestroy, ViewChild } from "@angular/core";
import { Subscription } from "rxjs/internal/Subscription";
import { ItemService } from "../../services/item.service";
import { Router } from "@angular/router";
import { FormControl, FormGroup } from "@angular/forms";
import { Item } from "../../models/item.model";

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.scss']
})
export class AddComponent implements OnDestroy {

  fileForm = new FormGroup({
      file: new FormControl() // Initialize the file input control
    });

    file: File | null = null;

  private addItemSubscription?: Subscription;

  constructor(private itemService: ItemService, private router: Router) {}

  async onFormSubmit() {

    
    // Manually fetch file from the input field
    const inputElement = document.getElementById('file') as HTMLInputElement;
    
    if (inputElement.files && inputElement.files.length > 0) {
      const selectedFile = inputElement.files[0]; // Get the file manually
      //this.fileForm.patchValue({ file: selectedFile }); // Set file to FormControl

      console.log('Novel Starts');
      console.log(selectedFile); // This will now log the actual file
      console.log('Novel Ends');
      this.file = selectedFile;
    } else {
      console.log('No file selected');
    }



    const item: Item = {
      filename: (this.file?.name) as string, // Ensure fileName is always a string (fallback to empty string)
      filetype: (this.file?.type) as string,
      filesize: this.getFileSizeString(this.file as File),
      filestring: await this.fileToBase64String(this.file as File)
    };

    // console.log('Payload to send:', JSON.stringify(item));

    // Make the API call
    this.addItemSubscription = this.itemService.addItem(item).subscribe({
      next: (response) => {
        console.log('Response:', response);
        this.router.navigateByUrl('/item'); // Navigate on success
      },
      error: (error) => {
        console.error('Error occurred:', error);
      }
    });
    
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
    const size = file.size; // File size in bytes
    let sizeString = '';
  
    if (size < 1024 * 1024) { // Less than 1 MB
      const length = size / 1024; // Convert to KB
      const unit = length <= 1 ? 'KB' : 'KBs'; // Check if size is <= 1 KB
      sizeString = `${Math.round(length * 100) / 100} ${unit}`;
    } else { // 1 MB or more
      const length = size / (1024 * 1024); // Convert to MB
      const unit = length <= 1 ? 'MB' : 'MBs'; // Check if size is <= 1 MB
      sizeString = `${Math.round(length * 100) / 100} ${unit}`;
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
    this.addItemSubscription?.unsubscribe();
  }
}