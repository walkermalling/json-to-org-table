const args = process.argv.slice(2);
const url = require('url');

const DELIMITER = ',';
const BOOKENDER = '';

const opts = args.reduce((accumulator, val, index, arr) => {
  if (val[0] === '-') {
    const name = val.slice(1);
    accumulator[name] = [];
    var i = index + 1;
    while (arr[i] && arr[i][0] !== '-') {
      accumulator[name].push(arr[i]);
      i += 1;
    }
  }
  return accumulator;
}, {});

const approved = (key) => {
  if (opts.j) {
    return opts.j.indexOf(key) > -1;
  }
  if (opts.i) {
    return opts.i.indexOf(key) === -1;
  }
  return true;
};

const getTransformer = (key) => {
  const transformers = {
    'event:url': (val) => url.parse(val).path,
  };
  if (transformers[key]) {
    return transformers[key];
  }
  return (thing) => thing;
};

const keyToColumnNumber = {};

const getColumnNumber = (key) => {
  if (keyToColumnNumber[key] === undefined) {
    keyToColumnNumber[key] = Object.keys(keyToColumnNumber).length;
  }
  return keyToColumnNumber[key];
};

const writeArrayToStdout = (arr) => {
  process.stdout.write(`${BOOKENDER}${arr.join(DELIMITER)}\n`);
}

const doRow = (line) => {
  var row = [];
  Object.keys(line).forEach((key) => {
    if (typeof line[key] === 'object') {
      Object.keys(line[key]).forEach((subKey) => {
        const combinedKey = `${key}:${subKey}`;
        const transformer = getTransformer(combinedKey); 
        if (approved(combinedKey)) {
          row[getColumnNumber(combinedKey)] = transformer(line[key][subKey]);
        }
      });
    } else {
      const transformer = getTransformer(key);
      if (approved(key)) {
        row[getColumnNumber(key)] = transformer(line[key]);
      }
    }
  });
  writeArrayToStdout(row);
};

const parseLog = (log) => {
  log.split('\n')
    .map((line) => {
      var result = false;
      try {
        result = JSON.parse(line);
      } catch (e) {}
      return result;
    })
    .filter(stuff => !!stuff)
    .forEach(doRow);
  
  const headers = [];
  Object.keys(keyToColumnNumber).forEach((value, index) => {
    headers[index] = value;
  });

  // NOTE typically, we can't be sure of column headings until all logs are processed
  // so unfortunately this row of headings is printed at the bottom of the table

  if (!opts.j) {
    writeArrayToStdout(headers);
  }
};

// NOTE If the -j flag is set, we already know which headings we're filtering for,
// and we can print them first, before we receive any input
// added benefit: the order in which the args are passed will be the order of columns
if (opts.j) {
  const headers = [];
  opts.j.forEach((key) => {
    headers[getColumnNumber(key)] = key;
  });
  writeArrayToStdout(headers);
}

process.stdin.resume();
process.stdin.setEncoding('utf8');

// NOTE accumulating stdin in this way assumes that the input is not indeterminate
// this can be changed to look for newlines as we read chunks and write out
// transformed logs as we go
var accumulator = '';

process.stdin.on('data', (chunk) => {
  accumulator += chunk;
});

process.stdin.on('end', () => {
  parseLog(accumulator);
});

