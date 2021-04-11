import parseArgs from 'minimist'

export enum ChatterMode {
  HELP_MODE,
  CLIENT_MODE,
  SERVER_MODE,
}

type ArgsParser = {
  mode: ChatterMode
  port?: number
}

export function argsParser(args: string[]): ArgsParser {
  const argv = parseArgs(args)

  // // Check for client
  // if (argv._.length === 0 && Object.keys(argv).length === 1) {
  //   return {
  //     mode: ChatterMode.CLIENT_MODE,
  //   }
  // }

  // Check for server
  if (
    argv._.length === 1 &&
    argv._[0] === 'serve' &&
    Object.keys(argv).length !== 1
  ) {
    const port = argv.p ?? argv.port ?? argv.PORT ?? 5000
    return {
      mode: ChatterMode.SERVER_MODE,
      port: port,
    }
  }

  return {
    mode: ChatterMode.HELP_MODE,
  }
}
