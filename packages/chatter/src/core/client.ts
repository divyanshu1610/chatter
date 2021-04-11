import * as io from 'socket.io-client'
import { logger } from '@divyanshu1610/chatter-common'

export interface UpdateListener {
  onUpdate: (type: logger.MessagePrefix, ...args: string[]) => void
}

export interface MessageListener {
  onMessageRecieved: (from: string, msg: string) => void
}

export default class ChatterClient {
  public readonly name: string
  private socket: SocketIOClient.Socket | null
  private tenantURL: string | null
  private updateListener?: UpdateListener
  private messageListener?: MessageListener
  static readonly JOIN_ROOM = 'room:join'
  static readonly LEAVE_ROOM = 'room:leave'
  static readonly RECIEVE_MSG = 'message:recieve'
  static readonly SEND_MSG = 'message:send'
  static readonly CONNECTED = 'connect'
  static readonly DISCONNECTED = 'disconnect'
  static readonly REGISTER = 'register'
  constructor(name: string) {
    this.name = name
    this.socket = null
    this.tenantURL = null
  }

  attachUpdateListener(listener: UpdateListener): void {
    this.updateListener = listener
  }

  attachMessageListener(messageListener: MessageListener): void {
    this.messageListener = messageListener
  }

  public get tenantUrl(): string | null {
    return this.tenantURL
  }

  connect(tenantURL: string): Promise<void> {
    return new Promise((resolve) => {
      this.tenantURL = tenantURL
      this.socket = io.connect(this.tenantURL)
      this.socket.emit(ChatterClient.REGISTER, this.name)
      this.socket?.on(ChatterClient.CONNECTED, (): void => {
        resolve()
      })

      this.socket?.on(ChatterClient.DISCONNECTED, (reason: string): void => {
        // TODO:
      })

      this.recieveMessage()
    })
  }

  disconnect(): void {
    this.socket?.disconnect()
  }

  private recieveMessage(): void {
    this.socket?.on(
      ChatterClient.RECIEVE_MSG,
      (from: string, message: string) => {
        // console.log('Clinet: ' + from + message)
        this.messageListener?.onMessageRecieved(from, message)
      },
    )
  }

  joinRoom(roomName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket?.emit(ChatterClient.JOIN_ROOM, roomName, (r: any): void => {
        if (r.msg === 'success') return resolve()
        reject()
      })
    })
  }

  leaveRoom(roomName: string): void {
    this.socket?.emit(ChatterClient.LEAVE_ROOM, roomName, (r: any): void => {
      //
    })
  }

  sendMessage(roomName: string, message: string): void {
    this.socket?.emit(ChatterClient.SEND_MSG, roomName, message)
    // this.listener?.onUpdate(MessagePrefix.NONE, this.name, message)
  }
}
