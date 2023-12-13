const bb = require("./lib/barebones");
const { Echo, sendOne } = require("./lib/pubsub");

const args = {
  topic: "sdk/test/js",
  message: "por qué no los dos",
  count: 2,
};

async function main(argv) {
  const connection = await bb.connect();

  // Bare minimum single message, or more complicated multi-message object
  console.log(await sendOne(connection, argv.topic, argv.message));
  // await new Echo(argv.topic, argv.message, argv.count).execute(connection);

  await bb.disconnect(connection);
}

main(args);
