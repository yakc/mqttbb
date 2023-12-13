# MQTT barebones

App template for AWS IoT with MQTT.

This reworks
[AWS sample code](https://github.com/aws/aws-iot-device-sdk-js-v2/tree/v1.17.0/samples/node/pub_sub_js)
to provide easy bootstrapping. The "Connect one device" wizard will generate a
new set of keys and certs and a script that will

1. Download the Amazon Root CA cert if needed
2. Clone the entire SDK repo
3. Compile some code there
4. Run the pub/sub example with the new keys

This project makes the usage more obvious

- Uses the IoT SDK as a regular dependency
- Handles the keys by requiring that they be unzipped into a specific
  subdirectory
- Uses [dotenv](https://github.com/motdotla/dotenv) for the other config values
- Provides a helper to create the connection, using those keys
- Offers a variation on the pub/sub example

## Running

Tested with Node v18.18.0

1. Download the root CA certificate
   ```bash
   npm run root-ca
   ```
2. Run the "Connect one device" wizard
3. Unzip the resulting `connect_device_package.zip` into the subdirectory
   [keys-go-here](keys-go-here/)
4. Extract the endpoint from the start script
   ```bash
   echo "ENDPOINT=$(npm run grep-endpoint | tail -n 1)" > .env
   ```
5. Use the default client ID
   ```bash
   echo "CLIENT_ID=sdk-nodejs-v2" >> .env
   ```

The app is now ready to run

```bash
npm start
```

runs `server.js`, which should take a few seconds to echo a few values through
pub/sub.
