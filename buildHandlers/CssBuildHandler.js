var path = require('path');

function stylesFilter(dep){
  return dep.type === 'external style' ||
         dep.type === 'inline style' ||
         (dep.type === 'basis.resource' && path.extname(dep.fileName) == '.css');
}

function fileNameGetter(dep){
  return dep.fileName;
}

function CssBuildHandler(){

  var handle = function(depGraph, config, options){
    var buildPath = config.buildPath;

    var styleFiles = [];
    for(var file in depGraph){
      styleFiles.push.apply(styleFiles, depGraph[file].filter(stylesFilter).map(fileNameGetter));
    }

    console.log(styleFiles);
      
  };

  return {
    handle: handle
  };
}

module.exports = CssBuildHandler;