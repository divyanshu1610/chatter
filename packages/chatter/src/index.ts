import clear from 'clear'
import axios from 'axios'

import { logger } from '@divyanshu1610/chatter-common'

import ChatterCLI, { RoomOps } from './ui/cli'
import ChatterClient, { UpdateListener } from './core/client'
import ChatWindow from './ui/chatWindow'

class App implements UpdateListener {
  static readonly TITLE = 'Chatter'
  static readonly BANNER = 'A terminal chat application.'
  private roomName: string
  private client: ChatterClient | null
  constructor() {
    this.client = null
    this.roomName = ChatterCLI.BACK
  }
  onUpdate(type: logger.MessagePrefix, ...args: string[]): void {
    if (type === logger.MessagePrefix.INFO) return logger.showInfo(args[0])
    if (type === logger.MessagePrefix.ERROR) return logger.showError(args[0])
    if (type === logger.MessagePrefix.NONE)
      return logger.say(args[1], { prefix: args[0] })
  }

  async start(): Promise<void> {
    logger.showTitleAndBanner(App.TITLE, App.BANNER)
    const cli = new ChatterCLI()
    const name = await cli.askName()
    const tenant = await cli.askTenantUrl('http://localhost:5000')

    const c = new ChatterClient(name)
    this.client = c
    this.client.attachUpdateListener(this)
    const connect = await cli.showConnectOption()
    if (!connect) {
      logger.say('Goodbye !!')
      return
    }

    await this.client.connect(tenant)

    while (this.roomName === ChatterCLI.BACK) {
      clear()
      logger.showTitleAndBanner(App.TITLE, App.BANNER)
      const connectedOpts = await cli.showConnectedOptions()

      if (connectedOpts === RoomOps.DISCONNECT) {
        logger.say('Goodbye !!!')
        return this.client.disconnect()
      }

      if (connectedOpts === RoomOps.CREATE_ROOM) {
        this.roomName = await cli.askRoomName()
      } else if (connectedOpts === RoomOps.JOIN_ROOM) {
        const roomList: { rooms: Array<string> } =
          this.client.tenantUrl &&
          (await (
            await axios.get('/roomlist', { baseURL: this.client.tenantUrl })
          ).data)
        this.roomName = await cli.showRoomList(roomList.rooms)
      }
    }

    await this.client.joinRoom(this.roomName)
    clear()
    await this.showChatWindow()
    return
  }

  onInput(input: string): void {
    this.client?.sendMessage(this.roomName, input)
  }

  onClose(): void {
    // TODO:
  }

  async showChatWindow(): Promise<void> {
    logger.showTitleAndBanner(App.TITLE, App.BANNER)
    const name: string = this.client?.name || ''
    logger.say(`${name} : Connected`)
    const chatWindow = new ChatWindow(
      name,
      (i: string) => this.onInput(i),
      this.onClose,
    )
    this.client?.attachMessageListener(chatWindow)
    chatWindow.promptInput()
  }
}

new App().start()
