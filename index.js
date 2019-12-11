let Service, Characteristic;

function mySwitch(log, config) {
  this.log = log;
}

mySwitch.prototype = {
  getServices: function() {
    const informationService = new Service.AccessoryInformation();
    informationService
      .setCharacteristic(Characteristic.Manufacturer, 'My switch manufacturer')
      .setCharacteristic(Characteristic.Model, 'My switch model')
      .setCharacteristic(Characteristic.SerialNumber, '123-456-789');

    const switchService = new Service.Switch('My switch');
    switchService
      .getCharacteristic(Characteristic.On)
      .on('get', this.getSwitchOnCharacteristic.bind(this))
      .on('set', this.setSwitchOnCharacteristic.bind(this));

    this.informationService = informationService;
    this.switchService = switchService;
    return [informationService, switchService];
  },

  getSwitchOnCharacteristic: function(next) {
    console.warn('asdf');
  },

  setSwitchOnCharacteristic: function(on, next) {
    console.warn('asdf');
  },
};

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory(
    'homebridge-daikin',
    'MyAwesomeSwitch',
    mySwitch
  );
};
