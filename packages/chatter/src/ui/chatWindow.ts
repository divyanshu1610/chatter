import readline from 'readline'

export default class ChatWindow {}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

const promptInput = function () {
  rl.question(`(Darth): `, (input) => {
    sendMessage()
    rl.prompt(true)
  })
}

const sendMessage = function () {
  promptInput()
}

const messages = function () {
  process.stdout.clearLine(0)
  process.stdout.cursorTo(0)
  console.log(`${new Date().toLocaleString()}`)
  rl.prompt(true)
}

const i = setInterval(messages, 1000)

rl.on('close', () => {
  console.log('CLOSE EVENT')
  clearInterval(i)
})

promptInput()
