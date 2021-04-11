import { red, green, cyan, yellow } from 'kleur'
import * as figlet from 'figlet'

const newLine = '\n'

export enum MessagePrefix {
  ERROR = '[Error]: ',
  INFO = '[Info]: ',
  SUCCESS = '[Success]: ',
  NONE = '',
}

export const showTitleAndBanner = (title: string, banner: string): void => {
  console.log(cyan(figlet.textSync(title, { horizontalLayout: 'full' })))
  console.info(cyan(banner) + newLine)
}

export const showError = (message: string | Error): void => {
  console.error(red(MessagePrefix.ERROR) + message)
}

export const showSuccess = (message: string): void => {
  console.log(green(MessagePrefix.SUCCESS) + message)
}

export const showInfo = (message: string): void => {
  console.info(yellow(MessagePrefix.INFO) + message)
}

type SayOpts = {
  prefix?: string
  type?: 'info' | 'success' | 'error'
}

export const say = (message: string, opts?: SayOpts): void => {
  if (opts?.prefix) {
    return console.info(yellow(`[${opts.prefix}]: `) + message)
  }
  console.info(green(message))
}
