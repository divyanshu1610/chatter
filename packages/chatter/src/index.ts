import clear from 'clear'
import axios from 'axios'
import ora from 'ora'

import { logger } from '@divyanshu1610/chatter-common'

import ChatterCLI, { RoomOps } from './ui/cli'
import ChatterClient, { UpdateListener } from './core/client'
import ChatWindow from './ui/chatWindow'

class App implements UpdateListener {
  static readonly TITLE = 'Chatter'
  static readonly BANNER = 'A terminal chat application.'
  private roomName: string
  private client: ChatterClient | null
  private chatWindow: ChatWindow | null
  constructor() {
    this.client = null
    this.roomName = ChatterCLI.BACK
    this.chatWindow = null
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

    const spinner = ora('Connecting...').start()
    await this.client.connect(tenant).then((_) => {
      spinner.stop()
    })

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
        spinner.text = `Creating '${this.roomName}'...`
        spinner.start()
      } else if (connectedOpts === RoomOps.JOIN_ROOM) {
        spinner.text = 'Fetching room list...'
        spinner.start()
        const roomList: { rooms: Array<string> } =
          this.client.tenantUrl &&
          (await (
            await axios.get('/roomlist', { baseURL: this.client.tenantUrl })
          ).data)
        spinner.stop()
        this.roomName = await cli.showRoomList(roomList.rooms)
      }
    }
    await this.client.joinRoom(this.roomName)
    spinner.stop()
    clear()
    await this.showChatWindow()
    return
  }

  onInput(input: string): void {
    this.client?.sendMessage(this.roomName, input)
  }

  close(): void {
    this.client?.disconnect()
    clear()
    logger.showTitleAndBanner(App.TITLE, App.BANNER)
    logger.say('Goodbye !!')
  }

  async showChatWindow(): Promise<void> {
    logger.showTitleAndBanner(App.TITLE, App.BANNER)
    const name: string = this.client?.name || ''
    // logger.say(`${name} : Connected`)
    logger.say('--------------------------------------------------')
    this.chatWindow = new ChatWindow(
      name,
      (i: string) => this.onInput(i),
      () => this.close(),
    )
    this.client?.attachMessageListener(this.chatWindow)
    this.chatWindow.promptInput()
  }
}

new App().start()
