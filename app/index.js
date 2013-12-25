'use strict';

var fs = require('fs');
var path = require('path');
var util = require('util');
var yeoman = require('yeoman-generator');

var ReactQuickstartGenerator = module.exports = function ReactQuickstartGenerator(args, options, config) {
  yeoman.generators.Base.apply(this, arguments);

  this.on('end', function() {
    this.installDependencies({
      skipInstall: options['skip-install'],
      bower: false,
      callback: function() {
        console.log('\x1B[2J');
        if (this.libraryMode) {
          console.log(fs.readFileSync(require.resolve('react-boilerplate/USAGE.txt'), {encoding: 'utf8'}));
        } else {
          console.log(fs.readFileSync(require.resolve('react-browserify-template/USAGE.txt'), {encoding: 'utf8'}));
        }
      }.bind(this)
    });
  }.bind(this));

  this.libraryMode = options['library'];
  this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
};

util.inherits(ReactQuickstartGenerator, yeoman.generators.Base);

ReactQuickstartGenerator.prototype.askFor = function askFor() {
  console.log(this.yeoman);
};

function safeMerge(dst, src) {
  for (var k in src) {
    if (!src.hasOwnProperty(k) || dst.hasOwnProperty(k)) {
      continue;
    }
    dst[k] = src[k];
  }
}

function safeMergeArrays(dst, src) {
  var set = {};
  dst.forEach(function(k) {
    set[k] = true;
  });
  src.forEach(function(k) {
    set[k] = true;
  });
  return Object.keys(set);
}

function includeFileLines(path, lines) {
  var oldLines = [];
  try {
    oldLines = fs.readFileSync(path, {encoding: 'utf8'}).split('\n').filter(function(line) {
      return line.trim().length > 0;
    });
  } catch (e) {
    // no worries!
  }
  var newLines = safeMergeArrays(oldLines, lines);
  fs.writeFileSync(path, newLines.join('\n'), {encoding: 'utf8'});
}

ReactQuickstartGenerator.prototype.npmInit = function() {
  var done = this.async();

  try {
    var pkg = require(path.join(process.cwd(), 'package.json'));
  } catch (e) {}

  if (!pkg) {
    this.spawnCommand('npm', ['init'], done).on('exit', done)
  }
};

ReactQuickstartGenerator.prototype.browserify = function() {
  // TODO: support a --webpack mode
  if (this.libraryMode) {
    return;
  }
  var pkgPath = path.join(process.cwd(), 'package.json');
  var pkg = require(pkgPath);
  var templatePkg = require('react-browserify-template/package.json');

  ['dependencies', 'devDependencies', 'scripts'].forEach(function(k) {
    pkg[k] = pkg[k] || {};
    safeMerge(pkg[k], templatePkg[k]);
  });

  pkg.main = pkg.main || 'index.js';
  pkg.staticRoot = templatePkg.staticRoot;
  pkg.staticPlugin = templatePkg.staticPlugin;
  pkg.browserify = pkg.browserify || {};
  pkg.browserify.transform = pkg.browserify.transform || [];

  pkg.browserify.transform = safeMergeArrays(pkg.browserify.transform, templatePkg.browserify.transform);

  this.copy(require.resolve('react-browserify-template/index.js'), path.join(process.cwd(), pkg.main));
  this.copy(require.resolve('react-browserify-template/index.html'), 'index.html');
  includeFileLines(path.join(process.cwd(), '.gitignore'), ['node_modules', 'browser-bundle.js', 'browser-bundle.min.js']);

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), {encoding: 'utf8'});
};

ReactQuickstartGenerator.prototype.library = function() {
  if (!this.libraryMode) {
    return;
  }
  var pkgPath = path.join(process.cwd(), 'package.json');
  var pkg = require(pkgPath);
  var templatePkg = require('react-boilerplate/package.json');

  ['dependencies', 'devDependencies', 'scripts'].forEach(function(k) {
    pkg[k] = pkg[k] || {};
    safeMerge(pkg[k], templatePkg[k]);
  });

  pkg.main = templatePkg.main;

  this.mkdir('src');
  this.mkdir('lib');
  includeFileLines(path.join(process.cwd(), '.gitignore'), ['node_modules', 'npm-debug.log', 'lib/']);
  includeFileLines(path.join(process.cwd(), '.npmignore'), ['src/']);
  fs.writeFileSync(
    path.join(process.cwd(), 'src/index.js'),
    '/** @jsx React.DOM */\nvar React = require(\'react\');\n\n' +
      'var HelloWorld = React.createClass({\n  render: function() {\n'+
      '    return <h1>Hello, world!</h1>;  \n}\n});\n\n' +
      'module.exports = HelloWorld;\n',
    {encoding: 'utf8'}
  );

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), {encoding: 'utf8'});
};