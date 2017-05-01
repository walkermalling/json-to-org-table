const url = require('url');
const opts = require('./lib/parse-options');

const approved = (key) => {
  if (opts.fields) {
    return opts.fields.indexOf(key) > -1;
  }
  if (opts.ignore) {
    return opts.ignore.indexOf(key) === -1;
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
  process.stdout.write(`${opts.prepender}${arr.join(opts.delimiter)}\n`);
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
  if (!opts.fields) {
    writeArrayToStdout(headers);
  }
};

// NOTE If the -fields flag is set, we already know which headings we're filtering for,
// and we can print them first, before we receive any input
// added benefit: control order of columns by order of args
if (opts.fields) {
  const headers = [];
  opts.fields.forEach((key) => {
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

