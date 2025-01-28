import { Component, OnInit } from '@angular/core';
import { ManService } from './services/man.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-man',
  templateUrl: './man.component.html',
  styleUrl: './man.component.scss'
})
export class ManComponent implements OnInit{

  
  men : any[] = [];

  constructor(private manService: ManService, private http: HttpClient, private sanitizer: DomSanitizer) {
  }

  ngOnInit(): void {
    this.loadMen();
  }



  loadMen():void {
    this.manService.getAllMen().subscribe(records => {
      records.forEach(record => {


        const blobFile = new Blob([record.imagebytes], {type : record.filetype});
        //const blobUrl = window.URL.createObjectURL(blobFile);

        const blobUrl = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blobFile));
        //var src = 'data:image/jpeg;base64,' + record.imagebytes;
        

            var object:any = {
              id : record.id,
              name : record.name,
              filename : record.filename,
              filetype: record.filetype,
              //image : src
              image: blobUrl,
              imagebytes: record.imagebytes
           };
    
           this.men.push(object);
          });
    });
    console.log(this.men);
  }





  DownloadFile(imageBytes:any, contentType:string, filename:string){
      const blob = new Blob([imageBytes], { type: contentType }); // you can change the type
      // const url= window.URL.createObjectURL(blob);
      // window.open(url);
      // FileSaver.saveAs(blob, filename);
      //console.log("Success");

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
  }




  // onDirectDelete(id: number): void {        /* Solution here- https://chatgpt.com/c/1d0b8798-e9ed-4277-8db9-f846a49c464a */
  //   if (id) {
  //     this.personService.deletePerson(id)
  //       .subscribe(() => {
  //         this.persons = this.persons.filter(person => person.id !== id);
  //       });
  //   }
  // }


}