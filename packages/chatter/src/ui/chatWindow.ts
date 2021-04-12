import readline from 'readline'
import { cyan, yellow, blue } from 'kleur'

import { MessageListener } from '../core/client'

export default class ChatWindow implements MessageListener {
  private name: string
  private onInput: (input: string) => void
  private onClose: () => void
  static readonly CLOSE = '/quit'
  private rl: readline.Interface
  constructor(
    name: string,
    onInput: (input: string) => void,
    onClose: () => void,
  ) {
    this.name = name
    this.onInput = onInput
    this.onClose = onClose
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
  }
  onMessageRecieved(from: string, msg: string): void {
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
    console.log(this.beautify(from, msg))
    this.rl.prompt(true)
  }

  promptInput(): void {
    this.rl.question(cyan(`[${this.name}]: `), (input: string) => {
      if (input === ChatWindow.CLOSE) {
        this.close()
        return this.onClose()
      }
      this.onInput(input)
      this.rl.prompt(true)
      this.promptInput()
    })
  }

  private beautify(name: string, msg: string): string {
    if (name === 'Server') {
      return yellow(`[${name}]`) + `: ${msg}`
    }
    return blue(`[${name}]`) + `: ${msg}`
  }

  close(): void {
    this.rl.close()
  }
}
