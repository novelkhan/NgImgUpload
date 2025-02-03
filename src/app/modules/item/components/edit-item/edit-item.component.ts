import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ItemService } from '../../services/item.service';
import { Item } from '../../models/item.model';
import { SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-edit-item',
  templateUrl: './edit-item.component.html',
  styleUrls: ['./edit-item.component.scss']
})
export class EditItemComponent implements OnInit {

  itemForm = new FormGroup({
    filename: new FormControl(''),
    filetype: new FormControl(''),
    filesize: new FormControl(''),
    filestring: new FormControl('')
  });

  file: File | null = null;
  itemId: number | null = null;

  // Variables for image previews
  oldImagePreview: SafeUrl | null = null; // Holds the old image preview URL
  newImagePreview: string | null = null; // Holds the new image preview URL

  constructor(
    private itemService: ItemService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.itemId = +this.route.snapshot.paramMap.get('id')!;
    this.loadItem(this.itemId);
  }

  loadItem(id: number): void {
    this.itemService.getItemById(id).subscribe({
      next: (item) => {
        // Log the item data for debugging
        console.log('Item loaded:', item);

        // Check if filestring is already a data URL
        if (item.filestring.startsWith('data:')) {
          // If filestring already includes the data URL prefix, use it directly
          this.oldImagePreview = item.filestring;
        } else {
          // If filestring is a pure base64 string, construct the data URL
          this.oldImagePreview = this.Base64StringToImageSRC(item.filestring, item.filetype);
        }

        // Log the oldImagePreview for debugging
        console.log('oldImagePreview:', this.oldImagePreview);

        // Patch the form with existing item data
        this.itemForm.patchValue({
          filename: item.filename,
          filetype: item.filetype,
          filesize: item.filesize,
          filestring: item.filestring
        });
      },
      error: (error) => {
        console.error('Error loading item:', error);
      }
    });
  }

  onFileChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.file = file;

      // Set the new image preview
      this.fileToBase64String(file).then(base64String => {
        this.newImagePreview = `data:${file.type};base64,${base64String}`;

        // Patch the form with new file data
        this.itemForm.patchValue({
          filestring: base64String,
          filename: file.name,
          filetype: file.type,
          filesize: this.getFileSizeString(file)
        });
      });
    }
  }

  onFormSubmit(): void {
    if (this.itemForm.valid && this.itemId) {
      const item: Item = {
        id: this.itemId,
        filename: this.itemForm.value.filename!,
        filetype: this.itemForm.value.filetype!,
        filesize: this.itemForm.value.filesize!,
        filestring: this.itemForm.value.filestring!
      };

      this.itemService.updateItem(this.itemId, item).subscribe({
        next: () => {
          this.router.navigateByUrl('/item');
        },
        error: (error) => {
          console.error('Error updating item:', error);
        }
      });
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

  Base64StringToImageSRC(base64String: string, filetype: string): SafeUrl {
    return `data:${filetype};base64,${base64String}`;
  }
}