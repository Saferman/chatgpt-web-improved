// config.ts
import * as fs from 'fs';

// 读取 secrets 文件中每一行的内容到一个数组中
const authkeyarray: string[] = fs
  .readFileSync('./auth_secrets', 'utf-8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line !== '');

function generateRandomString(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const LogFunc: (str: string) => void = (str: string) => {
  fs.appendFileSync('./myrun.log', str + '\n');
};

// const tokenarray: string[] = fs
//   .readFileSync('./auth_tokens', 'utf-8')
//   .split('\n')
//   .map((line) => line.trim())
//   .filter((line) => line !== '');

export {authkeyarray,LogFunc,generateRandomString};
