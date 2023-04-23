// config.ts
import * as fs from 'fs';

// 读取 secrets 文件中每一行的内容到一个数组中
const authkeyarray: string[] = fs
  .readFileSync('./auth_secrets', 'utf-8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line !== '');

const tokenarray: string[] = fs
  .readFileSync('./auth_tokens', 'utf-8')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line !== '');

export {authkeyarray,tokenarray};
