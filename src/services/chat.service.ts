import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { GlobalVariable } from "../_helpers/globals";
import { HttpClient, HttpHeaders } from "@angular/common/http";
@Injectable({
  providedIn: 'root'
})
export class ChatService {
  readonly rootUrl = GlobalVariable.ROOT_URL;
  access_token =
    localStorage.getItem("session_token") == null
      ? ""
      : localStorage.getItem("session_token");

  constructor(private http: HttpClient) {}

  header = {
    headers: new HttpHeaders().set(
      "Authorization",
      `Bearer ${this.access_token.replace(/['"]+/g, "")}`
    ),
  };
  login(
    username,
    password,
  ){
    var formdata = new FormData();
    formdata.append("username", username.toString());
    formdata.append("password", password.toString());

    return this.http.post(
      this.rootUrl + "chat/login/",formdata,this.header
    );
  }
  
  sendMessage(
    sender,
    receiver,
    message,
  ) {
    var formdata = new FormData();
    formdata.append("sender", sender.toString());
    formdata.append("receiver", receiver.toString());
    formdata.append("message", message.toString());

    return this.http.post(
      this.rootUrl + "ams/sendMessage/",
      formdata
    );
  }

  forwardMessage(
    sender,
    receiver,
    message,
  ) {
    var formdata = new FormData();
    formdata.append("sender", sender.toString());
    formdata.append("receiver", receiver.toString());
    formdata.append("message", message.toString());

    return this.http.post(
      this.rootUrl + "ams/forwardMessage/",
      formdata
    );
  }

  fetchMessages(sender,receiver){
    console.log('this is the header',this.header);
    return this.http.get(
      this.rootUrl + "ams/fetchMessages/?sender=" + sender + "&receiver=" + receiver);
  }
  getUsers() {
    console.log('this is the header',this.header);
    return this.http.get(
      this.rootUrl + "usermanagement/getchatuser/");
  }
}
