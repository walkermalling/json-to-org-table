const args = process.argv.slice(2);

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

console.log(opts);

const keyToColumnNumber = {};

const getColumnNumber = (key) => {
  if (!keyToColumnNumber[key]) {
    keyToColumnNumber[key] = Object.keys(keyToColumnNumber).length;
  }
  return keyToColumnNumber[key];
};

const writeToRow = (line) => {
  var row = [];
  Object.keys(line).forEach(function (key) {
    if (typeof line[key] === 'object') {
      Object.keys(line[key]).forEach(function (subKey){
        const combinedKey = `${key}:${subKey}`;
        if (opts.i.indexOf(combinedKey) > -1) {
          return;
        }
        row[getColumnNumber(`${key}:${subKey}`)] = line[key][subKey];
      });
    } else {
      if (opts.i.indexOf(key) > -1) {
        return;
      }
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

