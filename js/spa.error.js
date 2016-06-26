/*
 * project: elabo-one
 * spa.error.js
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
//errorのタイプは-=->error.name===[login, schema, server]
spa.error = (() => {
  'use strict';
  //---------------- BEGIN MODULE SCOPE VARIABLES --------------
  let
    configMap = {
      //汎用オブジェクトを参照する場合はここで宣言
      error_model: null,
    },
    stateMap  = {},
    domMap = {};
  //公開モジュールを参照する場合はここで宣言

  //----------------- END MODULE SCOPE VARIABLES ---------------

  //------------------- BEGIN UTILITY METHODS ------------------

  //-------------------- END UTILITY METHODS -------------------

  //--------------------- BEGIN DOM METHODS --------------------
  const setDomMap = function () {
    domMap = {
    };
  };
  //---------------------- END DOM METHODS ---------------------

  //------------------- BEGIN EVENT HANDLERS -------------------
  const onHandleClick = event => {
    //Googleアカウントにログイン等外部にスルーするイベントはここで処理を追加
    //現在の設定は全イベントをspa.shellで捕捉しないでスルーさせている
    event.stopPropagation();
  };

  //-------------------- END EVENT HANDLERS --------------------

  //------------------- BEGIN PUBLIC METHODS -------------------
  //
  const configModule = input_map => {
    spa.util.setConfigMap({
      input_map: input_map,
      config_map   : configMap
    });
  };

  const initModule = container => {
    // load uriba.html and jquery cache
    const error = configMap.error_model;
    console.info(error);
    if ( error.name === 'login' ) {
      container.innerHTML = `
          <article id="error-container">
            <div class="mdl-card__title">
              <h2>Spa Template</h2>
            </div>
            <div class="mdl-card__supporting-text">
              <h3>認証エラー？</h3>
              <p>${error.message}</p>
              <div><a href="${error.data}">Googleアカウントにログインする</a></div>
            </div>
          </article>`;
      
    } else if (error.name === 'schema') {
      container.innerHTML = `
          <article id="error-container">
            <div class="mdl-card__title">
              <h2>Spa Template</h2>
            </div>
            <div class="mdl-card__supporting-text">
              <h3>ページ違反？</h3>
              <p>${error.message}</p>
            </div>
          </article>`;
    } else if (error.name === 'server') {
      container.innerHTML = `
          <article id="error-container">
            <div class="mdl-card__title">
              <h2>Spa Template</h2>
            </div>
            <div class="mdl-card__supporting-text">
              <h3>serverで例外発生？</h3>
              <p>${error.message}</p>
            </div>
          </article>`;
    }

    //ローカルイベントのバインド
    document.getElementById('error-container').addEventListener('click', onHandleClick, false);

  };

  // return public methods
  return {
    configModule : configModule,
    initModule   : initModule
  };
  //------------------- END PUBLIC METHODS ---------------------
})();
