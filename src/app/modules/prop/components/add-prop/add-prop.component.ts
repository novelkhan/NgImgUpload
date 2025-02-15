import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { firstValueFrom, Subscription } from 'rxjs';
import { PropService } from '../../service/prop.service';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Prop } from '../../models/prop.model';

@Component({
  selector: 'app-add-prop',
  templateUrl: './add-prop.component.html',
  styleUrl: './add-prop.component.scss'
})
export class AddPropComponent implements OnDestroy {

  fileForm = new FormGroup({
      file: new FormControl(), // Initialize the file input control
      remoteUrl: new FormControl(), // Remote URL input control
      serverUpload: new FormControl() // Remote URL input control
    });

  // @ViewChild('fileInput') fileInput: any;
  @ViewChild('fileInput', { static: false }) fileInput: any;



  private addPropSubscription?: Subscription;
  fileName: string = ''; // Default to empty string if undefined
  fileType: string = ''; // Default to empty string if undefined
  fileSize: string = ''; // Default to empty string if undefined
  uint8Array: Uint8Array = new Uint8Array(0); // Directly using FormGroup element
  previewUrl: string | ArrayBuffer | null = null; // For file or URL preview
  isImage: boolean = false; // To check if the file is an image


  constructor(private propService: PropService, private router: Router, private http: HttpClient) {}


  ngOnInit(): void {

    this.fileForm.get('serverUpload')?.valueChanges.subscribe((url: string) => {
      if (url) {
        this.previewFromUrl(url); // Show preview for the URL
      } else {
        this.previewUrl = null; // Clear preview if URL is empty
      }
    });

    // Listen for changes in the remoteUrl input field
    this.fileForm.get('remoteUrl')?.valueChanges.subscribe((url: string) => {
      if (url) {
        this.previewFromUrl(url); // Show preview for the URL
      } else {
        this.previewUrl = null; // Clear preview if URL is empty
      }
    });
  }


  async onFormSubmit() {
    const serverUpload = this.fileForm.get('serverUpload')?.value;
    const remoteUrl = this.fileForm.get('remoteUrl')?.value;
  
    if (serverUpload) {
      // সার্ভারে URL পাঠানো
      try {
        const response = await firstValueFrom(this.propService.uploadFromUrl(serverUpload));
        console.log('Response:', response);
        this.router.navigateByUrl('/prop');
      } catch (error) {
        console.error('Error occurred:', error);
      }
    } else if (remoteUrl) {
      // রিমোট URL থেকে ফাইল ডাউনলোড করা
      await this.downloadFileFromUrl(remoteUrl);
    } else {
      // ফাইল আপলোড করা
      const file: File = this.fileInput.nativeElement.files[0];
      if (file) {
        this.fileName = file.name;
        this.fileType = file.type;
        this.fileSize = this.getFileSizeString(file);
        this.uint8Array = await this.fileToUint8Array(file); // ফাইলকে Uint8Array-এ কনভার্ট করা
      }
    }
  
    if (!serverUpload) {
      const prop: Prop = {
        filename: this.fileName,
        filetype: this.fileType,
        filesize: this.fileSize,
        filedata: Array.from(this.uint8Array) // Uint8Array ডাটা
      };

      console.log(prop);
  
      // সার্ভারে ডাটা পাঠানো
      this.addPropSubscription = this.propService.addProp(prop).subscribe({
        next: (response) => {
          console.log('Response:', response);
          this.router.navigateByUrl('/prop');
        },
        error: (error) => {
          console.error('Error occurred:', error);
        }
      });
    }
  }

  

  //  async onFileSelected() {
  //   const file: File = this.fileInput.nativeElement.files[0];
  //   if (file) {
  //     this.fileName = file.name; // Set file name
  //     this.fileType = file.type;
  //     this.fileSize = this.getFileSizeString(file);
  //     this.base64String = await this.fileToBase64String(file);
  //     // this.base64String = await this.fileToBase64String(file);
  //     /* const reader = new FileReader();
  //     reader.onload = (event: any) => {
  //       this.base64String = (reader.result as string).split(',')[1];
  //     };
  //     reader.onerror = () => {
  //       console.error('Error reading file');
  //     };
  //     reader.readAsDataURL(file); */
  //   }
  // } 

  async onFileSelected() {
    const file: File = this.fileInput.nativeElement.files[0];
    if (file) {
      this.fileName = file.name; // Set file name
      this.fileType = file.type;
      this.fileSize = this.getFileSizeString(file);
      this.uint8Array = await this.fileToUint8Array(file);


      this.isImage = this.isImageFile(file);
      this.isImage = file.type.startsWith('image');
      this.previewUrl = await this.readFileAndReturnImageUrl(file);
  
      // // Show preview for the selected file
      // this.isImage = file.type.startsWith('image'); // Check if the file is an image
      // const reader = new FileReader();
      // reader.onload = () => {
      //   this.previewUrl = reader.result; // Set the preview URL
      // };
      // reader.readAsDataURL(file); // Read the file as a data URL
    }
  }



 

  async downloadFileFromUrl(url: string) {
    try {
      const response = await firstValueFrom(this.http.get(url, { responseType: 'blob' }));
  
      // Check if response is undefined
      if (!response) {
        throw new Error('Failed to download file from the provided URL.');
      }
  
      const file = new File([response], this.getFileNameFromUrl(url), { type: response.type });
  
      this.fileName = decodeURIComponent(file.name);
      this.fileType = file.type;
      this.fileSize = this.getFileSizeString(file);
      this.uint8Array = await this.fileToUint8Array(file);
  
      // Show preview for the downloaded file
      this.isImage = file.type.startsWith('image'); // Check if the file is an image
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result; // Set the preview URL
      };
      reader.readAsDataURL(file); // Read the file as a data URL
    } catch (error) {
      console.error('Error downloading file from URL:', error);
      alert('Failed to download file from the provided URL.');
    }
  }


  getFileNameFromUrl(url: string): string {
    // Extract the file name from the URL
    return url.substring(url.lastIndexOf('/') + 1);
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
  


  previewFromUrl(url: string) {
    this.isImage = url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.png') || url.endsWith('.gif');
    if (this.isImage) {
      this.previewUrl = url; // Directly set the URL for image preview
    } else {
      this.previewUrl = null; // Clear preview if the URL is not an image
    }
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




  convertFileToUint8Array(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(new Uint8Array(reader.result));
        } else {
          reject(new Error("File could not be read as an ArrayBuffer"));
        }
      };
  
      reader.onerror = () => reject(new Error("Error reading file"));
      
      reader.readAsArrayBuffer(file);
    });
  }


  readFileAndReturnImageUrl(file: File): Promise<string | ArrayBuffer | null> {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null); // If no file is provided, return null
      return;
    }

    if (!file.type.startsWith('image')) {
      resolve(null); // If the file is not an image, return null
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result); // Resolve with the image URL
    reader.onerror = (error) => reject(error); // Reject if an error occurs

    reader.readAsDataURL(file); // Read the file as a Data URL
  });
}


isImageFile(file: File): boolean {
  return file && file.type.startsWith('image');
}


  ngOnDestroy(): void {
    this.addPropSubscription?.unsubscribe();
  }
}