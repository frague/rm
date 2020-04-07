import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import io from 'socket.io-client';

const socket = io('http://localhost:3030');
const dummyCallback: Function = (message: string, status: string = '') => {
  console.log('This is dummy callback: ', message, status);
};

@Injectable()
export class SocketService {
  private _callback = dummyCallback;

  constructor() {
    socket.on('connect', () => this.connect());
    socket.on('disconnect', socket.open);  // Reconnecting on disconnect
    socket.on('message', message => {
      // console.log(`[Socket] Message: ${message}`);
      this._callback(message);
    });
    socket.on('status', status => {
      // console.log(`[Socket] Status: ${JSON.stringify(status)}`);
      this._callback('', status);
    });
    // setInterval(() => {this._callback(null, null)}, 1000);
  }

  sendMessage(message: string, type: string = 'message') {
    socket.emit(type, message);
  }

  connect() {
    // console.log('[Socket] Connected');
  }

  subscribe(callback: Function) {
    // console.log('! Subscribed');
    this._callback = callback;
  }

  unsubscribe() {
    // console.log('!! Unubscribed');
    this._callback = dummyCallback;
  }
}