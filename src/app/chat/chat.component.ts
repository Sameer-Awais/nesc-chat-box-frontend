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
  interval: any;
  superadmin: boolean = false;
  sender_id: number = 0;
  message = '';
  messages: { sender: string, message: string }[] = [];
  user: any = null;
  otherUser: string = '';  // Store the name of the user you want to chat with
  receiver: string = "";
  users = [];

  currentUser = { sender_id: 0 };  // Replace this with the actual logged-in user

  selectedUser: any = null;
  newMessage = '';
  receiver_name: string="";

  forward_users_list = [];
  is_forward: boolean = false;

  constructor(private chatService: ChatService, private authService: AuthService, private router: Router,) {}

  ngOnInit(): void {
    // Retrieve user details from localStorage
    this.user = JSON.parse(localStorage.getItem('user')!);
    this.superadmin = JSON.parse(localStorage.getItem('superadmin'));

    this.getUsers();

    this.currentUser.sender_id = this.user.id;

    // Set up interval to call fetchMessages
    this.interval = setInterval(() => {
      if (this.selectedUser) {
        this.fetchMessages();
      }
    }, 2000); // 2000ms = 2 secondss

  }

  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  getUsers(){
    var list= [];
  this.chatService.getUsers().subscribe(
  (res: any) => {  
    // Access the array from the 'data' field
    const usersArray = res.data; 

    if (Array.isArray(usersArray)) {
      const filteredUsers = usersArray.filter(item => (item.username !== this.user.username));
        this.users = filteredUsers;

      // if (this.user.username === 'DGQM') {
      //   const filteredUsers = usersArray.filter(item => (item.username !== this.user.username));
      //   this.users = filteredUsers;
      // } else {
      //   const filteredUsers = usersArray.filter(item => (item.username === 'DGQM'));
      //   this.users = filteredUsers;
      // }
    } else {
      console.warn('Data is not an array:', usersArray);
    }
  },
  (error) => {
    console.error('Error fetching users:', error);
  }
);

  }

  selectReceiver(selectedUser: any) {

    this.receiver_name = selectedUser.username;
    this.selectedUser = selectedUser;

    this.sender_id = selectedUser.id;
    this.receiver = this.user.id;
    this.fetchMessages();  
    this.sender_id = this.user.id;
    this.receiver = selectedUser.id; 

    // if(this.user.username != 'DGQM'){
    //   this.sender_id = selectedUser.id;
    //   this.receiver = this.user.id;
    //   this.fetchMessages();

    //   this.sender_id = this.user.id;
    //   this.receiver = selectedUser.id; 
    // }
    // else{
    //   this.sender_id = selectedUser.id;
    //   this.receiver = this.user.id;
    //   this.fetchMessages();  
    //   this.sender_id = this.user.id;
    //   this.receiver = selectedUser.id; 
    // }

  }

  forwardClick(){
    if(this.newMessage === ""){
      return
    }
    this.is_forward = !this.is_forward;
  }

  forwardCloseClick(){
    this.is_forward = !this.is_forward;
    this.forward_users_list = [];
  }

  selectForwarReceiver(selectedUser: any) {
    if(this.forward_users_list.includes(selectedUser.id)){
      this.forward_users_list = this.forward_users_list.filter(user => user !== selectedUser.id);
    }
    else{
      this.forward_users_list.push(selectedUser.id)
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
    if(this.newMessage === ""){
      return
    }
    var result = this.chatService.sendMessage(
      this.sender_id, 
      this.receiver,
      this.newMessage).subscribe((response: any) => {
      if(response.success == true){
        this.fetchMessages();
        this.newMessage = "";
      }
    }, err => {
      return "NotAuthorized";
    });
  }

  forwardMessage() {
    if(this.forward_users_list.length === 0 || this.newMessage === ""){
      return
    }
    var result = this.chatService.forwardMessage(
      this.sender_id, 
      this.forward_users_list.join(","),
      this.newMessage).subscribe((response: any) => {
      if(response.success == true){
        this.fetchMessages();
        this.newMessage = "";
        this.forward_users_list = []
        this.is_forward = false
      }
    }, err => {
      return "NotAuthorized";
    });
  }

   fetchMessages() {
    this.chatService
      .fetchMessages(this.sender_id,this.receiver)
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
