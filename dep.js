var path = require('path');
var util = require('util');

function getDependencyGraph(config){
  var rootPath = config.rootPath;
  var initialFile = config.initialFile;
  var fileHandlers = config.fileHandlers;

  var fileQueue = [initialFile];
  var processedFiles = {};
  var deps = {};
  var sharedConfig = {
    rootPath: rootPath,
    basisPath: 'lib/basis/src/basis'
  };

  function addInFileQueue(file){
    if (!processedFiles[file.fileName]){
      processedFiles[file.fileName] = true;
      fileQueue.push(file);
    }
  }

  function getFileType(file){
    return file.match(/\.(\w+)/)[1];
  }

  do {
    var file = fileQueue.shift();
    var fileType = getFileType(file.fileName);
    if (fileHandlers[fileType])
    {
      var handleInfo = fileHandlers[fileType].handle(file, sharedConfig);
      deps[file.fileName] = handleInfo.fileDeps;
      handleInfo.fileList.forEach(addInFileQueue);
    }
    else
    {
      //console.log('unsupported file type: ' + file.fileName);
    }
  } while(fileQueue.length);

  return deps;
}

module.exports = {
  getDependencyGraph: getDependencyGraph
};