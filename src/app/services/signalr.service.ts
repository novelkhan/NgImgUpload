import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../environments/environment';

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
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      console.log("Connection is already established.");
      return;
    }
  
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`https://localhost:7258/uploadProgressHub`, {
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets
      })
      .build();
  
    this.hubConnection.start()
      .then(() => {
        console.log("Connected to the SignalR hub");
  
        // সংযোগ ID গ্রহণ করুন
        this.hubConnection.on("ReceiveConnectionId", (connectionId: string) => {
          this.connectionId = connectionId;
          console.log("Connection ID:", this.connectionId);
        });
      })
      .catch(err => console.error("Error while starting SignalR connection:", err));
  }

  public async restartConnection() {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      await this.hubConnection.stop(); // সংযোগ বন্ধ করুন
    }

    this.startConnection(); // নতুন করে সংযোগ শুরু করুন
  }

  getConnectionId(): string | null {
    return this.connectionId;
  }

  getHubConnection(): signalR.HubConnection {
    return this.hubConnection;
  }

  async waitForConnectionId(): Promise<string | null> {
    if (this.connectionId) {
      return this.connectionId;
    }
  
    // যদি সংযোগ ID না পাওয়া যায়, তাহলে নতুন করে সংযোগ স্থাপনের চেষ্টা করুন
    await this.hubConnection.start();
    return new Promise((resolve) => {
      this.hubConnection.on("ReceiveConnectionId", (connectionId: string) => {
        this.connectionId = connectionId;
        resolve(connectionId);
      });
    });
  }
}