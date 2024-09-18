import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ChatComponent } from './chat/chat.component';
import { LoginComponent } from './login/login.component';
const routes: Routes = [
  { path: 'login', component: LoginComponent },  // Route for login page
  { path: 'chat', component: ChatComponent },    // Route for chat page
  { path: '', redirectTo: '/login', pathMatch: 'full' },  // Redirect to login by default
  { path: '**', redirectTo: '/login' }  // Redirect any unknown paths to login  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
