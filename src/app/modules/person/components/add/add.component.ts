import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PersonService } from '../../services/person.service';

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.scss']
})
export class AddComponent implements OnDestroy {

  @ViewChild('fileInput') fileInput: any; // ফাইল ইনপুট রেফারেন্স
  imagePreview: string | ArrayBuffer | null = null; // ইমেজ প্রিভিউ URL

  personForm = new FormGroup({
    name: new FormControl(''), // নামের ফর্ম কন্ট্রোল
    city: new FormControl('') // শহরের ফর্ম কন্ট্রোল
  });

  private addPersonSubscription?: Subscription; // সাবস্ক্রিপশন ভেরিয়েবল

  constructor(private personService: PersonService, private router: Router) {}

  // ফাইল নির্বাচন করলে ইমেজ প্রিভিউ দেখানো
  onFileChange(event: any) {
    const file = event.target.files[0]; // নির্বাচিত ফাইল
    if (file) {
      const reader = new FileReader(); // ফাইল রিডার তৈরি
      reader.onload = () => {
        this.imagePreview = reader.result; // ইমেজ প্রিভিউ সেট করা
      };
      reader.readAsDataURL(file); // ফাইলটি ডেটা URL হিসেবে পড়া
    }
  }

  // ফর্ম সাবমিট
  onFormSubmit() {
    const file: File = this.fileInput.nativeElement.files[0]; // নির্বাচিত ফাইল

    // ফাইল সাইজ চেক (6KB)
    const maxSizeInKB = 6;
    if (file && file.size > maxSizeInKB * 1024) {
      alert('File size exceeds the maximum limit of 6KB. Please choose a smaller file.');
      return; // ফর্ম সাবমিশন বন্ধ
    }

    const formData: FormData = new FormData(); // ফর্ম ডেটা তৈরি
    formData.append('name', this.personForm.value.name as string); // নাম যোগ করা
    formData.append('city', this.personForm.value.city as string); // শহর যোগ করা
    formData.append('file', file); // ফাইল যোগ করা

    this.addPersonSubscription = this.personService.addPerson(formData).subscribe({
      next: (response) => {
        this.router.navigateByUrl('/person'); // সফল হলে ব্যক্তির লিস্ট পেজে রিডাইরেক্ট
      }
    });
  }

  ngOnDestroy(): void {
    this.addPersonSubscription?.unsubscribe(); // সাবস্ক্রিপশন বন্ধ
  }
}