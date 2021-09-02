import { Injectable } from '@angular/core';
import { IpcRenderer } from 'electron';

//Based on https://dev.to/michaeljota/integrating-an-angular-cli-application-with-electron---the-ipc-4m18

@Injectable({
    providedIn: 'root'
})
export class IpcService {
  private _ipc: IpcRenderer | undefined = void 0;

  constructor() {
    if (window.require) {
      try {
        this._ipc = window.require('electron').ipcRenderer;
      } catch (e) {
        throw e;
      }
    } else {
      console.error('Electron\'s IPC was not loaded');
    }
  }

  public on(channel: string, listener: any) {
    if (!this._ipc) {
      return;
    }
    this._ipc.on(channel, listener);
  }

  public send(channel: string, ...args: any): void {
    if (!this._ipc) {
      return;
    }
    this._ipc.send(channel, ...args);
  }

}