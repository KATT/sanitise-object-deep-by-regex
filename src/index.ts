export interface ISanitizeOptions {
  keys: string[];
  regex: RegExp[];
  replaceWith: string;
}

export function isBlacklisted(
  key: string,
  fullPath: string,
  keys: Set<string>,
  regex: RegExp[],
): boolean {
  if (keys.has(key)) {
    return true;
  }

  for (const reg of regex) {
    if (reg.test(fullPath)) {
      return true;
    }
  }

  return false;
}

function _sanitize(
  obj,
  keys: Set<string>,
  regex: RegExp[],
  replaceWith: string,
  path: string,
  seenObjects: WeakMap<any, any>,
) {
  if (seenObjects.has(obj)) {
    return seenObjects.get(obj);
  }

  if (Array.isArray(obj)) {
    const newPath = path + '[]';
    const newArray = new Array(obj.length);
    seenObjects.set(obj, newArray);

    obj.forEach((entry, index) => {
      newArray[index] = _sanitize(
        entry,
        keys,
        regex,
        replaceWith,
        newPath,
        seenObjects,
      );
    });

    return newArray;
  }

  if (typeof obj === 'object') {
    const newObj: any = {};
    seenObjects.set(obj, newObj);

    // tslint:disable-next-line:forin
    for (const key in obj) {
      const prefix = path ? `${path}.` : '';
      const fullPath = prefix + key;

      const val = isBlacklisted(key, fullPath, keys, regex)
        ? replaceWith
        : _sanitize(obj[key], keys, regex, replaceWith, fullPath, seenObjects);

      newObj[key] = val;
    }
    return newObj;
  }

  return obj;
}

export function sanitize(
  obj,
  opts: Partial<ISanitizeOptions> = {},
  path = '',
): any {
  const { replaceWith = '[redacted]', keys = [], regex = [] } = opts;
  const seenObjects = new WeakMap<any, any>();

  return _sanitize(obj, new Set(keys), regex, replaceWith, path, seenObjects);
}

export default sanitize;
