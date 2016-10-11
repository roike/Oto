/*
 * template spa.data.js
 * Copyright 2016 ryuji.oike@gmail.com
 *-----------------------------------------------------------------
 * updated:2016-07-27
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
      return _.keys(params).map(key => {
          let val = params[key];
          if(_.isObject(val)) val = JSON.stringify(val);
          return [key ,encodeURIComponent(val)].join('=');
        }
      ).join('&');
    };
    
    const makeRequest = opts => {
      //console.info(opts.url);
      return new Promise( (resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(opts.method, opts.url, true);

        _.keys(opts.headers).forEach(key => {
          xhr.setRequestHeader(key, opts.headers[key]);
        });
        //console.info(opts.params);
        xhr.send(opts.params);
        xhr.onload = () => {
          //console.info(xhr.status);
          if(xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.response));
          } else if (xhr.status === 403) {
            const response = JSON.parse(xhr.response);
            reject(response.error);
          } else {
            //status==500はここでキャッチ
            console.info(xhr.response);
            reject(xhr.statusText);
          }
        };
        xhr.onerror = () => {
          console.info(xhr.statusText);
          reject(xhr.statusText);
        };
      });
    };

    const ajaxGet = (url, params) => {
      return makeRequest({
        method: 'GET',
        url: url,
        params: encodedString(params),
        headers: {}
      });
    };

    const ajaxDelete = (url, params) => {
      return makeRequest({
        method: 'DELETE',
        url: url,
        params: encodedString(params),
        headers: {}
      });
    };

    const ajaxPost = (url, params) => {
      return makeRequest({
        method: 'POST',
        url: url,
        params: encodedString(params),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
      });
    };

    const ajaxPatch = (url, params) => {
      return makeRequest({
        method: 'PATCH',
        url: url,
        params: JSON.stringify(params),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8'
        }
      });
    };

    const ajaxPostByJson = (url, params) => {
      return makeRequest({
        method: 'POST',
        url: url,
        params: JSON.stringify(params),
        headers: {
          'Content-Type': 'application/json; charset=UTF-8'
        }
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
      delete: ajaxDelete,
      patch: ajaxPatch,
      post: ajaxPost,
      json: ajaxPostByJson,
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

