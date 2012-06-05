var fs = require('fs');
var path = require('path');
var htmlparser = require("htmlparser");

var domWalker = function(){
  function pushInArray(object, array, value){
    if(!object[array]){
      object[array] = [];
    }
    if(object[array].indexOf(value) === -1)
      object[array].push(value);
  }

  var handlers = {};

  var hadlerArgs = {
    tag: ['name', 'attribs', 'children'],
    style: ['attribs', 'text'],
    script: ['attribs', 'text']
  };

  function callHandlers(obj){
    var handlersToCall = handlers[obj.type];
    if(handlersToCall)
    {
      handlersToCall.forEach(function(handler){
        var args = hadlerArgs[obj.type].map(function(arg){
          //pseudo arg to extract text
          if (arg == 'text')
          {
            return obj.children && obj.children[0].data;
          }
          return obj[arg];
        });
        //todo: deal with args in upper case
        handler.apply(obj, args);
      });
    }
  }

  function walk(dom){
    for(var i = 0, len = dom.length; i < len; i++){
      callHandlers(dom[i]);
      if (dom[i].children)
      {
        walk(dom[i].children);
      }
    }
  }

  return {
    on: function(type, callback){
      pushInArray(handlers, type, callback);
    },
    walk: walk
  };
};

function parseIndex(indexPath){
  var styles = [];
  var scripts = [];
  var basisPath;

  var rawHtml = fs.readFileSync(indexPath);
  var handler = new htmlparser.DefaultHandler();
  var parser = new htmlparser.Parser(handler);
  parser.parseComplete(rawHtml);

  var walker = domWalker();
  walker.on('tag', function(name, attrs, children){
    if(name == 'link' && attrs.rel == 'stylesheet'){
      styles.push({
        type: 'external',
        href: attrs.href
      });
    }
  });
  walker.on('style', function(attrs, text){
    styles.push({
      type: 'inline',
      content: text
    });
  });
  walker.on('script', function(attrs, text){
    if (attrs && attrs.src)
    {
      if(attrs['basis-config'])
      {
        basisPath = attrs.src.replace(/\.js$/, '');
      }
      scripts.push({
        type: 'external',
        src: attrs.src
      });
    }
    if (text)
    {
      scripts.push({
        type: 'inline',
        content: text
      });
    }
  });
  walker.walk(handler.dom);

  return {
    basisPath: basisPath,
    scripts: scripts,
    styles: styles
  };
}

module.exports = {
  parse: parseIndex
};