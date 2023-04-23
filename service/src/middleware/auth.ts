import { isNotEmptyString } from '../utils/is'


// 改进了这个函数允许支持多个密码
const auth = async (req, res, next) => {
  const AUTH_SECRET_KEY = process.env.AUTH_SECRET_KEY
  let authkeyarray: string[] = ['tF4Zfmc0Jy', '7B8axJ8PF2', 'epBUUGwxZp', 'Ckx1BCgXdy', 'tDaBHX00ve', 'kK451PvQtE', 'Zcppu3MJ89', '4TOUiubaDH', 'ps_Ae5UxI5', 'uHcioX9FeT', 'qnZmmxQ722', 'EjdRUvIqeY', 'dS3mzL6gQB', 'kLKOCL1z36', '66PhQ22nOb', '3gDseJb8S1', 'ylUwKuSJSc', 'mL2v2bZF9K', 'RgWOwvyUhu', 'b59xdzuMdw', AUTH_SECRET_KEY]
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
