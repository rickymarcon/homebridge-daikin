import DaikinAccessory from './DaikinAccessory';

export default (homebridge: any) => {
  homebridge.registerAccessory(
    'homebridge-daikin-unofficial',
    'Daikin',
    DaikinAccessory.bind(
      DaikinAccessory,
      homebridge.hap.Service,
      homebridge.hap.Characteristic
    )
  );
};
