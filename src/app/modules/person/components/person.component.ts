import { Component, OnInit } from '@angular/core';
import { PersonService } from '../services/person.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrl: './person.component.scss'
})
export class PersonComponent implements OnInit{

  //person$?: Observable<Person[]>;
  // person : Person[] = [];
  persons : any[] = [];
  // persons2 : any[] = [];

  constructor(private personService: PersonService, private http: HttpClient, private sanitizer: DomSanitizer) {
  }

  ngOnInit(): void {
    //this.person$ = this.personService.getAllPersons();

  //   this.person$.subscribe(res => {
  //     console.log(res);
  //     // this.data = res;
  //  });

  //   this.personService.getAllPersons().subscribe(res => {
  //     console.log(res);
  //     // this.data = res;
  //  });



    // this.personService.getAllPersons().subscribe( data => {
    //   this.person = data;
    //   // console.log(this.person);
    //   this.person.forEach(record => {
    //     var object:any = {
    //       id : record.id,
    //       name : record.name,
    //       city : record.city
    //    }

    //    this.persons2.push(object);
    //   });
    // });
    // console.log(this.persons2);


    this.loadPerson();
  }



  loadPerson():void {
    this.personService.getAllPersons().subscribe(records => {
      records.forEach(record => {
        // const bblob = new Blob([record.filebytes]); // you can change the type
        // const uurl= window.URL.createObjectURL(bblob);



        // const byteData = new Uint8Array(record.filebytes);
        // const bloob = new Blob([byteData], { type: record.filetype });
        // const bloburl = window.URL.createObjectURL(bloob);
        // window.open(bloburl);



        
        var src = 'data:image/jpeg;base64,' + record.filebytes;
        // const bblob = new Blob([record.filebytes], {type : 'image/jpeg'}); // you can change the type
        // const uurl= window.URL.createObjectURL(bblob);

        // const blop = this.getBlob(record.id as number, record.filetype);
        // const urll = window.URL.createObjectURL(blop);
        // if (blop)
        // {
        //     const urll = window.URL.createObjectURL(blop);
        // }
        // else
        // {
        //     console.log("Something is wrong on blob");
        // }





        // let memoryStreamm:any;


        // this.http.get(`https://ng.somee.com/api/person/file/${record.id}`, {responseType: 'blob'})
        // .subscribe((memoryStream: Blob) => {
        //   memoryStreamm = memoryStream;
        // });

        // const blobFile = new Blob([memoryStreamm], {type : record.filetype});
        // const blobUrl = window.URL.createObjectURL(blobFile);



        let memoryStream:any = this.getFileMemoryStream(record.id as number);
        const blobFile = new Blob([memoryStream], {type : record.filetype});
        //const blobUrl = window.URL.createObjectURL(blobFile);

        const blobUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blobFile));
        



            var object:any = {
              id : record.id,
              name : record.name,
              city : record.city,
              filename : record.filename,
              image : src,
              type : record.filetype,
              size : record.filesize,
              blob : blobFile,
              url : blobUrl
           };
    
           this.persons.push(object);
          //  window.open(object.url)
          //  FileSaver.saveAs(bblob, record.filename);
          });
    });
    console.log(this.persons);
  }






// getBlob(id:number, contentType:string):any {
//   // var obs = this.personService.getFileAsync(id);
//   // obs.subscribe((memoryStream: Blob) => {
//   //   const blob = new Blob([memoryStream], {type: contentType});
//   //   const url= window.URL.createObjectURL(blob);
//   //   window.open(url);
//     // return blob;
//   // });
//   // this.personService.getFileAsync(id).subscribe((memoryStream: Blob) => {
//   //   const blob = new Blob([memoryStream], { type: contentType });
//   //   console.log(blob);
//   //   // blob = blobb;
//   //   return blob;
//   // });

//   // return blob;




//   this.http.get(`https://ng.somee.com/api/person/file/${id}`, {responseType: 'blob'})
//     .subscribe((memoryStream: Blob) => {
//       const blob = new Blob([memoryStream], { type: contentType }); // you can change the type
//       // const url= window.URL.createObjectURL(blob);
//       // window.open(url);
//       // console.log("Success");
//       return blob;
//     });
// }



// DownloadFile(id:number, contentType:string){
//   // var obs = this.personService.getFileAsync(id);
//   // obs.subscribe((memoryStream: Blob) => {
//   //   const blob = new Blob([memoryStream], {type: contentType});
//   //   const url= window.URL.createObjectURL(blob);
//   //   window.open(url);
//     // return blob;
//   // });
//   // this.personService.getFileAsync(id).subscribe((memoryStream: Blob) => {
//   //   const blob = new Blob([memoryStream], { type: contentType });
//     //console.log(blob);
//     // blob = blobb;
//     // return blob;
//   // });

//   // return blob;




//   // return this.http.get(`https://ng.somee.com/api/person/file/${id}`, {responseType: 'blob'})
//   // .subscribe((memoryStream: Blob) => {
//   //   const blob = new Blob([memoryStream], { type: contentType }); // you can change the type
//   //   const url= window.URL.createObjectURL(blob);
//   //   window.open(url);
//   //   console.log("Success");
//   // });


//   return this.personService.getFileAsync(id).subscribe((memoryStream: Blob) => {
//     const blob = new Blob([memoryStream], { type: contentType }); // you can change the type
//     const url= window.URL.createObjectURL(blob);
//     window.open(url);
//     console.log("Success");
//   });
// }

  // const blob = new Blob([byte], {type: string});





  getFileMemoryStream(id:number):any{
    this.personService.getFileAsync(id).subscribe((memoryStream: Blob) => {
      return memoryStream;
    });
  }

  DownloadFile(id:number, contentType:string, filename:string){
    return this.personService.getFileAsync(id).subscribe((memoryStream: Blob) => {
      const blob = new Blob([memoryStream], { type: contentType }); // you can change the type
      // const url= window.URL.createObjectURL(blob);
      // window.open(url);
      // FileSaver.saveAs(blob, filename);
      //console.log("Success");

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    });
  }











  onDirectDelete(id: number): void {        /* Solution here- https://chatgpt.com/c/1d0b8798-e9ed-4277-8db9-f846a49c464a */
    if (id) {
      this.personService.deletePerson(id)
        .subscribe(() => {
          this.persons = this.persons.filter(person => person.id !== id);
        });
    }
  }


}