// config.ts
import * as fs from 'fs';

// 读取 secrets 文件中每一行的内容到一个数组中
// 任何模块导入了该数组进行修改都是对这个唯一全局变量进行修改
function checkSecretString(str: string): boolean {
  const arr = [process.env.AUTH_SECRET_KEY, 'tF4Zfmc0Jy', '7B8axJ8PF2', 'epBUUGwxZp', 'Ckx1BCgXdy', 'tDaBHX00ve'];
  return arr.includes(str);
}


function getAccessToken():Array<string>{
  const arr = ['eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik1UaEVOVUpHTkVNMVFURTRNMEZCTWpkQ05UZzVNRFUxUlRVd1FVSkRNRU13UmtGRVFrRXpSZyJ9.eyJodHRwczovL2FwaS5vcGVuYWkuY29tL3Byb2ZpbGUiOnsiZW1haWwiOiJzcGFya2xpbmdzdGFyMjAyM0Bwcm90b24ubWUiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sImh0dHBzOi8vYXBpLm9wZW5haS5jb20vYXV0aCI6eyJ1c2VyX2lkIjoidXNlci1YVmxUV01SS1pOaWE4dWlSYXNYdlJGbDkifSwiaXNzIjoiaHR0cHM6Ly9hdXRoMC5vcGVuYWkuY29tLyIsInN1YiI6ImF1dGgwfDY0NDE0ZDcyZGQyN2U0NTkwZGExOWI5MCIsImF1ZCI6WyJodHRwczovL2FwaS5vcGVuYWkuY29tL3YxIiwiaHR0cHM6Ly9vcGVuYWkub3BlbmFpLmF1dGgwYXBwLmNvbS91c2VyaW5mbyJdLCJpYXQiOjE2ODIwNTA4MDAsImV4cCI6MTY4MzI2MDQwMCwiYXpwIjoiVGRKSWNiZTE2V29USHROOTVueXl3aDVFNHlPbzZJdEciLCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIG1vZGVsLnJlYWQgbW9kZWwucmVxdWVzdCBvcmdhbml6YXRpb24ucmVhZCBvZmZsaW5lX2FjY2VzcyJ9.Txe4YzO6gJCcn6qQ_tYtD85nsHmZS8qW_hufrEIdWFnVoTdBdua4jn7PAvTLvmXNYq7Rdllyb4RioM4FkoX7eeoyQ26Yhl-LmZ9pd7xejgJWgujMCAsLiC1uBOA27LzD51AFqf2XY9nRGy-wm20mI70MHQXcI2rzH0exo4Xmu0NTg0i0Acvvv-wauimniRR_7ExoOIxF-gm5ztqnav3Kv5tnfOxKr8bIzgThbqB4X3jCUuGJyg28UlFiwlyKYuzYxxF45cWBERGokENugpGrE3A5IGkg-U9NbejzKM5zjygvGVuxdgrTusQBZbTmtdDwjrDz9OD988S-6tfE8ONXCQ',
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik1UaEVOVUpHTkVNMVFURTRNMEZCTWpkQ05UZzVNRFUxUlRVd1FVSkRNRU13UmtGRVFrRXpSZyJ9.eyJodHRwczovL2FwaS5vcGVuYWkuY29tL3Byb2ZpbGUiOnsiZW1haWwiOiJqYXNtaW5lemhhby5ydWNAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWV9LCJodHRwczovL2FwaS5vcGVuYWkuY29tL2F1dGgiOnsidXNlcl9pZCI6InVzZXItRHZKWXpOQlVGS0w2bkNkejk2Zkw0bldrIn0sImlzcyI6Imh0dHBzOi8vYXV0aDAub3BlbmFpLmNvbS8iLCJzdWIiOiJhdXRoMHw2NDBlYzIwNjU2Zjg2ODUyYzg1MDkzMmEiLCJhdWQiOlsiaHR0cHM6Ly9hcGkub3BlbmFpLmNvbS92MSIsImh0dHBzOi8vb3BlbmFpLm9wZW5haS5hdXRoMGFwcC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNjgyMzQ1MTYzLCJleHAiOjE2ODM1NTQ3NjMsImF6cCI6IlRkSkljYmUxNldvVEh0Tjk1bnl5d2g1RTR5T282SXRHIiwic2NvcGUiOiJvcGVuaWQgcHJvZmlsZSBlbWFpbCBtb2RlbC5yZWFkIG1vZGVsLnJlcXVlc3Qgb3JnYW5pemF0aW9uLnJlYWQgb2ZmbGluZV9hY2Nlc3MifQ.eTC3OxrG0e22k0ZnQ6J2MbmOkQg3tt7kLO2y3-l4VDlWfseBJ1WG5pl7OQ__6-pDF9jb0aZEuen_uKL9e6Ec3F1R9JdRisX4-sA2Wgc4HctKmqKSHDM7-xVT0gxh9SSnhSlyDUsyF5DWcd65mbhtehX_bTs4DPe-gAadlRIcZjDKS5jLreVyBSdzgt2voSlTs7QGw7lRcx2ML78HzF0pZ6voKpsMP5fDZmYlcIiV7QJoVFRdX2mkVQ8gk5xHg9galjvaSUqoomNUvUCd4NRNy5fTFWx4LRFyRmV5ImRaeVAJgxJd0Do6SHYiSPT43TuyqEUlyANj-7fQn-HN1OIX5A',
  process.env.OPENAI_ACCESS_TOKEN]
  return arr
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

export {checkSecretString,LogFunc,generateRandomString,getAccessToken};
