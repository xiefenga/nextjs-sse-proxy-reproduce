import http from 'node:http'

const port = process.env.SSE_PORT && parseInt(process.env.SSE_PORT)

if (!port) {
  throw new Error('Please provide a port number')
}

interface SendMessageOptions {
  initId: number
  event: string
}

const createSendMessage = (response: http.ServerResponse<http.IncomingMessage>, options: SendMessageOptions) => {
  let _id = options.initId
  const event = options.event
  return (data?: unknown) => {
    const id = _id++
    response.write(`event: ${event}\n`)
    response.write(`id: ${id}\n`)
    response.write(`retry: 30000\n`)
    response.write(`data: ${JSON.stringify({ id, time: Date.now(), data })}\n\n`)
  }
}

const server = http.createServer((request, response) => {
  if (request.url === '/sse' && request.method === 'POST') {
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    })

    const initId = typeof request.headers['Last-Event-Id'] === 'string' ? parseInt(request.headers['Last-Event-Id']) : 0

    const sendMessage = createSendMessage(response, { initId, event: 'custom' })

    let time = 0

    const intervalId = setInterval(() => {
      sendMessage('hello')
      time ++
      if (time >=10) {
        clearInterval(intervalId)
        response.end()
        time = 0
      }
    }, 1000)

    request.on('close', () => {
      clearInterval(intervalId)
      response.end()
    })
  } else {
    response.writeHead(404)
    response.end()
  }
})

server.listen(port, () => console.log(`Server listening on port ${port}`))