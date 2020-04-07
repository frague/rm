import { Injectable } from '@angular/core';
import { SocketController, OnConnect, OnDisconnect, OnSocketEvent, SocketService } from 'a4-socket-io';
import { map } from 'rxjs/operators';

const dummyCallback = (message: string, status: string = '') => {};

@SocketController('localhost:3030')
@Injectable()
export class SocketIOService {
  private _callback = dummyCallback;

  constructor(private socket: SocketService) {}

  sendMessage(message: string, type: string = 'message') {
    this.socket.emit(type, message);
  }

  @OnSocketEvent('message')
  getMessage(message: string) {
    this._callback(message);
    console.log(`Socket message: ${message}`);
  }

  @OnSocketEvent('status')
  getstatus(status: string) {
    this._callback('', status);
    console.log(`Socket status: ${status}`);
  }

  subscribe(callback) {
    this._callback = callback;
  }

  unsubscribe() {
    this._callback = dummyCallback;
  }

  @OnConnect()
  connect() {
    console.log(`Socket connected`);
  }

  @OnDisconnect()
  disconnect() {
    console.log(`Socket disconnected`);
  }
}