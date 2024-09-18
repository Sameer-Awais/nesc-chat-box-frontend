import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {
  private socket: WebSocket;

  constructor() {
    // Establish the WebSocket connection
    this.socket = new WebSocket('ws://localhost:8000/ws/chat/');
    
    // Handle incoming messages
    this.socket.onmessage = (event) => {
      const messageData = JSON.parse(event.data);
      console.log('New message received:', messageData);
    };

    // Handle connection errors
    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Handle connection close
    this.socket.onclose = () => {
      console.log('WebSocket connection closed');
    };
  }

  // Send a message to the WebSocket server
  sendMessage(message: any): void {
    const messageString = JSON.stringify(message);
    this.socket.send(messageString);
  }
}
