import { Component, OnInit } from '@angular/core';
import { PropService } from '../../service/prop.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment.development';

@Component({
  selector: 'app-prop',
  templateUrl: './prop.component.html',
  styleUrl: './prop.component.scss'
})
export class PropComponent implements OnInit {

  props: any[] = [];

  constructor(private propService: PropService, private http: HttpClient, private sanitizer: DomSanitizer) {
  }

  ngOnInit(): void {
    this.loadProps();
  }

  loadProps(): void {
    this.propService.getAllProps().subscribe(records => {
      records.forEach(record => {
        console.log(typeof(record.filename));
        // byte[] is being serealised as Base64String in Angular "record.imagebytes"
        // JSON এ byte[] ডেটা সাধারণত Base64String হিসেবে সিরিয়ালাইজড হয়।
        // Man অবজেক্ট তৈরি
        var object: any = {
          id: record.id,
          filename: record.filename,
          filetype: record.filetype,
          size: record.filesize,
          image: this.Base64StringToImageSRC(this.Uint8ArrayToBase64String(new Uint8Array(record.filedata))),
          uint8array: this.Base64StringToUint8Array(this.Uint8ArrayToBase64String(new Uint8Array(record.filedata)))
        };

        /* console.log(this.getFileType(record.imagebytes));
        console.log(typeof record.imagebytes)
        console.log(typeof byteArray); // এটি object হওয়া উচিত
        console.log(byteArray instanceof Uint8Array); // এটি true হওয়া উচিত */

        this.props.push(object);
      });
      // console.log(records);
    });
    //console.log(this.items);
  }


  generateDownloadLink(propId: number): void {
    this.http.post<{ downloadLink: string }>(`${environment.personApiBaseUrl}/prop/generate-download-link/${propId}`, {})
        .subscribe({
            next: (response) => {
                const downloadLink = response.downloadLink;
                alert(`Download Link: ${downloadLink}`);
                navigator.clipboard.writeText(downloadLink).then(() => {
                    alert('Download link copied to clipboard!');
                });
            },
            error: (error) => {
                console.error('Error generating download link:', error);
            }
        });
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
      this.propService.deleteProp(id)
        .subscribe(() => {
          this.props = this.props.filter(prop => prop.id !== id);
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



  Base64StringToFile(base64String: string, fileType: string, fileName: string): File {
    // Base64String কে Blob এ রূপান্তর
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const uInt8Array = new Uint8Array(byteNumbers);
    const blob = new Blob([uInt8Array], { type: fileType });
  
    // Convert Blob to File
    const file = new File([blob], fileName, { type: fileType, lastModified: Date.now() });
    return file;
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