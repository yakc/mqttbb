# keys-go-here

Directory to contain keys and certs that are autodetected at startup, to setup
your MQTT connection.

## Generated keys for your _thingName_

Run the "Connect one device" wizard and unzip the contents of the resulting
`connect_device_package.zip` here. Only two files are required:

- _thingName_ `.cert.pem`
- _thingName_ `.private.key`

The ZIP will also contain:

- _thingName_ `.public.key` -- the other half of the key pair
- _thingName_ `-Policy` -- a copy of the initial generated policy
- `start.sh` -- a start script with the specific generated filenames and your
  endpoint, to start the sample pub/sub app

### Endpoint

The endpoint is also shown in the first page of the wizard. It can be extracted
from `start.sh` with (in the project root)

```bash
npm run grep-endpoint
```

The endpoint must be set in directly in the environment, or in the `.env` file

```bash
ENDPOINT=somewhere-abcxyz.iot.us-east-1.amazonaws.com
```

## Amazon Root CA certificate

The barebones starter will also expect to find the Amazon root-CA cert,
`AmazonRootCA1.pem`, in this directory. You can download it by running (in the
project root)

```bash
npm run root-ca
```

which actually just does

```bash
curl -O https://www.amazontrust.com/repository/AmazonRootCA1.pem
```

and moves that file here.
