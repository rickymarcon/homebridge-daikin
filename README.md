# Daikin Accessory

A Homebridge plugin for Daikin.

## Configuration

```
{
  "accessories": [
    {
      "accessory": "Daikin",
      "name": "Air Conditioner",
      "host": "localhost",
      "uuid": "#########"
    }
  ]
}
```

## Connecting over HTTPS

New Daikin models use `http` instead of `http` to connect (see this [forum post](https://community.home-assistant.io/t/daikin-brp072c42-wifi-custom-component/126981)). In order to connect over `https` you will require to pass in your registered `X-Daikin-uuid`. Alternatively, you can create your own and register it as a valid token by doing the following:

1. Generate a UUID4 (https://www.uuidgenerator.net/ is one way to do it). eg. 7b9c9a47-c9c6-4ee1-9063-848e67cc7edd
2. Remove hyphens from the UUID. eg. 7b9c9a47c9c64ee19063848e67cc7edd
3. Grab the 13-digit key from the sticker on the back of the controller. eg. 0123456789012
4. Register your UUID as a valid token:

```
curl --insecure -H "X-Daikin-uuid: 7b9c9a47c9c64ee19063848e67cc7edd" -v "https://<controller-ip>/common/register_terminal?key=0123456789012"
```

5. Use the UUID to call the usual API endpoints:

```
curl --insecure -H "X-Daikin-uuid: 7b9c9a47c9c64ee19063848e67cc7edd" -v "https://<controller-ip>/common/basic_info"
```
