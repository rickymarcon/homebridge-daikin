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

export interface DaikinAccessoryConfig {
  name: string;
  host: string;
  uuid?: string;
  unit?: TemperatureUnit;
}

export type ControlInfo = {
  pow: number;
  mode: string;
};
