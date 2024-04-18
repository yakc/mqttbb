const { TextDecoder } = require("util");
const iotsdk = require("aws-iot-device-sdk-v2");
const mqtt = iotsdk.mqtt;

class PubSub {
  constructor(topic) {
    this.topic = topic;
  }

  async execute(connection) {
    return new Promise(async (resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      if (this.sub) {
        const decoder = new TextDecoder("utf8");
        const on_publish = (topic, payload, dup, qos, retain) => {
          this.sub(
            new Promise((resolve, reject) => {
              resolve(decoder.decode(payload));
            }),
            topic,
            dup,
            qos,
            retain,
          );
        };
        await connection.subscribe(
          this.topic,
          mqtt.QoS.AtLeastOnce,
          on_publish,
        );
      }

      if (this.pub) {
        while (true) {
          try {
            const json = JSON.stringify(await this.pub());
            await connection.publish(this.topic, json, mqtt.QoS.AtLeastOnce);
          } catch (x) {
            if (x) {
              console.error("publish error:", x);
            } else {
              break;
            }
          }
        }
      }
    });
  }
}

/**
 * Echo both sends and receives messages. It expects to receive as many
 * as it sent; if more than one instance runs at the same time, it may
 * receive the expected number (sent by others) before it sends its own.
 */
class Echo extends PubSub {
  constructor(topic, message, count, delay = 750) {
    super(topic);
    this.message = message;
    this.count = count;
    this.delay = delay * (0.5 + Math.random());
    this.pubCount = this.subCount = 0;
    this.random = Math.random();
  }

  execDone() {
    // console.log(this.random, this.count, this.pubCount, this.subCount);
    if (this.pubCount >= this.count && this.subCount >= this.count) {
      this.resolve();
    }
  }

  /**
   * Returns the Promise of an object payload to publish; or reject with
   * false to stop.
   */
  pub() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this.pubCount < this.count) {
          resolve({
            message: this.message,
            random: this.random,
            sequence: ++this.pubCount,
          });
        } else {
          reject(false);
        }
        this.execDone();
      }, this.pubCount ? this.delay : 0); // send the first immediately
    });
  }

  /**
   * Called with the Promise of a JSON payload received through subscription.
   * The payload may have been invalid, in which case the Promise is rejected,
   * not resolved.
   */
  async sub(payload, topic, dup, qos, retain) {
    console.log(
      `Publish received. topic:"${topic}" dup:${dup} qos:${qos} retain:${retain}`,
    );
    let json;
    try {
      json = await payload;
      const msg = JSON.parse(json);
      console.log(`payload:`, msg);
    } catch (x) {
      console.error("payload error:", x, `\n${json}`);
    }
    this.subCount++;
    this.execDone();
  }
}

/**
 * Subscribes to a topic that receives JSON, with a callback.
 * If the topic receives invalid JSON, the async execute()
 * call rejects with that invalid payload. Otherwise, the
 * resulting promise never resolves.
 */
class JsonSubscription extends PubSub {
  constructor(topic, callback) {
    super(topic);
    this.callback = callback;
  }

  async sub(payload, topic, dup, qos, retain) {
    let json;
    try {
      json = await payload;
      const msg = JSON.parse(json);
      this.callback(msg, topic, dup, qos, retain);
    } catch (x) {
      this.reject({topic, error: x, payload: json});
    }
  }
}

/**
 * PubSub.execute(connection) and wrap with Promise.all
 */
exports.executeAll = (connection, pubSubs) =>
  Promise.all(Array.from(pubSubs, e => e.execute(connection)));

exports.sendOne = async function (connection, topic, message) {
  const decoder = new TextDecoder("utf8");
  return new Promise(async (resolve, reject) => {
    await connection.subscribe(
      topic,
      mqtt.QoS.AtLeastOnce,
      (topic, payload, dup, qos, retain) => {
        try {
          const message = decoder.decode(payload);
          resolve(
            `topic: ${topic}, message: ${message}, dup: ${dup}, qos: ${qos}, retain: ${retain}`,
          );
        } catch (x) {
          reject(x);
        }
      },
    );
    connection.publish(topic, message, mqtt.QoS.AtLeastOnce);
  });
};

exports.PubSub = PubSub;
exports.Echo = Echo;
exports.JsonSubscription = JsonSubscription;
exports.QoS = mqtt.QoS;
