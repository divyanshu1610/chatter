import clear from 'clear'

import ChatterService, { ServerInfo, UpdateListener } from './core/service'
import { argsParser, ChatterMode, logger } from '@divyanshu1610/chatter-common'

class App implements UpdateListener {
  static readonly TITLE = 'Chatter'
  static readonly BANNER = 'Chatter Server'

  onUpdate(type: logger.MessagePrefix, ...args: string[]): void {
    if (type === logger.MessagePrefix.INFO) return logger.showInfo(args[0])
    if (type === logger.MessagePrefix.ERROR) return logger.showError(args[0])
    if (type === logger.MessagePrefix.NONE)
      return logger.say(args[1], { prefix: args[0] })
  }

  async start(): Promise<void> {
    const { mode, port } = argsParser(process.argv.slice(2))

    if (mode === ChatterMode.HELP_MODE) {
      //TODO: Show help
      return
    }
    let PORT = port
    if (process.env.PORT) {
      PORT = +process.env.PORT
    }
    clear()
    logger.showTitleAndBanner(App.TITLE, App.BANNER)
    const server = new ChatterService(PORT)
    server.attachUpdateListener(this)
    server.init()
    logger.showInfo('Server is starting up.....')
    server
      .start()
      .then((serverInfo: ServerInfo) => {
        logger.showSuccess('Server is up and running...')
        let address = serverInfo?.address
        const port = serverInfo.port
        if (address === '::') {
          address = `http://localhost:${port}`
        }
        logger.showInfo(`Server Address: ${address}`)
        logger.showInfo(`Port: ${port}`)
      })
      .catch((e) => {
        logger.showError(e)
      })
    return
  }
}

new App().start()
