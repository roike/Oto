/*
 * project: elabo-one
 * spa.shell.js
 * Copyright 2016 ryuji.oike@gmail.com
 * -----------------------------------------------------------------
*/

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global spa */

/*新規モジュールを追加する場合のtodo-------------------------
 * anchor_schemaに追加
 * moduleMapに追加
 * ***********************************/
spa.shell = (() => {
  'use strict';
  //---------------- BEGIN MODULE SCOPE VARIABLES --------------
  let
    //congigMapに静的な構成値を配置
    configMap = {},
    //stateMapにshellで共有する動的情報を配置
    //anchor_map=履歴の格納
    //container=コンテンツを動的に切り替えるセクションを宣言
    stateMap  = {
      //ローカルキャッシュはここで宣言する
      container: undefined,
      anchor_map: [],
    },
    //動的に呼び出す他モジュールを格納
    moduleMap = {},
    //Domコレクションをキャッシュ
    domMap = {};

  //定数はここで宣言
  const
    //許可するanchorはここで宣言--モジュール名に一致
    anchor_schema = [
      'newist', 'home', 'blog', 'channel', 'marked',
      'photo'
    ];

  //----------------- END MODULE SCOPE VARIABLES ---------------

  //-------------------- BEGIN UTILITY METHODS -----------------
  const makeError = spa.util.makeError;
  const testHistory = page => {
    //page=[schema,,,]
    //戻るリンクの不要な循環を防止する
    const pageHistory = page.join('_');
    let idx = stateMap.anchor_map.indexOf(pageHistory);
    if (page.length == 1) {
      stateMap.anchor_map = [pageHistory];
      idx = 0;
    }
    else if (idx == -1) {
      stateMap.anchor_map.push(pageHistory);
      idx = stateMap.anchor_map.length - 1;
    }
    else if (stateMap.anchor_map.length - idx > 1) {
      stateMap.anchor_map = stateMap.anchor_map.slice(0, idx + 1);
    } else {
      //想定外ケースの発生
      console.info(page.toString());
    }
    return idx == 0 ? null : stateMap.anchor_map[idx-1].split('_');
  };

  //--------------------- END UTILITY METHODS ------------------

  //--------------------- BEGIN DOM METHODS --------------------
  //DOMメソッドにはページ要素の作成と操作を行う関数を配置
  //domコレクションをキャッシュするとドキュメントトラバーサル数を減らせる
  const setDomMap = () => {
    domMap = {
      acct: document.getElementById('shell-head-acct')
    };
  };
  
  //--------------------- END DOM METHODS ----------------------

  //------------------- BEGIN EVENT HANDLERS -------------------
  //イベントハンドラはバブリング不要なので原則 stop

  //グローバルカスタムイベントのコールバック
  const onLogin = event => {
    const user_map = event.detail;
    spa.uriAnchor.setAnchor( { 'page': user_map.anchor }, false );
  };

  const onLogout = event => {
    spa.uriAnchor.setAnchor( { 'page': 'home' }, false );
    
  };

  const onError = event => {
    console.info('customEventError called by errorcode:500');
    const error = {
      name: 'server',
      message: 'request failed for server exception.',
      data: null
    };
    moduleMap.error.configModule({
      error_model: error
    });
    moduleMap.error.initModule( stateMap.container );

  };

  const onMessage = event => {
    const mesData = event.detail;
    stateMap.container.insertAdjacentHTML('afterbegin', spa.shell.message(mesData.message));
    const message = document.getElementById('spa-message');
    message.style.top = mesData.top;
    message.style.left = mesData.left;
    if (message.classList.contains('is-paused')) {
      message.classList.remove("is-paused");
    }
    const closeMessage = () => {
      stateMap.container.removeChild(message);
    };

    message.addEventListener("animationend", closeMessage, false);
    //_.delay(closeMessage, 7000, message);
  };

  //routing for local event
  //ここで捕捉する場合はschemaのどれかが最初に必要
  //例:href='/blog/<pre>/<slug>'
  //Google loginなどschemaがあっても外部にスルーさせたい
  //イベントはバブリングをサブモジュールで止めるか、例えばerror.js
  //あるいはここでスルー処理を追加する
  const handleAnchorClick = event => {
    const element = _.find(event.path, element => {
      //constはundefinedを宣言できないのでvarで宣言
      if (element.tagName === 'A') {
        return element;
      }
    });
    //console.info(element);
    //element.classList.contains("someTag")
    if(element) {
      const hrefList = element.href.split('/'),
        schema = _.intersection(hrefList, anchor_schema);

      if(schema.length > 0) {
        event.preventDefault();
        const anchor = _.rest(hrefList, _.indexOf(hrefList, schema[0]));
        spa.uriAnchor.setAnchor({page: anchor}, false);
          
      }
    }
  };

  // 認証の監視--loginチェック
  // urlの監視--schema以外のページ要求はエラーに誘導
  // url履歴の管理
  // 親履歴(anchor only)でリセット
  // 新規の子履歴は追加
  // 現在の履歴の後の履歴は削除
  const onPopstate = event => {
    try {
      //アドレスバーのanchorを適正テスト後に取り出す
      //引数はdefault_anchor,anchorがあればそれを優先
      const anchor_map_proposed = spa.uriAnchor.makeAnchorMap('home');
      //console.info(anchor_map_proposed);
      //makeError(name_text, msg_text, data)
      const auth = spa.model.user.get().name;
      if (auth === '00') {
        //loginチェックを行う
        domMap.acct.innerText = '... processing ...';
        spa.model.user.login(anchor_map_proposed.page);
        return false;
      } 
      if (auth === 'a0') {
        //未ログイン--Googleアカウント取得誘導
        throw makeError(
          'login',
          'not authorized by the proposed account',
          spa.model.user.get().login_url
        );
        return false;
      }

      //認証済みを確認
      const anchor = anchor_map_proposed.page[0];
      const previous = testHistory(anchor_map_proposed.page);
      domMap.acct.innerText = auth;
      moduleMap[anchor].configModule({
        //各anchorで参照する汎用objectを先頭のconfigMapで宣言する
        anchor: anchor_map_proposed,
        previous: previous,
        user: spa.model.user.get()
      });

      moduleMap[anchor].initModule( stateMap.container );

      return true;
    }
    catch (error) {
      domMap.acct.innerText = 'Please sign-in';
      //不適正なアドレス or 未認証はエラー発生
      console.info('annchor_map_error called');
      moduleMap.error.configModule({
        error_model: error
      });
      moduleMap.error.initModule( stateMap.container );
      return false;
    }
  };

  //-------------------- END EVENT HANDLERS --------------------

  //---------------------- BEGIN CALLBACKS ---------------------
  //----------------------- END CALLBACKS ----------------------

  //------------------- BEGIN PUBLIC METHODS -------------------
  //外部に公開するものを明示する
  
  const initModule = () => {
    //ルーティング対象はすべてmoduleMapに組み込む
    moduleMap.error = spa.error;
    moduleMap.home = spa.home;
    moduleMap.marked = spa.marked;
    moduleMap.channel = spa.channel;
    moduleMap.newist = spa.newist;
    moduleMap.blog = spa.blog;


    stateMap.container = document.getElementById('spa');
    setDomMap();

    //グローバルカスタムイベントのバインド
    spa.gevent.subscribe( stateMap.container, 'spa-login',  onLogin  );
    spa.gevent.subscribe( stateMap.container, 'spa-logout', onLogout );
    spa.gevent.subscribe( stateMap.container, 'spa-error', onError );
    spa.gevent.subscribe( stateMap.container, 'spa-message', onMessage);

    // ローカルイベントのバインド
    document.addEventListener('click', handleAnchorClick, false);

    //callできるanchorを設定
    spa.uriAnchor.setConfig(anchor_schema);

    // Handle URI anchor change events.
    //window.addEventListener('resize', onResize);
    window.addEventListener('popstate', onPopstate);

    window.dispatchEvent(new Event('popstate'));

  };

  
  // End PUBLIC method /initModule/
  //shellが公開するメソッド
  return {
    initModule: initModule,
  };
  //------------------- END PUBLIC METHODS ---------------------
})();

spa.shell.message = message => {
  return `
    <div id="spa-message" class="fadeInAndOut is-paused">
      <i class="material-icons">error_outline</i>
      ${message}
    </div>`;
};
