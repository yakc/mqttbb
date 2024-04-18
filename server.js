const bb = require("./lib/barebones");
const { executeAll, JsonSubscription, QoS, Echo, sendOne } = require("./lib/pubsub");

const args = {
  topic: "sdk/test/js",
  message: "por qué no los dos",
  count: 2,
};

async function main(argv) {
  const connection = await bb.connect();

  // Bare minimum single message
  //   console.log(await sendOne(connection, argv.topic, argv.message));
  // More complicated multi-message object
  //   await new Echo(argv.topic, argv.message, argv.count).execute(connection);
  // Any number of subscription callbacks, started async
  const subs = executeAll(connection, [
    new JsonSubscription(args.topic,  // any number, but just one here
      (json, topic, dup, qos, retain) => {
        console.log(topic, dup, qos, retain, json);
      }),
  ]).catch(x => {
    console.error(x);
  });

  // Simple publish to a single topic; await to preserve order
  await connection.publish(args.topic, args, QoS.AtLeastOnce);  // JSON payload
  await connection.publish(args.topic, args.message, QoS.AtLeastOnce);  // not JSON

  await subs;  // wait for stuff to happen until reject, then...
  await bb.disconnect(connection);  // ...tear everything down
}

main(args);
