'use strict';

var fs = require('fs');
var path = require('path');
var util = require('util');
var yeoman = require('yeoman-generator');

var ReactQuickstartGenerator = module.exports = function ReactQuickstartGenerator(args, options, config) {
  yeoman.generators.Base.apply(this, arguments);

  this.on('end', function () {
    //this.installDependencies({ skipInstall: options['skip-install'] });
  });

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

ReactQuickstartGenerator.prototype.npmInit = function() {
  var done = this.async();

  try {
    var pkg = require(path.join(process.cwd(), 'package.json'));
  } catch (e) {}

  if (!pkg) {
    this.spawnCommand('npm', ['init'], done).on('exit', done)
  }
};

ReactQuickstartGenerator.prototype.updatePackageJson = function() {
  var pkgPath = path.join(process.cwd(), 'package.json');
  var pkg = require(pkgPath);
  var templatePkg = require('react-browserify-template/package.json');

  ['dependencies', 'devDependencies', 'scripts'].forEach(function(k) {
    pkg[k] = pkg[k] || {};
    safeMerge(pkg[k], templatePkg[k]);
  });

  pkg.main = pkg.main || 'index.js';
  pkg.browserify = pkg.browserify || {};
  pkg.browserify.transform = pkg.browserify.transform || [];

  pkg.browserify.transform = safeMergeArrays(pkg.browserify.transform, templatePkg.browserify.transform);

  this.copy(require.resolve('react-browserify-template/index.js'), path.join(process.cwd(), pkg.main));
  this.copy(require.resolve('react-browserify-template/index.html'), 'index.html');

  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), {encoding: 'utf8'});
};
