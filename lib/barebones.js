require("dotenv").config();
const { statSync } = require('node:fs');
const { basename } = require('node:path');
const { readdir } = require("node:fs/promises");
const { exit } = require("process");
const iotsdk = require("aws-iot-device-sdk-v2");
const io = iotsdk.io;
const iot = iotsdk.iot;
const mqtt = iotsdk.mqtt;
const exit_code = require("./exitcodes");

exports.config = {
  verbosity: "NONE", // ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'none']
  cert: "something.cert.pem", // path to <thing>.cert.pem
  key: "something.private.key", // path to <thing>.private.key
  ca_file: "AmazonRootCA1.pem", // path to public root-CA.crt
  client_id: "",
  endpoint: "",
};

const defaultKeysDir = "keys-go-here";
const certRegex = /(.+)\.cert\.pem$/;
const keyRegex = /(.+)\.private\.key$/;

function loadFromEnv() {
  const { VERBOSITY, ENDPOINT, CLIENT_ID } = process.env;
  if (VERBOSITY) {
    const u = VERBOSITY.toUpperCase();
    const v = io.LogLevel[u];
    if (!v && v != 0) { // 0 or '0'
      throw `unsupported VERBOSITY: ${VERBOSITY}`;
    }
    exports.config.verbosity = u;
  }
  if (!ENDPOINT) {
    throw "no ENDPOINT specified in environment or .env";
  }
  exports.config.endpoint = ENDPOINT;
  if (!CLIENT_ID) {
    throw "no CLIENT_ID specified in environment or .env";
  }
  exports.config.client_id = CLIENT_ID;
}

function autoDir() {
  const keysDir = "keys-" + basename(process.argv[1], ".js");
  const stat = statSync(keysDir, {throwIfNoEntry: false});
  if (stat?.isDirectory()) {
    return keysDir;
  }
  return defaultKeysDir;
}

async function loadFromDir() {
  let cert = "";
  let key = "";
  let root = "";
  const dir = autoDir();
  const files = await readdir(dir);
  for (f of files) {
    let m = certRegex.exec(f);
    if (m) {
      cert = m[1];
      continue;
    }
    m = keyRegex.exec(f);
    if (m) {
      key = m[1];
      continue;
    }
    if (f === exports.config.ca_file) {
      root = f;
    }
  }
  if (!cert && !key) {
    throw `${dir}: found neither *.cert.pem nor *.private.key`;
  } else if (!cert) {
    throw `${dir}: found ${key}.private.key but no *.cert.pem`;
  } else if (!key) {
    throw `${dir}: found ${cert}.cert.pem but no *.private.key`;
  } else if (cert !== key) {
    throw `${dir}: ${key}.private.key does not match ${cert}.cert.pem`;
  }
  exports.config.cert = `${dir}/${cert}.cert.pem`;
  exports.config.key = `${dir}/${key}.private.key`;
  if (!root) {
    throw `${dir}: not found: ${exports.config.ca_file}. Try: npm run root-ca`;
  }
  exports.config.ca_file = `${dir}/${root}`;
}

exports.autoConfig = async function () {
  try {
    loadFromEnv();
    await loadFromDir();
    return exports.config;
  } catch (x) {
    console.error(x);
    exit(exit_code.INVALID_CONFIG);
  }
};

async function buildConnection() {
  await exports.autoConfig();
  console.log(`Using identity ${exports.config.cert}`);

  const level = parseInt(io.LogLevel[exports.config.verbosity]);
  io.enable_logging(level);

  // Only direct connections. Could add basic websocket connections.
  const config_builder = iot.AwsIotMqttConnectionConfigBuilder
    .new_mtls_builder_from_path(exports.config.cert, exports.config.key);
  // Could add proxy host here.
  config_builder.with_certificate_authority_from_path(
    undefined,
    exports.config.ca_file,
  );
  config_builder.with_clean_session(false);
  config_builder.with_client_id(exports.config.client_id);
  config_builder.with_endpoint(exports.config.endpoint);
  const config = config_builder.build();

  const client = new mqtt.MqttClient();
  return client.new_connection(config);
}

exports.connect = async function () {
  try {
    const connection = await buildConnection();
    connection.on('disconnect', () => {
      console.log('Disconnected from AWS IoT. Exiting.');
      process.exit(exit_code.DIED_DIRTY);
    });
    await connection.connect();
    console.log('Connected to AWS IoT.');
    return connection;
  } catch (x) {
    console.error("Connect error:", x);
    exit(exit_code.PARTIAL_START);
  }
};

exports.disconnect = async function (connection) {
  try {
    await connection.disconnect();
  } catch (x) {
    console.error("Disconnect error:", x);
    exit(exit_code.DIED_DIRTY);
  }
};
