import { Component, OnDestroy, ViewChild } from "@angular/core";
import { Subscription } from "rxjs/internal/Subscription";
import { ItemService } from "../../services/item.service";
import { Router } from "@angular/router";
import { FormControl, FormGroup } from "@angular/forms";
import { Item } from "../../models/item.model";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { SignalrService } from "../../../../services/signalr.service";


@Component({
  selector: 'app-add-item',
  templateUrl: './add-item.component.html',
  styleUrl: './add-item.component.scss'
})
export class AddItemComponent implements OnDestroy {

  fileForm = new FormGroup({
      file: new FormControl(), // Initialize the file input control
      remoteUrl: new FormControl(), // Remote URL input control
      serverUpload: new FormControl() // Remote URL input control
    });

  // @ViewChild('fileInput') fileInput: any;
  @ViewChild('fileInput', { static: false }) fileInput: any;



  private addItemSubscription?: Subscription;
  fileName: string = ''; // Default to empty string if undefined
  fileType: string = ''; // Default to empty string if undefined
  fileSize: string = ''; // Default to empty string if undefined
  base64String: string = ''; // Directly using FormGroup element
  previewUrl: string | ArrayBuffer | null = null; // For file or URL preview
  isImage: boolean = false; // To check if the file is an image


  uploadProgress: number = 0;
  downloadProgress: number = 0;
  showUploadProgress: boolean = false;
  showDownloadProgress: boolean = false;


  isConnecting: boolean = false;


  constructor(private itemService: ItemService, private router: Router, private http: HttpClient, private signalrService: SignalrService) {}


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


    // Listen for upload progress updates
    this.signalrService.getHubConnection().on('UploadProgress', (progress: number) => {
      this.uploadProgress = progress;
      this.showUploadProgress = true;
    });

    // Listen for download progress updates
    this.signalrService.getHubConnection().on('DownloadProgress', (progress: number) => {
      this.downloadProgress = progress;
      this.showDownloadProgress = true;
    });
  }


  async onFormSubmit() {

    this.isConnecting = true; // লোডিং স্পিনার দেখান

  const connectionsId = await this.signalrService.waitForConnectionId(); // সংযোগ ID পাওয়ার জন্য অপেক্ষা করুন
  if (!connectionsId) {
    console.error("SignalR connection ID is not available yet!");
    this.isConnecting = false; // লোডিং স্পিনার লুকান
    return;
  }

  this.isConnecting = false; // লোডিং স্পিনার লুকান


    const serverUpload = this.fileForm.get('serverUpload')?.value;
    const remoteUrl = this.fileForm.get('remoteUrl')?.value;
  
    if (serverUpload) {
      // If server upload URL is provided, send the URL to the backend
      try {
        const response = await firstValueFrom(this.itemService.uploadFromUrl(serverUpload, connectionsId));
        console.log('Response:', response);
        this.router.navigateByUrl('/item');
      } catch (error) {
        console.error('Error occurred:', error);
      }
    } else if (remoteUrl) {
      // If remote URL is provided, download the file from the URL
      await this.downloadFileFromUrl(remoteUrl);
    } else {
      // If no remote URL, proceed with the file upload logic
      const file: File = this.fileInput.nativeElement.files[0];
      if (file) {
        this.fileName = file.name;
        this.fileType = file.type;
        this.fileSize = this.getFileSizeString(file);
        this.base64String = await this.fileToBase64String(file);
      }
    }
  
    if (!serverUpload) {
      const item: Item = {
        filename: this.fileName,
        filetype: this.fileType,
        filesize: this.fileSize,
        filestring: this.base64String,
        connectionId: connectionsId
      };
  
      this.addItemSubscription = this.itemService.addItem(item).subscribe({
        next: (response) => {
          console.log('Response:', response);
          this.router.navigateByUrl('/item');
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
      this.base64String = await this.fileToBase64String(file);
  
      // Show preview for the selected file
      this.isImage = file.type.startsWith('image'); // Check if the file is an image
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result; // Set the preview URL
      };
      reader.readAsDataURL(file); // Read the file as a data URL
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
      this.base64String = await this.fileToBase64String(file);
  
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
  
  




  ngOnDestroy(): void {
    this.addItemSubscription?.unsubscribe();
  }
}