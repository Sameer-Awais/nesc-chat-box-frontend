import { Component, OnInit } from '@angular/core';
import { ChatService } from 'src/services/chat.service';
import { AuthService } from 'src/services/auth.service';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  interval: any;
  unreadInterval: any;
  superadmin: boolean = false;
  sender_id: number = 0;
  message = '';
  messages: { sender: string, message: string }[] = [];
  user: any = null;
  otherUser: string = '';  // Store the name of the user you want to chat with
  receiver: string = "";
  users = [];
  unreadCounts: { [userId: string]: number } = {};
  lastMessageTimestamps: { [userId: string]: number } = {};

  currentUser = { sender_id: 0 };  // Replace this with the actual logged-in user

  selectedUser: any = null;
  newMessage = '';
  receiver_name: string="";

  forward_users_list = [];
  is_forward: boolean = false;
  forwardWarning = '';

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
    }, 2000);

    this.unreadInterval = setInterval(() => {
      this.refreshUnreadCounts();
    }, 5000);

  }

  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (this.unreadInterval) {
      clearInterval(this.unreadInterval);
    }
  }

  private normalizeUserId(userId: number | string): string {
    return String(userId);
  }

  private getLastReadStorageKey(): string {
    return `chat_last_read_${this.normalizeUserId(this.user.id)}`;
  }

  private getLastReadTimestamps(): { [userId: string]: { timestamp: string; messageId?: number | string } | string } {
    const stored = localStorage.getItem(this.getLastReadStorageKey());
    return stored ? JSON.parse(stored) : {};
  }

  private getLastReadEntry(otherUserId: number | string): { timestamp: string; messageId?: number | string } | null {
    const stored = this.getLastReadTimestamps()[this.normalizeUserId(otherUserId)];
    if (!stored) {
      return null;
    }

    if (typeof stored === 'string') {
      return { timestamp: stored };
    }

    return stored;
  }

  private setLastRead(
    otherUserId: number | string,
    timestamp: string,
    messageId?: number | string
  ): void {
    const data = this.getLastReadTimestamps();
    const key = this.normalizeUserId(otherUserId);
    data[key] = messageId != null ? { timestamp, messageId } : { timestamp };
    localStorage.setItem(this.getLastReadStorageKey(), JSON.stringify(data));
  }

  private getMessageTimestamp(message: any): number {
    const rawValue = message.timestamp || message.created_at || message.createdAt || message.date;
    const time = new Date(rawValue).getTime();
    return isNaN(time) ? 0 : time;
  }

  private getMessageId(message: any): number | string | null {
    if (message.id != null) {
      return message.id;
    }
    if (message.message_id != null) {
      return message.message_id;
    }
    return null;
  }

  private isIncomingMessage(message: any): boolean {
    return String(message.sender) !== String(this.currentUser.sender_id);
  }

  private getIncomingMessages(messages: any[]): any[] {
    if (!messages || messages.length === 0) {
      return [];
    }

    return messages.filter(m => this.isIncomingMessage(m));
  }

  private markConversationAsRead(otherUserId: number | string, messages: any[]): void {
    const normalizedId = this.normalizeUserId(otherUserId);
    const incoming = this.getIncomingMessages(messages);

    if (incoming.length === 0) {
      this.setLastRead(normalizedId, new Date().toISOString());
      this.unreadCounts[normalizedId] = 0;
      return;
    }

    const latestIncoming = incoming.reduce((latest, msg) => {
      const msgTime = this.getMessageTimestamp(msg);
      const latestTime = this.getMessageTimestamp(latest);
      return msgTime >= latestTime ? msg : latest;
    });

    this.setLastRead(
      normalizedId,
      new Date(this.getMessageTimestamp(latestIncoming)).toISOString(),
      this.getMessageId(latestIncoming)
    );
    this.unreadCounts[normalizedId] = 0;
  }

  private getLatestMessageTime(messages: any[]): number {
    if (!messages || messages.length === 0) {
      return 0;
    }

    return messages.reduce((max, msg) => {
      const time = this.getMessageTimestamp(msg);
      return time > max ? time : max;
    }, 0);
  }

  private isMessageUnread(message: any, lastRead: { timestamp: string; messageId?: number | string }): boolean {
    const messageId = this.getMessageId(message);
    const messageTime = this.getMessageTimestamp(message);

    if (lastRead.messageId != null && messageId != null) {
      const lastReadId = Number(lastRead.messageId);
      const currentId = Number(messageId);

      if (!isNaN(lastReadId) && !isNaN(currentId)) {
        return currentId > lastReadId;
      }
    }

    const lastReadTime = new Date(lastRead.timestamp).getTime();
    if (isNaN(lastReadTime) || messageTime === 0) {
      return false;
    }

    return messageTime > lastReadTime;
  }

  private countUnread(otherUserId: number | string, messages: any[]): number {
    const incoming = this.getIncomingMessages(messages);
    if (incoming.length === 0) {
      return 0;
    }

    const lastRead = this.getLastReadEntry(otherUserId);
    if (!lastRead) {
      return incoming.length;
    }

    return incoming.filter(m => this.isMessageUnread(m, lastRead)).length;
  }

  hasUnread(user: any): boolean {
    return this.getUnreadCount(user) > 0;
  }

  getUnreadCount(user: any): number {
    return this.unreadCounts[this.normalizeUserId(user.id)] || 0;
  }

  private sortUsers(): void {
    this.users.sort((a: any, b: any) => {
      const timeA = this.lastMessageTimestamps[this.normalizeUserId(a.id)] || 0;
      const timeB = this.lastMessageTimestamps[this.normalizeUserId(b.id)] || 0;

      if (timeB !== timeA) {
        return timeB - timeA;
      }

      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  refreshUnreadCounts(): void {
    if (!this.users.length || !this.user) {
      return;
    }

    const requests = this.users.map((chatUser: any) =>
      this.chatService.fetchMessages(this.user.id, chatUser.id).pipe(
        map((response: any) => ({
          userId: chatUser.id,
          count: this.countUnread(chatUser.id, response.data || []),
          lastMessageTime: this.getLatestMessageTime(response.data || [])
        })),
        catchError(() => of({ userId: chatUser.id, count: 0 }))
      )
    );

    forkJoin(requests).subscribe((results: any[]) => {
      results.forEach(result => {
        const userKey = this.normalizeUserId(result.userId);
        this.lastMessageTimestamps[userKey] = result.lastMessageTime;

        if (this.selectedUser && this.normalizeUserId(this.selectedUser.id) === userKey) {
          this.unreadCounts[userKey] = 0;
        } else {
          this.unreadCounts[userKey] = result.count;
        }
      });
      this.sortUsers();
    });
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
        this.refreshUnreadCounts();

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
    this.receiver_name = selectedUser.first_name + " " + selectedUser.last_name;
    this.selectedUser = selectedUser;
    this.unreadCounts[this.normalizeUserId(selectedUser.id)] = 0;

    this.sender_id = this.user.id;
    this.receiver = selectedUser.id;
    this.fetchMessages();
  }

  forwardClick(){
    if(this.newMessage.trim() === ""){
      this.forwardWarning = 'Please enter a message in the input before forwarding.';
      setTimeout(() => this.forwardWarning = '', 4000);
      return;
    }
    this.forwardWarning = '';
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
    if(this.newMessage.trim() === ""){
      return;
    }
    var result = this.chatService.sendMessage(
      this.sender_id, 
      this.receiver,
      this.newMessage).subscribe((response: any) => {
      if(response.success == true){
        if (this.selectedUser) {
          const userKey = this.normalizeUserId(this.selectedUser.id);
          this.lastMessageTimestamps[userKey] = Date.now();
          this.sortUsers();
        }
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
        if (this.selectedUser) {
          const userKey = this.normalizeUserId(this.selectedUser.id);
          const latestTime = this.getLatestMessageTime(this.messages);
          if (latestTime) {
            this.lastMessageTimestamps[userKey] = latestTime;
            this.sortUsers();
          }
          this.markConversationAsRead(this.selectedUser.id, this.messages);
        }
      });
  }
  logout() {
    const preservedReadState: { [key: string]: string } = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('chat_last_read_')) {
        preservedReadState[key] = localStorage.getItem(key) || '';
      }
    }

    this.authService.logout();
    localStorage.clear();

    Object.keys(preservedReadState).forEach(key => {
      localStorage.setItem(key, preservedReadState[key]);
    });

    this.router.navigate(['/login']);
  }
}
