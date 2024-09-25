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
  superadmin: boolean = false;
  user_id: number = 0;
  message = '';
  messages: { sender: string, message: string }[] = [];
  user: any = null;
  otherUser: string = '';  // Store the name of the user you want to chat with
  receiver: string = "";
  users = [];

  currentUser = { user_id: 0 };  // Replace this with the actual logged-in user

  selectedUser: any = null;
  newMessage = '';
  receiver_name: string="";
  constructor(private chatService: ChatService, private authService: AuthService, private router: Router,) {}

  ngOnInit(): void {
    // Retrieve user details from localStorage
    this.user = JSON.parse(localStorage.getItem('user')!);
    this.superadmin = JSON.parse(localStorage.getItem('superadmin'));
    if(this.superadmin != true){
      this.receiver = this.user.id;
      this.receiver_name = 'DG(QM)'
      this.fetchMessages();
    }else{
      this.user_id = 1;
      this.fetchMessages();

    }
    this.currentUser.user_id = this.user_id;
    console.log('current user is:',this.user);
    if (!this.user) {
      console.error('User not found in localStorage, redirect to login');
      // Optionally, redirect to login if no user is found
    }

    this.getUsers();
  }

  getUsers(){
    var list= [];
this.chatService.getUsers().subscribe(
  (res: any) => {
    console.log(this.user.username);
    
    // Access the array from the 'data' field
    const usersArray = res.data; 

    if (Array.isArray(usersArray)) {
      if (this.user.username === 'DGQM') {
        const filteredUsers = usersArray.filter(item => (item.username !== this.user.username) && (item.username !== 'admin'));
        this.users = filteredUsers;
      } else {
        const filteredUsers = usersArray.filter(item => (item.username === 'DGQM') && (item.username !== 'admin'));
        this.users = filteredUsers;
      }
    } else {
      console.warn('Data is not an array:', usersArray);
    }
  },
  (error) => {
    console.error('Error fetching users:', error);
  }
);

  }

  selectReceiver(user: any) {
    if(this.superadmin != true){
      this.receiver = this.user.id;
      this.fetchMessages();
    }else{
      this.user_id = 1;
      this.receiver = user.id;
      this.fetchMessages();
      
    }
    this.receiver_name = user.username;
    console.log('my receiver is:',this.receiver)
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
    console.log('current user:',this.user_id, 'receiver:',this.receiver, 'message:',this.newMessage);
    var result = this.chatService.sendMessage(
      this.user_id, 
      this.receiver,
      this.newMessage).subscribe((response: any) => {
      console.log(response)
      if(response.success == true){
        this.fetchMessages();
        this.newMessage = "";
      }
    }, err => {
      return "NotAuthorized";
    });
  }

   fetchMessages() {
    this.chatService
      .fetchMessages(this.user_id,this.receiver)
      .subscribe((response: any) => {
        this.messages = response.data;
        console.log('this is the list of messages',this.messages);
      });
  }
  logout() {
    this.authService.logout();  // If logout is a synchronous method
    // Clear localStorage and cookies
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
