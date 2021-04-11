import { createServer, Server as HttpServer } from 'http'
import express, { Express } from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { Server, Socket } from 'socket.io'

import { logger } from '@divyanshu1610/chatter-common'

export type ServerInfo = {
  port: number
  address: string
}

export interface UpdateListener {
  onUpdate: (type: logger.MessagePrefix, ...args: string[]) => void
}

type CallBackFn = (...args: [unknown]) => void

export default class ChatterService {
  private app?: Express
  private listener?: UpdateListener
  private port: number
  private io: Server | null
  private httpServer: HttpServer | null
  private maxRooms: number
  private usersPerRoom: number
  private users: Map<string, string>
  private roomList: Set<string>
  static readonly MAX_ROOMS_DEFAULT = 5
  static readonly USERS_PER_ROOM = 5

  constructor(port = 5000) {
    this.port = port
    this.io = null
    this.httpServer = null
    this.users = new Map<string, string>()
    this.roomList = new Set<string>()
    this.maxRooms = ChatterService.MAX_ROOMS_DEFAULT
    this.usersPerRoom = ChatterService.USERS_PER_ROOM
  }

  attachUpdateListener(listener: UpdateListener): void {
    this.listener = listener
  }

  init(maxRooms?: number, usersPerRoom?: number): void {
    this.maxRooms = maxRooms ?? ChatterService.MAX_ROOMS_DEFAULT
    this.usersPerRoom = usersPerRoom ?? ChatterService.USERS_PER_ROOM
    this.app = express()
    this.httpServer = createServer(this.app)
    this.io = new Server(this.httpServer)

    // handle CORS
    this.app.use(cors())

    this.app.use(bodyParser.json())

    // for roomlist
    this.app.get('/roomlist', (req, res) => {
      const rooms = this.getRoomList()
      res.json({ rooms })
    })
  }

  getRoomList(): Array<string> {
    const roomList = Array.from(this.roomList)
    return roomList
  }

  async start(): Promise<ServerInfo> {
    this.io?.on('connection', (socket: Socket) => {
      // user joins and registers
      socket.on('register', (userName: string) => {
        this.users.set(socket.id, userName)
        this.listener?.onUpdate(
          logger.MessagePrefix.INFO,
          `${userName} has connected.`,
        )
      })

      // Join a room
      socket.on('room:join', (roomName: string, cb: CallBackFn): void => {
        socket.join(roomName)
        if (!this.roomList.has(roomName)) {
          this.roomList.add(roomName)
        }
        const userName = this.users.get(socket.id)
        socket
          ?.to(roomName)
          .emit('message:recieve', 'Server', `${userName} has joined the room.`)
        cb({ msg: 'success' })
      })

      // Leave a room
      socket.on('room:leave', (roomName: string, cb: CallBackFn): void => {
        socket.leave(roomName)
        const userName = this.users.get(socket.id)
        socket
          ?.to(roomName)
          .emit('message:recieve', 'Server', `${userName} has left the room.`)
        cb({ msg: 'success' })
      })

      // Broadcast message
      socket.on('message:send', (roomName: string, message: string): void => {
        const userName = this.users.get(socket.id)
        socket.to(roomName).emit('message:recieve', userName, message)
      })

      // When client is disconnected
      socket.on('disconnecting', () => {
        const userName: string | undefined = this.users.get(socket.id)
        socket.rooms.forEach((v) => {
          this.io
            ?.to(v)
            .emit('message:recieve', 'Server', `${userName} has left the room.`)
        })
      })

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      socket.on('disconnect', (reason: string) => {
        const userName: string | undefined = this.users.get(socket.id)
        this.users.delete(socket.id)
        this.listener?.onUpdate(
          logger.MessagePrefix.INFO,
          `${userName} has disconnected.`,
        )
      })
    })
    return new Promise((resolve, reject) => {
      try {
        this.httpServer?.listen(this.port, () => {
          const addrssInfo: any = this.httpServer?.address()
          resolve({ address: addrssInfo?.address, port: this.port })
        })
      } catch (e) {
        reject(e)
      }
    })
  }

  stop(): void {
    this.io?.close()
    this.httpServer?.close()
    this.io = null
    this.httpServer = null
  }
}
