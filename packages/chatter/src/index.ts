import clear from 'clear'
import axios from 'axios'
import readline from 'readline'

import { logger } from '@divyanshu1610/chatter-common'

import ChatterCLI, { RoomOps } from './ui/cli'
import ChatterClient, { UpdateListener } from './core/client'

class App implements UpdateListener {
  static readonly TITLE = 'Chatter'
  static readonly BANNER = 'A terminal chat application.'

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

    const client = new ChatterClient(name)
    client.attachUpdateListener(this)
    const connect = await cli.showConnectOption()
    if (!connect) {
      logger.say('Goodbye !!')
      return
    }

    await client.connect(tenant)

    let roomName = ChatterCLI.BACK

    while (roomName === ChatterCLI.BACK) {
      clear()
      logger.showTitleAndBanner(App.TITLE, App.BANNER)
      const connectedOpts = await cli.showConnectedOptions()

      if (connectedOpts === RoomOps.DISCONNECT) {
        logger.say('Goodbye !!!')
        return client.disconnect()
      }

      if (connectedOpts === RoomOps.CREATE_ROOM) {
        roomName = await cli.askRoomName()
      } else if (connectedOpts === RoomOps.JOIN_ROOM) {
        const roomList: { rooms: Array<string> } =
          client.tenantUrl &&
          (await (await axios.get('/roomlist', { baseURL: client.tenantUrl }))
            .data)
        roomName = await cli.showRoomList(roomList.rooms)
      }
    }

    await client.joinRoom(roomName)
    clear()
    // TODO: Show Chat Window
    await this.showChatWindow(client)
    return
  }

  async showChatWindow(client: ChatterClient): Promise<void> {
    logger.showTitleAndBanner(App.TITLE, App.BANNER)
    logger.say(`${client.name} : Connected`)
    const r = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    readline.cursorTo(process.stdout, 10, 20)
  }
}

new App().start()
