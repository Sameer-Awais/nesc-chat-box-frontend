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
  token: string = "";
  constructor(private authService: AuthService, private router: Router, private chatService: ChatService) {}

  login() {
    this.authService.login(this.username, this.password).subscribe(
      (response: any) => {
        this.userDetails = response.data;  // Store the logged-in user details
        console.log(this.userDetails);
        this.token = response.Token;
        console.log('these are user details',this.token);
        localStorage.setItem('user', JSON.stringify(this.userDetails));  // Store user in local storage
        localStorage.setItem("session_token",JSON.stringify(this.token));
        localStorage.setItem("superadmin",JSON.stringify(this.userDetails.superadmin));
        if(this.userDetails !=''){
          this.router.navigateByUrl("/chat");

        }
      },
      (error: any) => {
        console.error('Login failed', error);
      }
    );
  }
}