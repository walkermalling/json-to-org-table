const EXPAND_OBJECTS = true;
const keyToColumnNumber = {};

const getColumnNumber = (key) => {
  if (!keyToColumnNumber[key]) {
    keyToColumnNumber[key] = Object.keys(keyToColumnNumber).length;
  }
  return keyToColumnNumber[key];
}

const writeToRow = (line) => {
  var row = [];
  Object.keys(line).forEach(function (key) {
    if (typeof line[key] === 'object') {
      if (EXPAND_OBJECTS) {
        Object.keys(line[key]).forEach(function (subKey){
          row[getColumnNumber(`${key}:${subKey}`)] = line[key][subKey];
        });
      } else {
        // TODO writing newlines confuses org-mode
        const pairs = Object.keys(line[key]).map(function (subKey){
          return `${subKey}: ${line[key][subKey]}`;
        });
        row[getColumnNumber(key)] = pairs.join('\n');
      }
    } else {
      row[getColumnNumber(key)] = line[key];
    }
  });
  process.stdout.write(`|${row.join('|')}\n`);
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
    .forEach(writeToRow);
  
  const headings = [];
  Object.keys(keyToColumnNumber).forEach(function (value, index) {
    headings[index] = value;
  });

  process.stdout.write(`|${headings.join('|')}\n`);
};

process.stdin.resume();
process.stdin.setEncoding('utf8');

var accumulator = '';

process.stdin.on('data', (chunk) => {
  accumulator += chunk;
});

process.stdin.on('end', () => {
  parseLog(accumulator);
});
