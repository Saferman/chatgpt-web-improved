import { isNotEmptyString } from '../utils/is'
import {authkeyarray} from '../utils/config'

// 改进了这个函数允许支持多个密码
const auth = async (req, res, next) => {
  const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY
  authkeyarray.push(AUTH_SECRET_KEY)
  if (isNotEmptyString(AUTH_SECRET_KEY)) {
    try {
      const Authorization = req.header('Authorization')
      if (!Authorization)throw new Error('Error: 无访问权限 | No access rights')
      let isValid: boolean = false
      authkeyarray.forEach(function(str_key){
        if(Authorization.replace('Bearer ', '').trim() ==str_key.trim()){
          isValid = true
        }
      });
      if(!isValid)throw new Error('Error: 无访问权限 | No access rights')
      // if (!Authorization || Authorization.replace('Bearer ', '').trim() !== AUTH_SECRET_KEY.trim())
      //   throw new Error('Error: 无访问权限 | No access rights')
      next()
    }
    catch (error) {
      res.send({ status: 'Unauthorized', message: error.message ?? 'Please authenticate.', data: null })
    }
  }
  else {
    next()
  }
}

export { auth }
