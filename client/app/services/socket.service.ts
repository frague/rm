import { Injectable } from '@angular/core';
import { Socket } from 'ng-socket-io';

@Injectable()
export class SocketService {

  constructor(private socket: Socket) {}

  sendMessage(msg: string){
    this.socket.emit('message', msg);
  }

  getMessage() {
    return this.socket
      .fromEvent('message')
      .map((data: any) => {
        console.log(data);
        return data.msg;
      });
  }

  subscribe(callback) {
    this.socket.on('message', data => callback(data));
    this.socket.on('state', data => callback('', data));
  }

  unsubscribe() {
    this.socket.removeAllListeners('message');
  }
}