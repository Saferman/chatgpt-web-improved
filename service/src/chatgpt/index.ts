import * as dotenv from 'dotenv'
import 'isomorphic-fetch'
import type { ChatGPTAPIOptions, ChatMessage, SendMessageOptions } from 'chatgpt'
import { ChatGPTAPI, ChatGPTUnofficialProxyAPI } from 'chatgpt'
import { SocksProxyAgent } from 'socks-proxy-agent'
import httpsProxyAgent from 'https-proxy-agent'
import fetch from 'node-fetch'
import { sendResponse } from '../utils'
import { isNotEmptyString } from '../utils/is'
import type { ApiModel, ChatContext, ChatGPTUnofficialProxyAPIOptions, ModelConfig } from '../types'
import type { RequestOptions, SetProxyOptions, UsageResponse } from './types'
import {LogFunc,generateRandomString,getAccessToken} from '../utils/config'

const { HttpsProxyAgent } = httpsProxyAgent

dotenv.config()

const ErrorCodeMessage: Record<string, string> = {
  401: '[OpenAI] 提供错误的API密钥 | Incorrect API key provided',
  403: '[OpenAI] 服务器拒绝访问，请稍后再试 | Server refused to access, please try again later',
  502: '[OpenAI] 错误的网关 |  Bad Gateway',
  503: '[OpenAI] 服务器繁忙，请稍后再试 | Server is busy, please try again later',
  504: '[OpenAI] 网关超时 | Gateway Time-out',
  500: '[OpenAI] 服务器繁忙，请稍后再试 | Internal Server Error',
}

const timeoutMs: number = !isNaN(+process.env.TIMEOUT_MS) ? +process.env.TIMEOUT_MS : 100 * 1000
const disableDebug: boolean = process.env.OPENAI_API_DISABLE_DEBUG === 'true'

let apiModel: ApiModel
const model = isNotEmptyString(process.env.OPENAI_API_MODEL) ? process.env.OPENAI_API_MODEL : 'gpt-3.5-turbo'

if (!isNotEmptyString(process.env.OPENAI_API_KEY) && !isNotEmptyString(process.env.OPENAI_ACCESS_TOKEN))
  throw new Error('Missing OPENAI_API_KEY or OPENAI_ACCESS_TOKEN environment variable')

let api: ChatGPTAPI | ChatGPTUnofficialProxyAPI

let random_id: string = '';
let api_reverse_proxy:string;


// 目前只支持Access token的方式
let api_pool:Array<ChatGPTUnofficialProxyAPI> = [];
// let api_status_pool:Array<string> = [];
let api_status_pool:Array<number> = [];  //保存用户数量

//必须加分号，不然和下面混淆？

(async () => {
  // More Info: https://github.com/transitive-bullshit/chatgpt-api
  if (isNotEmptyString(process.env.OPENAI_API_KEY)) {
    const OPENAI_API_BASE_URL = process.env.OPENAI_API_BASE_URL

    const options: ChatGPTAPIOptions = {
      apiKey: process.env.OPENAI_API_KEY,
      completionParams: { model },
      debug: !disableDebug,
    }

    // increase max token limit if use gpt-4
    if (model.toLowerCase().includes('gpt-4')) {
      // if use 32k model
      if (model.toLowerCase().includes('32k')) {
        options.maxModelTokens = 32768
        options.maxResponseTokens = 8192
      }
      else {
        options.maxModelTokens = 8192
        options.maxResponseTokens = 2048
      }
    }

    if (isNotEmptyString(OPENAI_API_BASE_URL))
      options.apiBaseUrl = `${OPENAI_API_BASE_URL}/v1`

    setupProxy(options)

    api = new ChatGPTAPI({ ...options })
    apiModel = 'ChatGPTAPI'
  }
  else {
    api_reverse_proxy = isNotEmptyString(process.env.API_REVERSE_PROXY) ? process.env.API_REVERSE_PROXY : 'https://bypass.churchless.tech/api/conversation'
    let token_array:Array<string> = getAccessToken()
    for(let i in token_array){
      const options: ChatGPTUnofficialProxyAPIOptions = {
        accessToken: token_array[i],
        apiReverseProxyUrl: api_reverse_proxy,
        model,
        debug: !disableDebug,
      }
      LogFunc("[+]Push " + options.accessToken.slice(-6))
      setupProxy(options)
      api = new ChatGPTUnofficialProxyAPI({ ...options })
      api_pool.push(api)
      api_status_pool.push(0)
    }
    apiModel = 'ChatGPTUnofficialProxyAPI'

    // const options: ChatGPTUnofficialProxyAPIOptions = {
    //   accessToken: process.env.OPENAI_ACCESS_TOKEN,
    //   apiReverseProxyUrl: isNotEmptyString(process.env.API_REVERSE_PROXY) ? process.env.API_REVERSE_PROXY : 'https://bypass.churchless.tech/api/conversation',
    //   model,
    //   debug: !disableDebug,
    // }

    // setupProxy(options)

    // api = new ChatGPTUnofficialProxyAPI({ ...options })
    // apiModel = 'ChatGPTUnofficialProxyAPI'
  }
  random_id = generateRandomString();
  LogFunc("Trigger build api and apimodel and Random string: " + random_id)
  // 通过验证我发现该环境这部分是server启动的时候只会执行一次的操作
})()

async function chatReplyProcess(options: RequestOptions) {
  const { message, lastContext, process, systemMessage, temperature, top_p } = options
  let index = Math.floor(Math.random() * api_pool.length)
  let this_api:ChatGPTUnofficialProxyAPI = api_pool[index]
  try {
    let options: SendMessageOptions = { timeoutMs }
    // LogFunc("Trigger catReplyProcess and Random string: " + random_id) 
    // 验证发现不同客户端得到的这个random_id的值是相同的
    if (apiModel === 'ChatGPTAPI') {
      if (isNotEmptyString(systemMessage))
        options.systemMessage = systemMessage
      options.completionParams = { model, temperature, top_p }
    }

    if (lastContext != null) {
      if (apiModel === 'ChatGPTAPI')
        options.parentMessageId = lastContext.parentMessageId
      else
        options = { ...lastContext }
    }
    // 发送请求的核心位置
    LogFunc("[+]execute await api.sendMessage in chatReplyProcess")
    // 在原版代码里下述apiModel两种代码的逻辑都采用的ChatGPTAPI的逻辑，我针对另一种模型进行了修改
    if(apiModel == 'ChatGPTAPI'){
      // 不同客户端阻塞的位置应该是这里的api，使用不同的api会不会解决
      const response = await api.sendMessage(message, {
        ...options,
        onProgress: (partialResponse) => {
          process?.(partialResponse)
        },
      })
      return sendResponse({ type: 'Success', data: response })
    }else{
      for(let i =0;i<api_status_pool.length;i++){
        if(api_status_pool[i] == 0){
          api_status_pool[i] += 1
          index = i
          // this_api = api_pool[i]
          //实例化新的类
          const options: ChatGPTUnofficialProxyAPIOptions = {
            accessToken: getAccessToken()[i],
            apiReverseProxyUrl: api_reverse_proxy,
            model,
            debug: !disableDebug,
          }
          setupProxy(options)
          this_api = new ChatGPTUnofficialProxyAPI({ ...options })
          break;  
        }
      }
      LogFunc("[+]Use api_index: " + index + " , all status: "+api_status_pool.join("_"))
      const response = await this_api.sendMessage(message, {
        ...options,
        onProgress: (partialResponse) => {
          // LogFunc("[+]execute onProgress of " + message) // 应该加上问题message
          process?.(partialResponse)
        },
      })
      // 这个点不是程序必须经过的点，因为下面有个catch err
      // 测试该sendResponse是否是影响服务端不能并发响应用户的原因，答案：不是
      return sendResponse({ type: 'Success', data: response })
    }
  }
  catch (error: any) {
    const code = error.statusCode
    global.console.log(error)
    if (Reflect.has(ErrorCodeMessage, code))
      return sendResponse({ type: 'Fail', message: ErrorCodeMessage[code] })
    return sendResponse({ type: 'Fail', message: error.message ?? 'Please check the back-end console' })
  }
  finally{
    // 在try或者catch或者return前会执行该操作
    api_status_pool[index] -= 1
    LogFunc("[+]make api_index -1: " + index + " value "+ api_status_pool[index].toString() +" before response")
  }
}

async function fetchUsage() {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  const OPENAI_API_BASE_URL = process.env.OPENAI_API_BASE_URL

  if (!isNotEmptyString(OPENAI_API_KEY))
    return Promise.resolve('-')

  const API_BASE_URL = isNotEmptyString(OPENAI_API_BASE_URL)
    ? OPENAI_API_BASE_URL
    : 'https://api.openai.com'

  const [startDate, endDate] = formatDate()

  // 每月使用量
  const urlUsage = `${API_BASE_URL}/v1/dashboard/billing/usage?start_date=${startDate}&end_date=${endDate}`

  const headers = {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/json',
  }

  const options = {} as SetProxyOptions

  setupProxy(options)

  try {
    // 获取已使用量
    const useResponse = await options.fetch(urlUsage, { headers })
    if (!useResponse.ok)
      throw new Error('获取使用量失败')
    const usageData = await useResponse.json() as UsageResponse
    const usage = Math.round(usageData.total_usage) / 100
    return Promise.resolve(usage ? `$${usage}` : '-')
  }
  catch (error) {
    global.console.log(error)
    return Promise.resolve('-')
  }
}

function formatDate(): string[] {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const lastDay = new Date(year, month, 0)
  const formattedFirstDay = `${year}-${month.toString().padStart(2, '0')}-01`
  const formattedLastDay = `${year}-${month.toString().padStart(2, '0')}-${lastDay.getDate().toString().padStart(2, '0')}`
  return [formattedFirstDay, formattedLastDay]
}

async function chatConfig() {
  const usage = await fetchUsage()
  const reverseProxy = process.env.API_REVERSE_PROXY ?? '-'
  const httpsProxy = (process.env.HTTPS_PROXY || process.env.ALL_PROXY) ?? '-'
  const socksProxy = (process.env.SOCKS_PROXY_HOST && process.env.SOCKS_PROXY_PORT)
    ? (`${process.env.SOCKS_PROXY_HOST}:${process.env.SOCKS_PROXY_PORT}`)
    : '-'
  return sendResponse<ModelConfig>({
    type: 'Success',
    data: { apiModel, reverseProxy, timeoutMs, socksProxy, httpsProxy, usage },
  })
}

function setupProxy(options: SetProxyOptions) {
  if (isNotEmptyString(process.env.SOCKS_PROXY_HOST) && isNotEmptyString(process.env.SOCKS_PROXY_PORT)) {
    const agent = new SocksProxyAgent({
      hostname: process.env.SOCKS_PROXY_HOST,
      port: process.env.SOCKS_PROXY_PORT,
      userId: isNotEmptyString(process.env.SOCKS_PROXY_USERNAME) ? process.env.SOCKS_PROXY_USERNAME : undefined,
      password: isNotEmptyString(process.env.SOCKS_PROXY_PASSWORD) ? process.env.SOCKS_PROXY_PASSWORD : undefined,
    })
    options.fetch = (url, options) => {
      return fetch(url, { agent, ...options })
    }
  }
  else if (isNotEmptyString(process.env.HTTPS_PROXY) || isNotEmptyString(process.env.ALL_PROXY)) {
    const httpsProxy = process.env.HTTPS_PROXY || process.env.ALL_PROXY
    if (httpsProxy) {
      const agent = new HttpsProxyAgent(httpsProxy)
      options.fetch = (url, options) => {
        return fetch(url, { agent, ...options })
      }
    }
  }
  else {
    options.fetch = (url, options) => {
      return fetch(url, { ...options })
    }
  }
}

function currentModel(): ApiModel {
  return apiModel
}

export type { ChatContext, ChatMessage }

export { chatReplyProcess, chatConfig, currentModel }
