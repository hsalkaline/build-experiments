var fs = require('fs');
var path = require('path');
var domWalker = require('../domWalker.js');
var util = require('util');

function TmplFileHandler(){

  function handle(file, config){
    if(!global.basis){
      global.basis = require(path.resolve(config.rootPath, config.basisPath) + '.js').basis;
      global.document = require('jsdom-nocontextifiy').jsdom();
      basis.require('basis.template');
    }

    var fullFileName = path.resolve(config.rootPath, file.fileName);
    var decl = basis.template.makeDeclaration(file.content, path.dirname(fullFileName) + '/');

    var fileList = decl.resources.map(function(resource){
      var resourceFileName = path.resolve(path.dirname(file.fileName), resource);
      return {
        fileName: resourceFileName,
        content: fs.readFileSync(path.resolve(config.rootPath, resourceFileName))
      };
    });
    var fileDeps = decl.resources.map(function(resource){
      return {
        type: 'external style',
        src: resource
      };
    });

    return {
      fileDeps: fileDeps,
      fileList: fileList
    };
  }

  return {
    handle: handle
  };
}

module.exports = TmplFileHandler;