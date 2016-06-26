/*
 * project: elabo-one
 * spa.blog.js
 *-----------------------------------------------------------------
*/

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global spa */
spa.blog = (() => {
  'use strict';
  //-------BEGIN SCOPE VARIABLES----------------------------
  let
    configMap = {
      anchor: null,
      previous: null,
      user: null
    },
    stateMap  = {
      //ローカルキャッシュはここで宣言
      container: null,
    },
    domMap = {};
  //定数はここで宣言
  
  //公開モジュールを参照する場合はここで宣言
  const blog_model = spa.model.blog;
  //----END SCOPE VARIABLES------------------------------------- 

  //------------------- BEGIN UTILITY METHODS ------------------
  //-------------------- END UTILITY METHODS -------------------

  //--------------------- BEGIN DOM METHODS --------------------
  //DOMメソッドにはページ要素の作成と操作を行う関数を配置
  const setDomMap = () => {
    domMap = {};
  };

  //---------------------- END DOM METHODS ---------------------

  //------------------- BEGIN EVENT HANDLERS -------------------
  
  const onLoad = event => {
    const embed = event.detail;
    const previous = configMap.previous;
    embed['before'] = previous ? '/' + previous.join('/') : '';
    stateMap.container.innerHTML = spa.blog.template(embed);
    if (!previous){
      stateMap.container.getElementsByClassName('blog-nav')[0].style.display = 'none';
    }
    //setDomMap()
    
    //mdlイベントの登録
    componentHandler.upgradeDom();

  };

  //-------------------- END EVENT HANDLERS --------------------

  //------------------- BEGIN PUBLIC METHODS -------------------
  const configModule = input_map => {
    spa.util.setConfigMap({
      input_map: input_map,
      config_map: configMap
    });

  };

  // Begin public method /initModule/
  const initModule = container => {
    stateMap.container = container;

    //グローバルカスタムイベントのバインド
    spa.gevent.subscribe( stateMap.container, 'load-blog',  onLoad  );

    blog_model.load('/' + configMap.anchor.page.join('/'));

  };

  // return public methods
  return {
    configModule: configModule,
    initModule: initModule
  };
  //------------------- END PUBLIC METHODS ---------------------
})();

spa.blog.template = ({key, tags, date, title, content, before}) => {
  const [prev, slug] = key.split('_');
  return `
  <article id="blog-container">
    <div class="blog-content mdl-grid">
      <div class="mdl-card mdl-cell--12-col mdl-shadow--2dp">
        <header class="blog-header">
          <span>${tags}&nbsp;|&nbsp;${date}</span>
          <div class="mdl-layout-spacer"></div>
          <a href="/marked/${prev}/${slug}">
            <button id="blog-edit" class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored">
              <i class="material-icons" >mode_edit</i>
            </button>
            <span for="blog-edit" class="mdl-tooltip">記事の編集</span>
          </a>
          <a href="/marked/excerpt/${prev}/${slug}">
            <button id="blog-excerpt" class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored">
              <i class="material-icons">view_headline</i>
            </button>
            <span for="blog-excerpt" class="mdl-tooltip">記事概要の挿入</span>
          </a>
          <div>&nbsp;&nbsp;</div>
        </header>
        <div class="mdl-card__title">
          <h2>${title}</h2>
        </div>
        <div class="blog-section mdl-card__supporting-text">
          ${content}
        </div>
      </div>
      <nav class="blog-nav mdl-cell mdl-cell--12-col">
        <a href="${before}" title="前の画面">
          <button class="mdl-button mdl-js-button mdl-js-ripple-effect mdl-button--icon" >
            <i class="material-icons" role="presentation">arrow_back</i>
          </button>
        </a>
      </nav>
    </div>
  </article>`;
};
