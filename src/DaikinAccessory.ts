import {
  CharacteristicEventTypes,
  DaikinAccessoryConfig,
  TemperatureUnit,
} from './utils/types';
import DaikinApi from './utils/api';
import { api, callbackify, parse } from './utils';

class DaikinAccessory {
  private services: any[] = [];

  model: string | null = null;
  firmwareRevision: number | null = null;

  api: any;
  name: string;
  unit: TemperatureUnit = TemperatureUnit.CELSIUS;

  constructor(
    private Service: any,
    private Characteristic: any,
    private log: any,
    private config: DaikinAccessoryConfig
  ) {
    this.api = new DaikinApi(config);
    this.log = log;
    this.name = config.name;

    if (config.unit) {
      if (Object.values(TemperatureUnit).includes(config.unit)) {
        this.unit = config.unit;
      } else {
        this.log.warn(
          `${config.unit} is an unsupported temperature unit! Using default!`
        );
      }
    }

    this.getModelInfo();

    this.services.push(this.getInformationService());
    this.services.push(this.getHeaterCoolerService(this.name));
  }

  getServices() {
    return this.services;
  }

  private async getModelInfo() {
    const { model } = await this.api.getModelInfo();
    const { ver } = await this.api.getBasicInfo();
    this.model = model;
    this.firmwareRevision = ver;
  }

  private getInformationService() {
    const service = new this.Service.AccessoryInformation();

    service
      .setCharacteristic(this.Characteristic.Manufacturer, 'Daikin')
      .setCharacteristic(this.Characteristic.Model, this.model)
      .setCharacteristic(
        this.Characteristic.FirmwareRevision,
        this.firmwareRevision
      );

    return service;
  }

  private getHeaterCoolerService(name: string) {
    const service = new this.Service.HeaterCooler(name);

    // Active
    service
      .getCharacteristic(this.Characteristic.Active)
      .on(CharacteristicEventTypes.GET, callbackify(this.getActive))
      .on(CharacteristicEventTypes.SET, callbackify(this.setActive));

    // CurrentHeaterCoolerState
    service
      .getCharacteristic(this.Characteristic.CurrentHeaterCoolerState)
      .on(CharacteristicEventTypes.GET, callbackify(this.getHeaterCoolerState));

    // TargetHeaterCoolerState
    service
      .getCharacteristic(this.Characteristic.TargetHeaterCoolerState)
      .on(
        CharacteristicEventTypes.GET,
        callbackify(this.getTargetHeaterCoolerState)
      )
      .on(
        CharacteristicEventTypes.SET,
        callbackify(this.setTargetHeaterCoolerState)
      );

    // CurrentTemperature
    service
      .getCharacteristic(this.Characteristic.CurrentTemperature)
      .setProps({
        minValue: -100,
        maxValue: 100,
      })
      .on(CharacteristicEventTypes.GET, callbackify(this.getTemperature));

    // CoolingThresholdTemperature
    service
      .getCharacteristic(this.Characteristic.CoolingThresholdTemperature)
      .on(
        CharacteristicEventTypes.GET,
        callbackify(this.getCoolingThresholdTemperature)
      )
      .on(
        CharacteristicEventTypes.SET,
        callbackify(this.setCoolingThresholdTemperature)
      );

    return service;
  }

  private getActive = async () => {
    const { pow, mode } = await this.api.getControlInfo();
    this.log.info('Power: %s.', pow === 1 ? 'On' : 'Off');
    return pow === 1
      ? this.Characteristic.Active.ACTIVE
      : this.Characteristic.Active.INACTIVE;
  };

  private setActive = async (power: number) => {
    const params = await this.api.getControlInfo();
    this.log.info('Power switched to %s.', power === 1 ? 'On' : 'Off');
    params.pow = power;
    return this.api.setControlInfo(params);
  };

  private getHeaterCoolerState = async () => {
    const params = await this.api.getControlInfo();
    let status = this.Characteristic.CurrentHeaterCoolerState.INACTIVE;

    if (params.pow === 1) {
      switch (params.mode) {
        case 3:
          status = this.Characteristic.CurrentHeaterCoolerState.COOLING;
          break;
        case 4:
          status = this.Characteristic.CurrentHeaterCoolerState.HEATING;
          break;
        default:
          status = this.Characteristic.CurrentHeaterCoolerState.IDLE;
      }
    }

    this.log.debug(`CurrentHeaterCoolerState: ${status}`);

    return status;
  };

  private getTargetHeaterCoolerState = async () => {
    const params = await this.api.getControlInfo();
    let status = params.mode;

    switch (params.mode) {
      case 3:
        status = this.Characteristic.TargetHeaterCoolerState.COOL;
        break;
      case 4:
        status = this.Characteristic.TargetHeaterCoolerState.HEAT;
        break;
      default:
        status = this.Characteristic.TargetHeaterCoolerState.AUTO;
    }

    this.log.debug(`TargetHeaterCoolerState: ${status}`);

    return status;
  };

  private setTargetHeaterCoolerState = async (state: any) => {
    const params = await this.api.getControlInfo();

    this.log.debug('TargetHeaterCoolerState changed to %s.', state);

    switch (state) {
      case this.Characteristic.TargetHeaterCoolerState.AUTO:
        params.mode = 0;
        break;
      case this.Characteristic.TargetHeaterCoolerState.COOL:
        params.mode = 3;
        break;
      case this.Characteristic.TargetHeaterCoolerState.HEAT:
        params.mode = 4;
        break;
      default:
        break;
    }

    return this.api.setControlInfo(params);
  };

  private getTemperature = async () => {
    const params = await this.api.getSensorInfo();
    let temperature = params.htemp;

    if (this.unit === TemperatureUnit.FAHRENHEIT) {
      temperature = (temperature - 32) / 1.8;
    }

    this.log.info(
      `Current temperature is ${temperature} degrees ${this.unit}.`
    );

    return temperature;
  };

  private getCoolingThresholdTemperature = async () => {
    const { stemp: coolingThresholdTemp } = await this.api.getControlInfo();
    return coolingThresholdTemp;
  };

  private setCoolingThresholdTemperature = async (temp: any) => {
    const params = await this.api.getControlInfo();

    temp = Math.round(temp * 2) / 2; // Daikin only supports steps of 0.5 degree.
    temp = temp.toFixed(1); // Daikin always expects a precision of 1.

    params.stemp = temp;
    params.dt3 = temp;

    return this.api.setControlInfo(params);
  };
}

export default DaikinAccessory;
