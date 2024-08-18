import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PersonService } from '../../services/person.service';

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrl: './add.component.scss'
})
export class AddComponent implements OnDestroy{

  @ViewChild('fileInput') fileInput: any;

  personForm = new FormGroup({
    name: new FormControl(''),
    city: new FormControl('')
  });

  
  private addPersonSubscribtion?: Subscription;
 

  constructor(private personService: PersonService,
    private router: Router) {}



  onFormSubmit() {
    let file:File = this.fileInput.nativeElement.files[0];



    // Check if the file size exceeds 6KB (6 * 1024 bytes)
    const maxSizeInKB = 6;
    if (file && file.size > maxSizeInKB * 1024) {
      alert('File size exceeds the maximum limit of 6KB. Please choose a smaller file.');
      return; // Stop form submission
    }


    

    const formData: FormData = new FormData();
    formData.append('name', (this.personForm.value.name) as string);
    formData.append('city', (this.personForm.value.city) as string);
    formData.append('file', file);
    
    this.addPersonSubscribtion = this.personService.addPerson(formData)
    .subscribe({
      next: (response) => {
        this.router.navigateByUrl('/person');
      }
    });
    
  }


  ngOnDestroy(): void {
    this.addPersonSubscribtion?.unsubscribe();
  }

}
