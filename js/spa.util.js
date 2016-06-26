/*
 * spa.util.js
 * Copyright 2016 ryuji.oike@gmail.com
 *-----------------------------------------------------------------
*/

/*jslint          browser : true,  continue : true,
  devel  : true,  indent  : 2,     maxerr   : 50,
  newcap : true,  nomen   : true,  plusplus : true,
  regexp : true,  sloppy  : true,  vars     : false,
  white  : true
*/
/*global spa */

spa.util = (() => {
  'use strict'
  const makeError = ( name_text, msg_text, data ) => {
    const error = new Error();
    error.name = name_text;
    error.message = msg_text;

    if ( data ){ error.data = data; }

    return error;
  };

  //汎用共通オブジェクトを各モジュールに設定する
  const setConfigMap = arg_map => {
    const
      input_map = arg_map.input_map,
      config_map = arg_map.config_map;

    _.each(Object.keys(input_map), key_name => {
      if ( config_map.hasOwnProperty(key_name) ) {
        config_map[key_name] = input_map[key_name];
      }
    });
  };
  // End Public method /setConfigMap/
  //文字列の文字の置き換え-連続['a','b','c']等、置き換える文字が異なる場合
  //%sの数と置き換え文字の数は一致するはずだが後者が少ない場合は%sは空文字変換
  const okikae = function() {
    const
      args = Array.prototype.slice.call(arguments),
      rest = args.slice(1);

    const henkan = (str, moji) => {
      if ( str.indexOf('%s') === -1 ) return str; 
      return henkan(str.replace('%s', moji||''), rest.shift());
    };
    return henkan(args[0], rest.shift());
  };

  //Deep Copy 
  const deepCopy = origin => JSON.parse(JSON.stringify(origin));

  //全角スペースの削除
  const ltrim = line => {
    return line.replace(/[\s　]+/g, '');

  };

  //カラーコード自動生成--rgb
  const autoColor = () => {

    const getHex = dec => {
      //convert Decimal to Hexadimal
      const hexArray = [ 
        "0", "1", "2", "3","4", "5", "6", "7","8", "9", "A", "B","C", "D", "E", "F"
      ];

      let code = dec - (Math.floor(dec / 16)) * 16;
       
      return (hexArray[code]);
    };

    return (() => {
      let
        x = Math.round(255*Math.random()),
        y = Math.round(255*Math.random()),
        z = Math.round(255*Math.random());
      
      return '#' + getHex(x) + getHex(y) + getHex(z);
    })();
  };

  //--browser utilities-------------------------------
  const encodeHTML = val => {
    const dom = document.createElement('div');
    dom.appendChild(document.createTextNode(val));
    //console.info(dom.innerHTML);
    return dom.innerHTML;
  }

  return {
    makeError: makeError,
    okikae: okikae,
    deepCopy: deepCopy,
    setConfigMap: setConfigMap,
    ltrim: ltrim,
    autoColor: autoColor,
    encodeHTML: encodeHTML
  };


})();
