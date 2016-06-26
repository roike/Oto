/*
 * project: elabo-one
 * spa.channel.js
 * Copyright 2016 ryuji.oike@gmail.com
 *-----------------------------------------------------------------
*/

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global spa */
spa.channel = (() => {
  'use strict';
  //-------BEGIN SCOPE VARIABLES----------------------------
  let
    configMap = {},
    stateMap  = {
      //ローカルキャッシュはここで宣言
      container: null,
    },
    domMap = {};
  //定数はここで宣言
  //公開モジュールを参照する場合はここで宣言
  const channel_model = spa.model.channel;
  //----END SCOPE VARIABLES------------------------------------- 

  //------------------- BEGIN UTILITY METHODS ------------------
  const okikae = spa.util.okikae;
  //-------------------- END UTILITY METHODS -------------------

  //--------------------- BEGIN DOM METHODS --------------------
  //DOMメソッドにはページ要素の作成と操作を行う関数を配置
  // domMapにコレクションをキャッシュすると
  // ドキュメントトラバーサル数を減らせる
  const setDomMap = () => {
    domMap = {
      save: document.getElementById('channel-save'),
      name: document.getElementById('channel-name'),
      description: document.getElementById('channel-description'),
      world: document.getElementById('channel-world'),
      channel: document.querySelectorAll('#channel-table tbody')[0]
    };
  };


  //---------------------- END DOM METHODS ---------------------

  //------------------- BEGIN EVENT HANDLERS -------------------
  const saveChannel = () => {
    const params = {
        name: domMap.name.value,
        description: domMap.description.value,
        world: domMap.world.checked
      };
    
    channel_model.save(params);

  };
  
  //channel編集イベント
  const tapField = function(event) {
    event.preventDefault();
    const name = this.getAttribute('class');
    const edit_data = channel_model.search(name);
    
    //登録フィールドにデータコピー
    domMap.name.value = edit_data.name;
    domMap.description.value = edit_data.description;
    if (edit_data.world === '公開' && !domMap.world.checked) {
      domMap.world.click();
    }
  };
  
  //chanelリストの再描画
  const onChangeChannel = event => {
    const channel_list = event.detail;
    //console.info(_.isArray(channel_list));
    const html = channel_list.map(channel => 
      okikae(
        '<tr class="%s">%s</tr>', channel.key,
        ['name','host','description','members','world'].map(key => 
          okikae('<td>%s</td>', channel[key])
        ).join(''))
    ).join('');
    domMap.channel.innerHTML = html;

    //編集イベントのバインド
    const fields = document.querySelectorAll('#channel-table tbody tr');
     _.each(fields, ele => {
      ele.addEventListener('click', tapField, false);
    });

    //編集フィールドの初期化
    if (domMap.world.checked) {
      domMap.world.click();
    }
    domMap.name.value = '';
    domMap.description.value = '';

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
    container.innerHTML = spa.channel.template;
    stateMap.container = document.getElementById('channel-container');
    setDomMap();
    
    // subscribe to custom_event
    spa.gevent.subscribe( stateMap.container, 'change-channel', onChangeChannel);
    
    //ローカルイベントのバインド
    domMap.save.addEventListener('click', saveChannel);

    //mdlイベントの再登録
    componentHandler.upgradeDom();

    //channel listの生成
    channel_model.list();

  };


  // return public methods
  return {
    configModule : configModule,
    initModule   : initModule
  };
  //------------------- END PUBLIC METHODS ---------------------
})();

spa.channel.template = (() => {
  return `
    <article id="channel-container">
      <div class="channel-content mdl-grid">
        <div class="mdl-card mdl-cell--12-col mdl-shadow--2dp">
          <div class="mdl-card__title">
             <h2>My Channel</h2>
          </div>
          <div class="about-section mdl-card__supporting-text">
            <section>
              <h3>管理しているChannel</h3>
              <table id="channel-table" class="mdl-data-table mdl-js-data-tablei">
                <thead>
                  <th>Channel</th>
                  <th>Host</th>
                  <th>Description</th>
                  <th>Members</th>
                  <th>World</th>
                </thead>
                <tbody></tbody>
              </table>
            </section>
          </div>
          <div class="about-section mdl-card__supporting-text">
            <section>
              <h3>Channelの追加と編集</h3>
              <div class="mdl-textfield mdl-js-textfield">
                <input class="mdl-textfield__input" type="text" id="channel-name">
                <label class="mdl-textfield__label" for="channel-name">Channel Name...</label>
              </div>
              <div class="mdl-textfield mdl-js-textfield">
                <input class="mdl-textfield__input" type="text" id="channel-description">
                <label class="mdl-textfield__label" for="channel-description">Channel Description...</label>
              </div>
              <label class="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" for="channel-world">
                <input type="checkbox" id="channel-world" class="mdl-checkbox__input" >
                <span class="mdl-checkbox__label">公開</span>
              </label>
              <button id="channel-save" class="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect">
                Channel登録
              </button>
            </section>
        </div>
      </div>
    </article>`;
})();
