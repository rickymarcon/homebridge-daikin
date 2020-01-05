import request from 'request-promise';
import { API, DaikinParams, DaikinAccessoryConfig } from './types';

function transform(body: string): DaikinParams<string, number | string> {
  const result: Record<string, string | number> = {};

  if (body) {
    const items = body.split(',');
    for (let i = 0; i < items.length; i++) {
      const [key, value] = items[i].split('=');
      result[key] = isNaN(Number(value)) ? value : Number.parseFloat(value);
    }
  }

  return result;
}

class DaikinApi {
  options: request.OptionsWithUri;

  constructor(config: DaikinAccessoryConfig) {
    if (!config.host) {
      throw new Error("Missing property 'host' in config!");
    }

    const options: request.OptionsWithUri = {
      uri: config.host,
      method: 'GET',
      strictSSL: false,
      headers: {},
      transform,
      timeout: 20000,
    };

    if (config.uuid) {
      options.headers!['X-Daikin-uuid'] = config.uuid;
    }

    this.options = options;
  }

  // Return basic information.
  async getBasicInfo(): Promise<DaikinParams<string, number | string>> {
    const response = await request({
      ...this.options,
      uri: `${this.options.uri}${API.GET_BASIC_INFO}`,
    });
    return response;
  }

  // Request Daikin model info.
  async getModelInfo(): Promise<DaikinParams<string, number | string>> {
    const response = await request({
      ...this.options,
      uri: `${this.options.uri}${API.GET_MODEL_INFO}`,
    });
    return response;
  }

  // Request current status parameters.
  async getControlInfo(): Promise<DaikinParams<string, number | string>> {
    const response = await request({
      ...this.options,
      uri: `${this.options.uri}${API.GET_CONTROL_INFO}`,
    });
    return response;
  }

  // Return sensor information such as inside and outside temperatures.
  async getSensorInfo(): Promise<DaikinParams<string, number | string>> {
    const response = await request({
      ...this.options,
      uri: `${this.options.uri}${API.GET_SENSOR_INFO}`,
    });
    return response;
  }

  // Set status parameters.
  async setControlInfo(
    params: DaikinParams<string, number | string>
  ): Promise<void> {
    const query = Object.keys(params)
      .map(param => `${param}=${params[param]}`)
      .join('&');
    await request({
      ...this.options,
      uri: `${this.options.uri}${API.SET_CONTROL_INFO}?${query}`,
    });
    return;
  }
}

export default DaikinApi;
