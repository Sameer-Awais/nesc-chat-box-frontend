import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: WebSocket;
  private messageSubject: Subject<any> = new Subject<any>();

  connect(roomName: string) {
    const url = `ws://localhost:8000/ws/chat/${roomName}/`;  // Ensure the URL matches the backend route
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('WebSocket connection established');
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.messageSubject.next(data);  // Pass the incoming message to subscribers
    };

    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  sendMessage(message: string, sender: string) {
    // alert(message);
    // alert(sender);
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const messageData = JSON.stringify({ message, sender });
      this.socket.send(messageData);  // Ensure the message is being sent correctly
    } else {
      console.error('WebSocket connection is not open');
    }
  }

  getMessages(): Observable<any> {
    return this.messageSubject.asObservable();
  }
}
