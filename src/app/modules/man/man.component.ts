import { Component, OnInit } from '@angular/core';
import { ManService } from './services/man.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-man',
  templateUrl: './man.component.html',
  styleUrls: ['./man.component.scss']
})
export class ManComponent implements OnInit {

  men: any[] = [];

  constructor(private manService: ManService, private http: HttpClient, private sanitizer: DomSanitizer) {
  }

  ngOnInit(): void {
    this.loadMen();
  }

  loadMen(): void {
    this.manService.getAllMen().subscribe(records => {
      records.forEach(record => {
        
        // byte[] is being serealised as Base64String in Angular "record.imagebytes"
        // JSON এ byte[] ডেটা সাধারণত Base64String হিসেবে সিরিয়ালাইজড হয়।
        // Man অবজেক্ট তৈরি
        var object: any = {
          id: record.id,
          name: record.name,
          filename: record.filename,
          filetype: record.filetype,
          size: record.filesize,
          image: this.Base64StringToImageSRC(record.base64string),
          uint8array: this.Base64StringToUint8Array(record.base64string)
        };

        this.men.push(object);
      });
    });
    console.log(this.men);
  }

  DownloadFile(uInt8Array: Uint8Array, fileType: string, filename: string) {
    const blob = new Blob([uInt8Array], { type: fileType });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }

  onDirectDelete(id: number): void {        /* Solution here- https://chatgpt.com/c/1d0b8798-e9ed-4277-8db9-f846a49c464a */
    if (id) {
      this.manService.deleteMan(id)
        .subscribe(() => {
          this.men = this.men.filter(man => man.id !== id);
        });
    }
  }





  Base64StringToImageSRC(base64String: string): SafeUrl {
    return `data:image/png;base64,${base64String}`;
  }



  Base64StringToBlobFile(base64String: string, fileType: string):Blob {
    // Base64String কে Blob এ রূপান্তর
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const uInt8Array = new Uint8Array(byteNumbers);
    const blob = new Blob([uInt8Array], { type: fileType });
    return blob;
  }




  BlobFileToBlobFileURL(blob: Blob):SafeUrl {
    // Blob File কে BlobURL এ রূপান্তর
    // Blob কে Safe URL এ রূপান্তর
    const blobUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob));

    return blobUrl;
  }




  Base64StringToBlobFileURL(base64String: string, fileType: string):SafeUrl {
    // Base64String কে BlobURL এ রূপান্তর
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const uInt8Array = new Uint8Array(byteNumbers);
    const blob = new Blob([uInt8Array], { type: fileType });

    // Blob কে Safe URL এ রূপান্তর
    const blobUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob));

    return blobUrl;
  }




  Base64StringToUint8Array(base64String: string):Uint8Array {
    // Base64String কে Uint8Array এ রূপান্তর
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const uInt8Array = new Uint8Array(byteNumbers);
    return uInt8Array;
  }














// Some method have not been tested yet
//Please test the following methods before using them


Uint8ArrayToBase64String(uInt8Array: Uint8Array): string {
  // Uint8Array কে binary string এ রূপান্তর
  let binaryString = '';
  uInt8Array.forEach(byte => {
    binaryString += String.fromCharCode(byte);
  });

  // binary string কে Base64String এ রূপান্তর
  const base64String = btoa(binaryString);
  return base64String;
}



// ByteArrayToBase64String(byteArray: any): string {
//   // প্রথমে byteArray এর মান যাচাই করুন
//   if (!byteArray) {
//     console.error('byteArray is null or undefined');
//     return '';
//   }

//   // byte[] কে Uint8Array এ রূপান্তর
//   const uint8Array = new Uint8Array(byteArray);
//   console.log('uint8Array:', uint8Array);

//   // Uint8Array কে binary string এ রূপান্তর
//   let binaryString = '';
//   uint8Array.forEach(byte => {
//     binaryString += String.fromCharCode(byte);
//   });

//   // binary string কে Base64String এ রূপান্তর
//   const base64String = btoa(binaryString);
//   return base64String;
// }



ArrayBufferToBase64String(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  console.log(bytes);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}


ByteArrayToBase64String(byteArray: any): string {
  if (!byteArray || byteArray.length === 0) {
    console.error('byteArray is null, undefined, or empty.');
    return '';
  }

  // Ensure byteArray is Uint8Array
  const uint8Array = new Uint8Array(byteArray);
  console.log(uint8Array);

  let binaryString = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }

  return btoa(binaryString);
}

  
}