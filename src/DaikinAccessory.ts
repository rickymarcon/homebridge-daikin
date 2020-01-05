import {
  CharacteristicEventTypes,
  DaikinAccessoryConfig,
  TemperatureUnit,
  Mode,
  Power,
  FanDirection,
} from './utils/types';
import DaikinApi from './utils/api';
import { callbackify } from './utils';

class DaikinAccessory {
  private services: any[] = [];

  model: string | null = null;
  firmwareRevision: number | null = null;

  api: any;
  name: string;
  swingMode: FanDirection = 0;
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

    if (config.swingMode) {
      this.swingMode = config.swingMode;
    }

    this.getModelInfo();

    this.services.push(this.getInformationService());
    this.services.push(this.getHeaterCoolerService(this.name));
  }

  getServices(): any[] {
    return this.services;
  }

  private async getModelInfo(): Promise<any> {
    const { model } = await this.api.getModelInfo();
    const { ver } = await this.api.getBasicInfo();
    this.model = model;
    this.firmwareRevision = ver;
  }

  private getInformationService(): any {
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

  private getHeaterCoolerService(name: string): any {
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

    // Swing Mode
    service
      .getCharacteristic(this.Characteristic.SwingMode)
      .on(CharacteristicEventTypes.GET, callbackify(this.getSwingMode))
      .on(CharacteristicEventTypes.SET, callbackify(this.setSwingMode));

    // Rotation Speed
    service
      .getCharacteristic(this.Characteristic.RotationSpeed)
      .on(CharacteristicEventTypes.GET, callbackify(this.getRotationSpeed))
      .on(CharacteristicEventTypes.SET, callbackify(this.setRotationSpeed));

    return service;
  }

  private getActive = async (): Promise<number> => {
    const { pow } = await this.api.getControlInfo();
    this.log.info('Power: %s.', pow === Power.ON ? 'On' : 'Off');
    return pow === Power.ON
      ? this.Characteristic.Active.ACTIVE
      : this.Characteristic.Active.INACTIVE;
  };

  private setActive = async (power: number): Promise<void> => {
    const params = await this.api.getControlInfo();
    this.log.info('Power switched to %s.', power === 1 ? 'On' : 'Off');
    params.pow = power;
    return this.api.setControlInfo(params);
  };

  private getHeaterCoolerState = async (): Promise<number> => {
    const params = await this.api.getControlInfo();
    let status = this.Characteristic.CurrentHeaterCoolerState.INACTIVE;

    if (params.pow === Power.ON) {
      switch (params.mode) {
        case Mode.COOL:
          status = this.Characteristic.CurrentHeaterCoolerState.COOLING;
          break;
        case Mode.HEAT:
          status = this.Characteristic.CurrentHeaterCoolerState.HEATING;
          break;
        default:
          status = this.Characteristic.CurrentHeaterCoolerState.IDLE;
      }
    }

    this.log.debug(`CurrentHeaterCoolerState: ${status}`);

    return status;
  };

  private getTargetHeaterCoolerState = async (): Promise<number> => {
    const params = await this.api.getControlInfo();
    let status = params.mode;

    switch (params.mode) {
      case Mode.COOL:
        status = this.Characteristic.TargetHeaterCoolerState.COOL;
        break;
      case Mode.HEAT:
        status = this.Characteristic.TargetHeaterCoolerState.HEAT;
        break;
      default:
        status = this.Characteristic.TargetHeaterCoolerState.AUTO;
    }

    this.log.debug(`TargetHeaterCoolerState: ${status}`);

    return status;
  };

  private setTargetHeaterCoolerState = async (state: any): Promise<void> => {
    const params = await this.api.getControlInfo();

    this.log.debug('TargetHeaterCoolerState changed to %s.', state);

    switch (state) {
      case this.Characteristic.TargetHeaterCoolerState.AUTO:
        params.mode = Mode.AUTO;
        break;
      case this.Characteristic.TargetHeaterCoolerState.COOL:
        params.mode = Mode.COOL;
        break;
      case this.Characteristic.TargetHeaterCoolerState.HEAT:
        params.mode = Mode.HEAT;
        break;
      default:
        break;
    }

    return this.api.setControlInfo(params);
  };

  private getTemperature = async (): Promise<number> => {
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

  private getCoolingThresholdTemperature = async (): Promise<number> => {
    const { stemp: coolingThresholdTemp } = await this.api.getControlInfo();
    return coolingThresholdTemp;
  };

  private setCoolingThresholdTemperature = async (
    temp: number
  ): Promise<void> => {
    const params = await this.api.getControlInfo();

    temp = Math.round(temp * 2) / 2; // Daikin only supports steps of 0.5 degree.
    temp = parseFloat(temp.toFixed(1)); // Daikin always expects a precision of 1.

    params.stemp = temp;
    params.dt3 = temp;

    return this.api.setControlInfo(params);
  };

  private getSwingMode = async (): Promise<number> => {
    const { f_dir: fanDirection } = await this.api.getControlInfo();
    return fanDirection === FanDirection.DISABLED
      ? this.Characteristic.SwingMode.SWING_DISABLED
      : this.Characteristic.SwingMode.SWING_ENABLED;
  };

  private setSwingMode = async (swing: number): Promise<void> => {
    const params = await this.api.getControlInfo();
    if (swing !== this.Characteristic.SwingMode.SWING_DISABLED)
      swing = this.swingMode;
    // eslint-disable-next-line @typescript-eslint/camelcase
    params.f_dir = params.b_f_dir = swing;
    return this.api.setControlInfo(params);
  };

  private getRotationSpeed = async (): Promise<number> => {
    const { f_rate: fanSpeed } = await this.api.getControlInfo();
    return fanSpeed;
  };

  private setRotationSpeed = async (speed: number): Promise<void> => {
    const params = await this.api.getControlInfo();
    let rate = 'A'; // Auto
    if (speed > 0 && speed <= 9) {
      rate = 'B'; // Silent
    } else if (speed > 9 && speed < 20) {
      rate = 'A';
    } else if (speed >= 20 && speed < 30) {
      rate = '3'; // lvl_1
    } else if (speed >= 30 && speed < 40) {
      rate = '4'; // lvl_2
    } else if (speed >= 40 && speed < 60) {
      rate = '5'; // lvl_3
    } else if (speed >= 60 && speed < 80) {
      rate = '6'; // lvl_4
    } else if (speed >= 80 && speed <= 100) {
      rate = '7'; // lvl_5
    }

    // eslint-disable-next-line @typescript-eslint/camelcase
    params.f_rate = params.b_f_rate = rate;
    return this.api.setControlInfo(params);
  };
}

export default DaikinAccessory;
