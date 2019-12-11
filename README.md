# Daikin Accessory

[![NPM version](https://img.shields.io/npm/v/homebridge-daikin-unofficial?style=for-the-badge&logo=appveyor)](https://www.npmjs.com/package/homebridge-daikin-unofficial)

A [Homebridge](https://github.com/nfarina/homebridge) plugin for Daikin.

## Install

```bash
sudo npm install -g --unsafe-perm homebridge-daikin-unofficial
```

## Configuration

```json
{
  "accessories": [
    {
      "accessory": "Daikin",
      "name": "Air Conditioner",
      "host": "192.168.x.xx"
    }
  ]
}
```

## Options

- `accessory` - Accessory name. Must be set to "Daikin".
- `name` - The device name.
- `host` - The URL of the device.
- `swingMode` - The fan swing mode can be set to one of the following:
  - `0`: No swing
  - `1`: Vertical swing
  - `2`: Horizontal swing
  - `3`: 3D swing
- `unit` - Temperature unit:
  - `celsius` (default)
  - `fahrenheit`

## Connecting over HTTPS

Some new Daikin models use `https` instead of `http` to connect (see this [forum post](https://community.home-assistant.io/t/daikin-brp072c42-wifi-custom-component/126981)). In order to connect over `https` you must pass in your registered `X-Daikin-uuid`. Alternatively, you can create your own and register it as a valid token by doing the following:

1. [Generate a UUID4](https://www.uuidgenerator.net/).

```bash
# Example
7b9c9a47-c9c6-4ee1-9063-848e67cc7edd
```

2. Remove hyphens from the UUID.

```bash
# Example
7b9c9a47c9c64ee19063848e67cc7edd
```

3. Get the 13-digit key from the sticker on the back of the controller.

```bash
# Example
0123456789012
```

4. Register your UUID as a valid token:

```bash
curl -k "https://<CONTROLLER_IP>/common/register_terminal?key=<KEY>" \
  -H "X-Daikin-uuid: <UUID>"
```

5. Add UUID to config:

```json
{
  "accessories": [
    {
      "accessory": "Daikin",
      "name": "Air Conditioner",
      "host": "192.168.x.xx",
      "uuid": "#########"
    }
  ]
}
```
