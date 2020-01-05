export enum API {
  GET_BASIC_INFO = '/common/basic_info',
  GET_MODEL_INFO = '/aircon/get_model_info',
  GET_CONTROL_INFO = '/aircon/get_control_info',
  SET_CONTROL_INFO = '/aircon/set_control_info',
  GET_SENSOR_INFO = '/aircon/get_sensor_info',
}

export enum CharacteristicEventTypes {
  GET = 'get',
  SET = 'set',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  CHANGE = 'change',
}

export enum TemperatureUnit {
  CELSIUS = 'celsius',
  FAHRENHEIT = 'fahrenheit',
}

export enum Power {
  OFF = 0,
  ON = 1,
}

export enum Mode {
  AUTO = 0,
  DEHUMDIFICATOR = 2,
  COOL = 3,
  HEAT = 4,
  FAN = 6,
}

export enum FanDirection {
  DISABLED = 0,
  VERTICAl = 1,
  HORIZONTAL = 2,
  ALL = 3,
}

export interface DaikinAccessoryConfig {
  name: string;
  host: string;
  uuid?: string;
  unit?: TemperatureUnit;
  swingMode: FanDirection;
}

export type DaikinParams<K extends keyof any, T> = {
  [P in K]: T;
};

export type ControlInfo = {
  pow: number;
  mode: string;
};
