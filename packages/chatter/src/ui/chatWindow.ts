import readline from 'readline'
import { green, yellow } from 'kleur'

import { MessageListener } from '../core/client'

export default class ChatWindow implements MessageListener {
  private name: string
  private onInput: (input: string) => void
  private rl: readline.Interface
  constructor(
    name: string,
    onInput: (input: string) => void,
    onClose: () => void,
  ) {
    this.name = name
    this.onInput = onInput
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
    this.rl.on('close', onClose)
  }
  onMessageRecieved(from: string, msg: string): void {
    process.stdout.clearLine(0)
    process.stdout.cursorTo(0)
    console.log(this.beautify(from, msg))
    this.rl.prompt(true)
  }

  promptInput(): void {
    this.rl.question(green(`[${this.name}]: `), (input: string) => {
      this.onInput(input)
      this.rl.prompt(true)
      this.promptInput()
    })
  }

  private beautify(name: string, msg: string): string {
    return yellow(`[${name}]`) + `: ${msg}`
  }

  close(): void {
    this.rl.close()
  }
}
