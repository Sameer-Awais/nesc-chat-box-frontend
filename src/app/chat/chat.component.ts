import { Component, OnInit } from '@angular/core';
import { ChatService } from 'src/services/chat.service';
import { AuthService } from 'src/services/auth.service';
import { WebsocketService } from 'src/services/websocket.service';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  message = '';
  messages: { sender: string, message: string }[] = [];
  user: any = null;
  otherUser: string = '';  // Store the name of the user you want to chat with

  users = [];

  currentUser = { username: 'Current User' };  // Replace this with the actual logged-in user

  selectedUser: any = null;
  newMessage = '';

  constructor(private chatService: ChatService, private authService: AuthService, private router: Router,) {}

  ngOnInit(): void {
    // Retrieve user details from localStorage
    this.user = JSON.parse(localStorage.getItem('user')!);
    if (!this.user) {
      console.error('User not found in localStorage, redirect to login');
      // Optionally, redirect to login if no user is found
    }

    this.getUsers();
  }

  getUsers(){
    this.authService.getUsers().subscribe(
      (res: any[]) => {
        if(this.user.username === 'DG(QM)'){
          const filteredUsers = res.filter(item => (item.username !== this.user.username) && (item.username !== 'admin'));
          this.users = filteredUsers;
        }
        else{
          const filteredUsers = res.filter(item => (item.username === 'DG(QM)') && (item.username !== 'admin'));
          this.users = filteredUsers;
        }
      },
      (error) => {
        console.error('Error fetching users:', error);
      }
    );
  }

  selectUser(user: any) {
    this.selectedUser = user;
    this.messages = [];  // Clear messages for the new chat session
    // Logic to load chat history from the backend can go here
    if (this.selectedUser) {
      // alert(this.selectedUser);
      // Create a unique room name using both users' usernames
      const roomName = this.generateRoomName(this.user.username, this.selectedUser.username);
      this.chatService.connect(roomName);

      // Subscribe to messages coming from WebSocket
      this.chatService.getMessages().subscribe((data: any) => {
        this.messages.push({ sender: data.sender, message: data.message });
      });
    }
  }

  isSelected(user: any): boolean {
    return this.selectedUser && this.selectedUser.username === user.username;
  }

  // Helper function to generate a unique room name
  generateRoomName(user1: string, user2: string): string {
    return [user1, user2].sort().join('_');  // Sorting ensures both users generate the same room name
  }

  // Method to send a message
  sendMessage() {
    // alert(this.newMessage)
    if (this.newMessage.trim()) {
      this.chatService.sendMessage(this.newMessage, this.user.username);  // Send message with the user's name
      this.newMessage = '';  // Clear the input field after sending
    }
  }

  logout() {
    this.authService.logout().subscribe(response => {
      // Clear localStorage and cookies
      localStorage.clear();
      this.router.navigate(['/login']);
    });
  }
  
}
