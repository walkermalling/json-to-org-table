const fs = require('fs');
const args = process.argv.slice(2);

let defaultOptions = {
  delimiter: '|', // delimiter defaults to org table delimiter
  prepender: '|', // prepender defaults to org table delimiter
};

let presetOptions = {};
if (fs.existsSync(process.cwd() + '/options.json')) {
  let optionsFile = fs.readFileSync(process.cwd() + '/options.json', 'utf8');
  try {
    presetOptions = JSON.parse(optionsFile);
  } catch (e) {
    process.stderr.write(`unable to parse options file`);
    process.stderr.write(e);
    process.exit(1);
  }
}

const commandLineOptions = args.reduce((accumulator, val, index, arr) => {
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

module.exports = Object.assign({}, defaultOptions, presetOptions, commandLineOptions);

