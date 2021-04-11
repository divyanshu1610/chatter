import inquirer from 'inquirer'
import Separator from 'inquirer/lib/objects/separator'
import { green } from 'kleur'

interface IChatterCLI {
  askName(): Promise<string>
  askTenantUrl(defaultUrl?: string): Promise<string>
  showConnectOption(): Promise<boolean>
  showConnectedOptions(): Promise<string>

  // connected
  askRoomName(): Promise<string>
  showRoomList(roomList: Array<string>): Promise<string>
}

type Choice = {
  name: string
  value: string
}

export enum RoomOps {
  CREATE_ROOM = 'room:create',
  JOIN_ROOM = 'room:join',
  DISCONNECT = 'disconnect',
}

export default class ChatterCLI implements IChatterCLI {
  static readonly BACK = 'back'
  async askName(): Promise<string> {
    const result = await inquirer.prompt([
      {
        name: 'name',
        type: 'input',
        message: 'Enter username:',
        transformer: (v: string) => {
          return green(v)
        },
        validate: (x: string) => {
          return x?.length > 0 ?? false
        },
      },
    ])
    return result.name
  }

  async askTenantUrl(defaultUrl?: string): Promise<string> {
    const result = await inquirer.prompt([
      {
        name: 'tenant',
        type: 'input',
        default: defaultUrl,
        message: 'Enter tenant url:',
        transformer: (v: string) => {
          return green(v)
        },
        validate: (x: string) => {
          return x?.length > 0 ?? false
        },
      },
    ])
    return result.tenant
  }

  async showConnectOption(): Promise<boolean> {
    const result = await inquirer.prompt([
      {
        name: 'connect',
        type: 'confirm',
        message: 'Do you want to connect?',
        default: true,
      },
    ])
    return result.connect
  }

  async showConnectedOptions(): Promise<string> {
    const choices: Choice[] = [
      {
        name: 'Create Room',
        value: RoomOps.CREATE_ROOM,
      },
      { name: 'Join Room', value: RoomOps.JOIN_ROOM },
      { name: 'Disconnect', value: RoomOps.DISCONNECT },
    ]
    const result = await inquirer.prompt([
      {
        name: 'connected',
        type: 'list',
        message: 'Select any',
        choices: choices,
      },
    ])
    return result['connected']
  }
  async askRoomName(): Promise<string> {
    const result = await inquirer.prompt([
      {
        name: 'roomName',
        type: 'input',
        message: 'Enter room name:',
        transformer: (v: string) => {
          return green(v)
        },
        validate: (x: string) => {
          return x?.length > 0 ?? false
        },
      },
    ])
    return result.roomName
  }
  async showRoomList(roomList: Array<string>): Promise<string> {
    const choices: Array<Choice | Separator> = roomList.map((r) => {
      return {
        name: r,
        value: r,
      }
    })
    choices.push(new inquirer.Separator())
    choices.push({ name: 'Back', value: 'back' })
    const result = await inquirer.prompt([
      {
        name: 'roomList',
        type: 'list',
        message: 'Select a room to join..',
        choices: choices,
        default: ChatterCLI.BACK,
      },
    ])
    return result['roomList']
  }
}
