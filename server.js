const bb = require("./lib/barebones");
const { Echo } = require("./lib/pubsub");

const args = {
  topic: "sdk/test/js",
  message: "por qué no los dos",
  count: 2,
};

async function main(argv) {
  const connection = await bb.connect();
  await new Echo(argv.topic, argv.message, argv.count).execute(connection);
  await bb.disconnect(connection);
}

main(args);
