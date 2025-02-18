import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

(() => {
  const dirPath = path.resolve(__dirname, 'maps/');
  const jsons = fs.readdirSync(dirPath).filter((file) => file.includes('json'));

  console.log(chalk.yellow(`[SquadJS]`), chalk.green('Build JSON files'));

  jsons.forEach((name) => {
    console.log(chalk.yellow(`[SquadJS]`), chalk.green(`JSON File: ${name}`));

    const filePath = path.resolve(dirPath, name);
    fs.copyFileSync(filePath, path.resolve(__dirname, '../../lib/', name));
  });

  console.log(chalk.yellow(`[SquadJS]`), chalk.green('Builded JSON files'));
})();
