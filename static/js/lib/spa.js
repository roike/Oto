/*
 * thirdpen spa.js
 * Root namespace module
 * See License
 * ---------------------------------------------------------
 * Update 2016-10-14 
*/

/*jslint           browser : true,   continue : true,
  devel  : true,    indent : 2,       maxerr  : 50,
  newcap : true,     nomen : true,   plusplus : true,
  regexp : true,    sloppy : true,       vars : false,
  white  : true
*/
/*global spa */

const spa = (() => {
  'use strict';
  const initModule = () => {
    spa.model.initModule();
    spa.shell.initModule();
    window.dispatchEvent(new Event('popstate'));
  };

  const gevent = (() => {
    //---------------- BEGIN MODULE SCOPE VARIABLES --------------
    const customEventDict = {};
    const eventTarget = {};

    //----------------- END MODULE SCOPE VARIABLES ---------------

    //------------------- BEGIN PUBLIC METHODS -------------------
    const publishEvent = (event_name, data) => {

      const event_obj  = eventTarget[customEventDict[ event_name ]];

      if ( ! event_obj ) { return false; }

      event = new CustomEvent(event_name, {detail: data});
      event_obj.dispatchEvent(event);

    };

    //event_nameは競合不可
    const subscribeEvent = ( id, event_name, fn ) => {
      //console.info('bind collection %s', collection);
      if ( _.has(customEventDict, event_name) ){
        delete customEventDict[ event_name ];
      }

      eventTarget[id].addEventListener( event_name, fn );

      customEventDict[ event_name ] = id;
      //console.info(customEventDict);
    };

    const unsubscribeEvent = ( id, event_name ) => {
      if ( _.has(customEventDict, event_name) ){
        delete customEventDict[ event_name ];
      }

    };

    const initModule = (id, dom) => {
      //Set eventTarget for CustomEvent
      eventTarget[id] = dom;
    };
    //------------------- END PUBLIC METHODS ---------------------

    // return public methods
    return {
      initModule: initModule,
      publish     : publishEvent,
      subscribe   : subscribeEvent,
      unsubscribe : unsubscribeEvent
    };
  })();

  const uriAnchor = (() => {

    let schemaList = null;
      
    //schemaにないページはdefault_pageに誘導
    const setConfig = schema => { schemaList = schema; };

    //想定のケースは以下
    // domain/ --> anchor=''
    // domain/<anchor> --> anchor in schemaList
    // domain/blog/<abcd>/<slug> --> anchor=blog
    const getCleanAnchorString = () => {

      const
        urlList = document.location.href.split('/'),
        state = history.state,
        schema = _.intersection(urlList, schemaList);
     
      //console.info(urlList);
      let cache = false;
      if(state) {
        cache = state.cache || false
      }
      //console.info(schema);
      let anchor = null
      if (schema.length > 0) {
        anchor = _.rest(urlList, _.indexOf(urlList, schema[0]));
      }

      return {page: anchor, cache: cache};
    };

    const setAnchor = (anchorMap, replace_state) => {
      const 
        anchor = anchorMap.page,
        uri_string = _.isArray(anchor) ? '/' + anchor.join('/') : anchor,
        state = {
          cache: anchorMap.cache || false
        };
      
      if ( replace_state ) {
        //ページは書き換えるがキャッシュしない
        history.replaceState(null, null, uri_string);
      } else {
        //２番目の引数は無視される--mdn pushState()
        history.pushState(state, null, uri_string);
      }

      window.dispatchEvent(new Event('popstate'));

    };

    // 引数はdefault_anchor
    const makeAnchorMap = anchor =>{
      let anchorMap = getCleanAnchorString();
      if (anchorMap.page === null) {
        anchorMap.page = _.isArray(anchor) ? anchor : [anchor];
      }
      return anchorMap;
    };

    return {
      setConfig: setConfig,
      setAnchor: setAnchor,
      makeAnchorMap: makeAnchorMap
    };
  })();

  const data = (() => {

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

    const makeChannel = (() => {
      //オープンする通信チャネルはChannel Api
      //messageでcallするカスタムイベントは呼び出し元で設定する
      const openChannel = (token, customevent) => {
        const channel = new goog.appengine.Channel(token);
        const socket = channel.open();
        socket.onopen = () => {
          gevent.publish(customevent, {onopen: '通信チャネルが開通しました。'});
        };
        socket.onerror = () => {
          gevent.publish(customevent, {onerror: '通信チャネルがタイムアウトしました。'});
        };
        socket.onclose = () => {
          console.info('Close Channel');
        };
        socket.onmessage = m => {
          //console.info(m);
          const data = JSON.parse(m.data);
          gevent.publish(data.customeve, data);
        };
        stateMap.socket = socket;
      };

      const closeSocket = () => {
        stateMap.socket.close();
      };

      return {
        open: openChannel,
        close: closeSocket
      };

    })();

    //公開するモジュールを定義
    return {
      getAjax: makeAjax,
      getChannel: makeChannel
    };
  })();

  const util = (() => {
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

  //errorのタイプは-=->error.name===[login, schema, server]
  const error = (() => {
    let configMap = {
      //汎用オブジェクトを参照する場合はここで宣言
      error_model: null,
    };
    const onHandleClick = event => {
      //error画面の全クリックイベントをspa.shellで捕捉しないでスルー
      event.stopPropagation();
    };
    //------------------- BEGIN PUBLIC METHODS -------------------
    const configModule = input_map => {
      util.setConfigMap({
        input_map: input_map,
        config_map: configMap
      });
    };

    const initModule = container => {
      const error = configMap.error_model;
      console.info(error);
      container.innerHTML = spa.error[error.name](error);

      //ローカルイベントのバインド
      //イベントのバブリングを止める場合はコメントを外す
      //document.getElementById('error-container').addEventListener('click', onHandleClick, false);

    };

    // return public methods
    return {
      configModule : configModule,
      initModule   : initModule
    };
    //------------------- END PUBLIC METHODS ---------------------
  })();


  return {
    initModule: initModule,
    gevent: gevent,
    uriAnchor: uriAnchor,
    data: data,
    util: util,
    error: error
  };
})();

//error template------------------------------------------------------
spa.error.login = error => {
  return `
    <article id="error-container">
      <div class="error-content mdl-grid">
        <div class="mdl-card mdl-cell--12-col mdl-shadow--2dp">
          <div class="mdl-card__title">
            <h2>Thirdpen</h2>
          </div>
          <div class="mdl-card__supporting-text">
            <h3>認証エラー？</h3>
            <p>${error.message}</p>
            <div><a href="${error.data}">Googleアカウントにログインする</a></div>
          </div>
        </div>
      </div>
    </article>`;
};

spa.error.schema = error => {
  return `
    <article id="error-container">
      <div class="error-content mdl-grid">
        <div class="mdl-card mdl-cell--12-col mdl-shadow--2dp">
          <div class="mdl-card__title">
            <h2>Thirdpen</h2>
          </div>
          <div class="mdl-card__supporting-text">
            <h3>ページ違反？</h3>
            <p>${error.message}</p>
          </div>
        </div>
      </div>
    </article>`;
};

spa.error.server = error => {
  return `
    <article id="error-container">
      <div class="error-content mdl-grid">
        <div class="mdl-card mdl-cell--12-col mdl-shadow--2dp">
          <div class="mdl-card__title">
            <h2>Thirdpen</h2>
          </div>
          <div class="mdl-card__supporting-text">
            <h3>serverで例外発生？</h3>
            <p>${error.message}</p>
          </div>
        </div>
      </div>
    </article>`;
};
