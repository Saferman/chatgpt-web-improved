interface SendResponseOptions<T = any> {
  type: 'Success' | 'Fail'
  message?: string
  data?: T
}

// 如果这函数传递聊天框的错误信息比如：
// ChatGPT error 404: {"errorMessage":"Conversation not found"}
// 怀疑这个消息是ChatGPT官方解析返回的，由于历史对话携带在了其他的token导致的错误？
export function sendResponse<T>(options: SendResponseOptions<T>) {
  if (options.type === 'Success') {
    return Promise.resolve({
      message: options.message ?? null,
      data: options.data ?? null,
      status: options.type,
    })
  }

  return Promise.reject({
    message: options.message ?? 'Failed',
    data: options.data ?? null,
    status: options.type,
  })
}
