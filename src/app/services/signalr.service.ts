import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';

@Injectable({
  providedIn: 'root'
})
export class SignalrService {

  private hubConnection!: signalR.HubConnection;
  public connectionId: string | null = null;

  constructor() {
    this.startConnection();
  }

  private startConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl("/uploadProgressHub")
      .build();

    this.hubConnection.start()
      .then(() => {
        console.log("Connected to the SignalR hub");
        this.connectionId = this.hubConnection.connectionId!;
        console.log("Connection ID:", this.connectionId);
      })
      .catch(err => console.error("Error while starting SignalR connection:", err));
  }

  getConnectionId(): string | null {
    return this.connectionId;
  }

  getHubConnection(): signalR.HubConnection {
    return this.hubConnection;
  }
}
