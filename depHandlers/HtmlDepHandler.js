var fs = require('fs');
var path = require('path');
var htmlparser = require("htmlparser");
var domWalker = require('../domWalker.js');

function HtmlFileHandler(){
  var inlineScriptId = 0;
  var inlineStyleId = 0;
  
  function handle(file, config){
    var fileList = [];
    var fileDeps = [];

    function pushInFileList(fileName){
      fileList.push({
        fileName: fileName,
        content: fs.readFileSync(path.resolve(config.rootPath, fileName), 'UTF-8')
      });
    }

    var rawHtml = file.content;
    var handler = new htmlparser.DefaultHandler();
    var parser = new htmlparser.Parser(handler);
    parser.parseComplete(rawHtml);

    var walker = domWalker();
    walker.on('tag', function(name, attrs, children){
      if(name == 'link' && attrs.rel == 'stylesheet'){
        pushInFileList(attrs.href);
        fileDeps.push({
          type: 'external style',
          href: attrs.href
        });
      }
    });
    walker.on('style', function(attrs, text){
      fileList.push({
        fileName: 'inline' + inlineStyleId++ + '.css',
        content: text
      });
      fileDeps.push({
        type: 'inline style',
        content: text
      });
    });
    walker.on('script', function(attrs, text){
      if (attrs && attrs.src)
      {
        if(attrs['basis-config'])
        {
          config.basisPath = attrs.src.replace(/\.js$/, '');
        }
        pushInFileList(attrs.src);
        fileDeps.push({
          type: 'external script',
          src: attrs.src
        });
      }
      if (text)
      {
        fileList.push({
          fileName: 'inline' + inlineScriptId++ + '.js',
          content: text
        });
        fileDeps.push({
          type: 'inline script',
          content: text
        });
      }
    });
    walker.walk(handler.dom);

    return {
      fileDeps: fileDeps,
      fileList: fileList,
      config: config
    };
  }

  return {
    handle: handle
  };
}
module.exports = HtmlFileHandler;