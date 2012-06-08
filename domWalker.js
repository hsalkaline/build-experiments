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

module.exports = domWalker;