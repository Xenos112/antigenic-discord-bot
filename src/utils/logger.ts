import chalk from 'chalk';

class Logger {
  private log = console.log;
  private fileName: string;

  constructor(metaUrl: string) {
    this.fileName = metaUrl.split('/').pop() || 'unknown';
  }

  error(message: string) {
    this.log(`${chalk.red(`[ERROR][${this.fileName}]`)} ${message}`);
  }

  info(message: string) {
    this.log(`${chalk.blue('[INFO]')} ${message}`);
    this.log(`${chalk.blue(`[ERROR][${this.fileName}]`)} ${message}`);
  }

  warn(message: string) {
    this.log(`${chalk.yellow(`[WARN][${this.fileName}]`)} ${message}`);
  }

  debug(message: string) {
    this.log(`${chalk.magenta(`[INFO][${this.fileName}]`)} ${message}`);
  }
}

export default Logger
