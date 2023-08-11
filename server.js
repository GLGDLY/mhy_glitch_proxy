const { type } = require("os");
const path = require("path");

const fastify = require("fastify")({
  logger: false,
});
fastify.register(require('@fastify/websocket'))

var queue = [];  // body queue


// reverse proxy to the client
fastify.register(async function (fastify) {

  // reverse proxy to backend vis websocket
  fastify.get('/ws/', { websocket: true }, async (connection, req) => {
    console.log("new connection on ws");
    while (true) {
      console.log(queue.length);
      if (queue.length != 0) {
        connection.socket.send(queue.shift());
      }
      await new Promise(r => setTimeout(r, 2000));
    }
  })

  // recieve new event
  fastify.post("/", async (request, reply) => {
    var sign = request.headers["x-rpc-bot_sign"]
    if (!sign) {
      return { message: "no sign", retcode: -1 };
    }
    var body = request.body;
    if (!body) {
      return { message: "no body", retcode: -1 };
    }
    body.sign = sign;
    body = JSON.stringify(body);
    console.log("push body: " + body);
    queue.push(body);
    return { message: "", retcode: 0 };
  });
})

// Run the server and report out to the logs
fastify.listen(
  { port: process.env.PORT, host: "127.0.0.1" },
  function (err, address) {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`App is listening on ${address}`);
  }
);
