function parse(response: string) {
  const values: Record<string, string> = {};
  if (response) {
    const items = response.split(',');
    const length = items.length;
    for (let i = 0; i < length; i++) {
      const keyVal = items[i].split('=');
      values[keyVal[0]] = keyVal[1];
    }
  }
  return values;
}

export default parse;
