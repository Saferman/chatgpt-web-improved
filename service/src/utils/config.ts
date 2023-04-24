// config.ts
import * as fs from 'fs';

// 读取 secrets 文件中每一行的内容到一个数组中
// 任何模块导入了该数组进行修改都是对这个唯一全局变量进行修改
function checkSecretString(str: string): boolean {
  const arr = [process.env.AUTH_SECRET_KEY, 'tF4Zfmc0Jy', '7B8axJ8PF2', 'epBUUGwxZp', 'Ckx1BCgXdy', 'tDaBHX00ve'];
  return arr.includes(str);
}



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

export {checkSecretString,LogFunc,generateRandomString};
