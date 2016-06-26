/*
 * template spa.data.js
 * Copyright 2016 ryuji.oike@gmail.com
 *-----------------------------------------------------------------
 * version:1.04
*/

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global spa */

spa.data = (() => {
  'use strict';

  const stateMap = {socket: null};

  const makeAjax = (() => {
      
    //paramsがない場合はnull
    const encodedString = params => {
      return _.keys(params).map(key => 
          [key ,encodeURIComponent(params[key])].join('=')
      ).join('&');
    };

    const ajaxGet = (url, params) => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        if (params) {
          url += '?' + encodedString(params);
        }
        //console.info(url);
        xhr.open('GET', url, true);
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.response));
          } else if (xhr.status === 403) {
            const response = JSON.parse(xhr.response);
            reject(response.error);
          } else {
            //status==500はここでキャッチ
            reject(xhr.statusText);
          }
        };
        xhr.onerror = () => {
          reject(xhr.statusText);
        };
        xhr.send();
      });
    };

    const ajaxPost = (url, params) => {
      //console.info(url);
      return new Promise( (resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
        xhr.send(encodedString(params));
        xhr.onload = () => {
          //console.info(xhr.status);
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.response));
          } else if (xhr.status === 403) {
            const response = JSON.parse(xhr.response);
            reject(response.error);
          } else {
            //status==500はここでキャッチ
            reject(xhr.statusText);
          }
        };
        xhr.onerror = () => {
          console.info(xhr.statusText);
          reject(xhr.statusText);
        };
      });
    };

    const imgLoad = (url, file) => {
      //console.info(url);
      return new Promise((resolve, reject) => {
        const 
          xhr = new XMLHttpRequest(),
          formData = new FormData();

        formData.append('file', file);
        xhr.open('POST', url);
        xhr.send(formData);
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.response));
          } else {
            reject(Error('Image didn\'t load successfully; error code:' + xhr.statusText));
          }
        };
        xhr.onerror = () => {
          reject(Error('There was a network error.'));
        };
      });
    };

    return {
      get: ajaxGet,
      post: ajaxPost,
      up: imgLoad
    };

  })();

  const makeSio = (() => {
    //オープンする通信チャネルはChannel Api

    const openChannel = token => {
      const channel = new goog.appengine.Channel(token);
      const socket = channel.open();
      socket.onopen = () => {console.info('通信チャネルが開通しました。');};
      socket.onerror = () => {console.info('通信チャネルがタイムアウトしました。');};
      socket.onclose = () => {console.info('通信チャネルが終了しました。');};
      socket.onmessage = m => {
        const data = JSON.parse(m.data);
        spa.gevent.publish(data.callback, data.publish);
      };
      stateMap.socket = socket;
    };

    const sendMessage = (url, params) => {

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
      xhr.send(encodedString(params));

    };

    const closeSocket = () => {
      stateMap.socket.close();
    };

    return {
      open: openChannel,
      emit: sendMessage,
      close: closeSocket
    };

  })();

  //公開するモジュールを定義
  return {
    getAjax: makeAjax,
    getSio: makeSio
  };
})();

