import { Injectable } from '@angular/core';
import { IpcService } from './ipc.service';

@Injectable({
  providedIn: 'root'
})
export class FileSelectorService {
  constructor(private readonly _ipc: IpcService) {}

  selectVideo(): Promise<string> {
    return new Promise((resolve, reject) => {
      this._ipc.on('fileSelected', (event: any, filePath: string) => {
        resolve(filePath);
      });
      this._ipc.send('selectFile');
    });
  }
}
