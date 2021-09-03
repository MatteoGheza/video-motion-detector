import { Injectable } from '@angular/core';

declare var window: any;

@Injectable({
  providedIn: 'root'
})
export class FileSelectorService {
  constructor() {}

  selectVideo(): Promise<any> {
    return new Promise((resolve, reject) => {
      window.eel.python_open_file_dialog()((response: any) => {
        resolve(response);
      });
    });
  }
}
