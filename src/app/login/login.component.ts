import { Component, OnInit } from '@angular/core';
import { ChatService } from 'src/services/chat.service';
import { AuthService } from 'src/services/auth.service';
import { WebsocketService } from 'src/services/websocket.service';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  userDetails: any = null;

  constructor(private authService: AuthService, private router: Router, private chatService: ChatService) {}

  login() {
    this.authService.login(this.username, this.password).subscribe(
      (response: any) => {
        this.userDetails = response.user;  // Store the logged-in user details
        localStorage.setItem('user', JSON.stringify(this.userDetails));  // Store user in local storage
  
        // Initiate WebSocket connection AFTER login
        this.chatService.connect(`${this.userDetails.username}_other_user`);
        this.router.navigate(['/chat']);  // Redirect to the chat page
      },
      (error: any) => {
        console.error('Login failed', error);
      }
    );
  }
}