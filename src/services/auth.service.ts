import { HttpClient, HttpHeaders } from '@angular/common/http';
  import { Injectable } from '@angular/core';
  import { Observable } from 'rxjs';import { GlobalVariable } from '../_helpers/globals';
  
  @Injectable({
    providedIn: 'root'
  })
  export class AuthService {
    readonly rootURL = GlobalVariable.ROOT_URL;
    access_token = localStorage.getItem("session_token");
    
    constructor(private http: HttpClient) {}
    // header = {
    //   headers: new HttpHeaders().set(
    //     "Authorization",
    //     `Bearer ${this.access_token.replace(/['"]+/g, "")}`
    //   ),
    // };
    login(username,password){
      var formdata = new FormData();
      formdata.append("username", username.toString());
      formdata.append("password", password.toString());
      //formdata.append("user_type", data.user_type.toString());
     
      return this.http.post(this.rootURL + "chat/login/", formdata);
    }
    logout() {
      localStorage.clear();
    }

}
