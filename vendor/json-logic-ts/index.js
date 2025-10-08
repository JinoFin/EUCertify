function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function truthy(value) {
  return !!value;
}

function getVar(data, path, defaultValue) {
  if (typeof path !== 'string' || path.length === 0) {
    return path === '' ? data : defaultValue;
  }
  const segments = path.split('.');
  let current = data;
  for (const segment of segments) {
    if (current == null) {
      return defaultValue;
    }
    current = current[segment];
  }
  return current === undefined ? defaultValue : current;
}

function compareSequential(values, data, comparator) {
  const evaluated = values.map((item) => apply(item, data));
  if (evaluated.length < 2) {
    return false;
  }
  for (let index = 1; index < evaluated.length; index += 1) {
    if (!comparator(evaluated[index - 1], evaluated[index])) {
      return false;
    }
  }
  return true;
}

function apply(rule, data) {
  if (rule === null || rule === undefined) {
    return rule;
  }
  if (Array.isArray(rule)) {
    return rule.map((item) => apply(item, data));
  }
  if (!isObject(rule)) {
    return rule;
  }

  const operators = Object.keys(rule);
  if (operators.length !== 1) {
    throw new Error('Invalid logic rule');
  }

  const operator = operators[0];
  const value = rule[operator];

  switch (operator) {
    case 'var': {
      if (Array.isArray(value)) {
        const [path, defaultValue] = value;
        const resolved = getVar(data, path, defaultValue);
        return resolved === undefined ? defaultValue : resolved;
      }
      return getVar(data, value, undefined);
    }
    case '!': {
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return true;
        }
        if (value.length === 1) {
          return !truthy(apply(value[0], data));
        }
        return !value.some((item) => truthy(apply(item, data)));
      }
      return !truthy(apply(value, data));
    }
    case 'and': {
      if (!Array.isArray(value)) {
        return truthy(apply(value, data));
      }
      return value.every((item) => truthy(apply(item, data)));
    }
    case 'or': {
      if (!Array.isArray(value)) {
        return truthy(apply(value, data));
      }
      return value.some((item) => truthy(apply(item, data)));
    }
    case '==': {
      const values = Array.isArray(value) ? value : [value];
      const evaluated = values.map((item) => apply(item, data));
      if (evaluated.length === 0) {
        return false;
      }
      return evaluated.every((item) => item === evaluated[0]);
    }
    case '>':
      return compareSequential(Array.isArray(value) ? value : [value], data, (a, b) => a > b);
    case '>=':
      return compareSequential(Array.isArray(value) ? value : [value], data, (a, b) => a >= b);
    case '<':
      return compareSequential(Array.isArray(value) ? value : [value], data, (a, b) => a < b);
    case '<=':
      return compareSequential(Array.isArray(value) ? value : [value], data, (a, b) => a <= b);
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
}

module.exports = {
  apply
};
