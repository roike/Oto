/*
 * project: elabo-one
 * spa.marked.js
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
spa.marked = (() => {
  'use strict';
  //-------BEGIN SCOPE VARIABLES----------------------------
  const
    configMap = {anchor: null, previous: null},
    stateMap  = {
      //ローカルキャッシュはここで宣言
      //channelList.sampleは試用投稿グループ
      container: null,
      channelList: null,
      isSource: false
    };
  let domMap = {};
  //定数はここで宣言
  //公開モジュールを参照する場合はここで宣言
  const marked_model = spa.model.marked;
  const converter = new showdown.Converter();

  //----END SCOPE VARIABLES------------------------------------- 

  //------------------- BEGIN UTILITY METHODS ------------------
  const okikae = spa.util.okikae;
  const encodeHTML = spa.util.encodeHTML;

  //-------------------- END UTILITY METHODS -------------------

  //--------------------- BEGIN DOM METHODS --------------------
  //DOMメソッドにはページ要素の作成と操作を行う関数を配置
  const setDomMap = () => {
    domMap = {
      container: document.getElementById('marked-container'),
      upload: document.getElementById('handle-image'),
      content: document.getElementById('marked-body'),
      preview: document.getElementById('marked-preview'),
      form: document.querySelector('form')
    };
  };

  //直前のキャレット位置に画像タグなどを挿入する
  const insertAtCaret = (field, text) => {
    if (field.selectionStart || field.selectionStart == '0') {
        let startPos = field.selectionStart;
        let endPos = field.selectionEnd;
        field.value = field.value.substring(0, startPos)
            + text
            + field.value.substring(endPos, field.value.length);
    } else {
        field.value += text;
    }
  };

  //---------------------- END DOM METHODS ---------------------

  const initPage = () => {
    setDomMap();
    //グローバルカスタムイベントのバインド
    spa.gevent.subscribe(domMap.container, 'save-marked', onSaved  );
    
    //ローカルイベントのバインド
    domMap.upload.addEventListener('change', upLoad, false);
    domMap.content.addEventListener('keyup', keyupHandler, false);
    domMap.content.addEventListener('keydown', autoResize, false);
    domMap.container.addEventListener('click', clickHandler, false);
    domMap.container.addEventListener('submit', onSubmit, false);

    //mdlイベントの再登録
    componentHandler.upgradeDom()
  };

  //------------------- BEGIN EVENT HANDLERS -------------------
  //Stop when the submit is fired
  const onSubmit = event => {
    event.preventDefault()
  };

  const clickEventMap = {
    //---container handler section------------
    selectImage: event => {domMap.upload.click();},
    //htmlのsource view切り替え
    sourceView: (event) => {
      if (stateMap.isSource) {
        stateMap.isSource = false;
        keyupHandler();
      } else {
        domMap.preview.textContent = domMap.preview.innerHTML;
        stateMap.isSource = true;
      }
    },
    //----post form-----------------
    //form投稿時にencodeHTMLをwrapする
    postForm: event => {
      const form = new FormData(domMap.form);
      const params = _.object(
          _.map(['title', 'tags', 'slug', 'channel'], 
            name => [name, encodeHTML(form.get(name))||''])
      );
      params['content'] = form.get('content');

      const mesData = {
        top: '70px',
        left: '100px',
        message: '投稿フォームが未記入です。'
      };
      
      const channelIndex = _.indexOf(stateMap.channelList, params.channel);
      //console.info(params);
      if ( _.isEmpty(_.without(_.values(params), ''))) {
        marked_model.message(mesData);
      } else if (channelIndex === -1) {
        mesData.message = '権限のない投稿先を指定しています。';
        marked_model.message(mesData);
      } else {
        //console.info(params);
        marked_model.post(domMap.form.action, params);
      }
    },

    postExcert: event => {
      const form = new FormData(domMap.form);
      const params = { content: form.get('content') };
      marked_model.post(domMap.form.action, params);
    },

    //-----dialog handler section------------
    showModal: event => {domMap.dialog.showModal();},
    closeModal: event => {
      domMap.dialog.close();
    }
  };

  const upLoad = event => {
    const file = domMap.upload.files[0];
    if (file === undefined || file.size > 1000000)  {
      return false;
    }
    marked_model.upload(file)
      .then(response => {
        const imageUrl = okikae('![IMAGE](https://elabo-one.appspot.com/dwload/%s)', response.filename);
        insertAtCaret(domMap.content, imageUrl);
        //画像の表示
        keyupHandler();
      })
      .catch(error => {console.info(error);});
  };

  const keyupHandler = event => {
    const content = domMap.content.value;
    domMap.preview.innerHTML = converter.makeHtml(content);

  };

  //TextAreaのデフォルト行数を超える場合に縦枠をリサイズ
  const autoResize = event => {
    const element = event.target;
    setTimeout(() => {
      element.style.cssText = 'height:auto; padding:0';
      element.style.cssText = 'height:' + element.scrollHeight + 'px';
    },0);

  };
  
  const clickHandler = event => {
    //console.info(event.target);
    const element = event.target;
    const listener = element.getAttribute('listener') || 'none';
    if(_.has(clickEventMap, listener)) {
      event.stopPropagation();
      clickEventMap[listener](event);
    }
  };

  //custom event---------------------
  const onSaved = event => {
    //console.info(event.detail);
    const [prev, slug] = event.detail.split('_');
    spa.uriAnchor.setAnchor( { 'page': ['blog', prev, slug], cache: false }, false );
  };

  //[url, excerpt, before]
  const onLoadExcerpt = event => {
    const {key, excerpt} = event.detail;
    const [prev, slug] = key.split('_');

    stateMap.container.innerHTML = spa.marked.excerpt([
      `/blog/put/${prev}/${slug}/excerpt`,
      excerpt,
      `/blog/${prev}/${slug}`
    ]);

    initPage();
  };

  //新規更新ともtemplateに埋め込むのは次の8箇所
  //[url, title, tags, slug, channel, channel_list, content, 前画面(blog) ]
  const onLoadBlog = event => {
    stateMap.channelList = marked_model.channels().map(({name}) => name);
    if(_.indexOf(stateMap.channelList, 'sample') === -1)
      stateMap.channelList.push('sample');

    const {key, title, tags, content, channel, excerpt} = event.detail;
    const [prev, slug] = key.split('_');

    stateMap.container.innerHTML = spa.marked.template([
      `/blog/put/${prev}/${slug}`,
      title, tags, slug, channel,
      stateMap.channelList.map(name => `<option value="${name}">`).join(''),
      content,
      `/blog/${prev}/${slug}`
    ]);

    initPage();
  };

  //新規作成時はtitle, slug, tags, content, 前画面は空文字置き換え
  const onLoadTemplate = event => {
    stateMap.channelList = event.detail.map(({name}) => name);
    if(_.indexOf(stateMap.channelList, 'sample') === -1)
      stateMap.channelList.push('sample');

    stateMap.container.innerHTML = spa.marked.template([
      '/blog/add',
      '', '', '', '',
      stateMap.channelList.map(name => `<option value="${name}">`).join(''),
      '', ''
    ]);

    initPage();
    domMap.container.getElementsByClassName('marked-nav')[0].style.display = 'none';
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
    

    //編集ページがある
    if(configMap.anchor.page.length > 1) {
      // subscribe to custom_event
      let select
      spa.gevent.subscribe(stateMap.container, 'blog-marked', onLoadBlog);
      spa.gevent.subscribe(stateMap.container, 'excerpt-marked', onLoadExcerpt);
      marked_model.edit('/' + configMap.anchor.page.join('/'));
    } else {
      //custom-event--テンプレートの読み込み
      spa.gevent.subscribe(stateMap.container, 'change-channel', onLoadTemplate  );
      //channel選択肢の埋め込み
      spa.model.channel.list();
    }

  };


  // return public methods
  return {
    configModule : configModule,
    initModule   : initModule
  };
  //------------------- END PUBLIC METHODS ---------------------
})();
//[url, title, tags, slug, channel, channel_list, content, 前画面(blog) ]
spa.marked.template = params => {
  const [url, title, tags, slug, channel, channel_list, content, before] = params;
  return `
    <section>
      <dialog id="marked-dialog" class="mdl-dialog">
        <h2 class="mdl-dialog__title">Blog 設定</h2>
        <div class="mdl-dialog__content">
          <ul class="demo-list-control mdl-list">
          </ul>
        </div>
        <div class="mdl-dialog__actions">
          <button type="button" class="mdl-button close" listener="closeModal">Close</button>
        </div>
      </dialog>
    </section>
    <article id="marked-container">
      <form action="${url}">
        <div class="marked-title mdl-textfield mdl-js-textfield">
            <input class="mdl-textfield__input" type="text" name="title" id="marked-title" value="${title}">
            <label class="mdl-textfield__label" for="marked-title">タイトル...</label>
        </div>
        <div class="marked-tag mdl-textfield mdl-js-textfield">
          <input class="mdl-textfield__input" type="text" name="tags" id="marked-tag" value="${tags}">
          <label class="mdl-textfield__label" for="marked-tag">タグをスペース区切りで入力</label>
        </div>
        <div class="marked-slug mdl-textfield mdl-js-textfield">
          <input class="mdl-textfield__input" type="text" name="slug" id="marked-slug" pattern="[a-z]*" value="${slug}">
          <label class="mdl-textfield__label" for="marked-slug">Slug...</label>
          <span class="mdl-textfield__error">英小文字 only</span>
        </div>
        <div class="marked-slug mdl-textfield mdl-js-textfield">
          <input class="mdl-textfield__input" type="text" list="dialog-channel-select" name="channel" id="marked-channel" pattern="[a-z]*" value="${channel}">
          <datalist id="dialog-channel-select">${channel_list}</datalist>
          <label class="mdl-textfield__label" for="marked-slug">投稿先グループ...</label>
          <span class="mdl-textfield__error">英小文字 only</span>
        </div>
        <div class="mdl-grid">
          <!--Markdown入力セクション-->
          <div class="mdl-cell mdl-cell--6-col">
            <div class="mdl-layout__header-row">
              <span>Markdown Editor</span>
              <div class="mdl-layout-spacer"></div>
              <button id="marked-image" class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored">
                <i class="material-icons" listener="selectImage">image</i>
              </button>
              <input type="file" id="handle-image" />
              <span for="marked-image" class="mdl-tooltip">画像の挿入</span>
              <button id="tt2" class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored">
                <i class="material-icons">sentiment_satisfied</i>
              </button>
              <span for="tt2" class="mdl-tooltip">絵文字パレット</span>
              <button id="marked-save" class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored">
                <i class="material-icons" listener="postForm">save</i>
              </button>
              <span for="marked-save" class="mdl-tooltip">記事の登録</span>
              <button id="marked-settings" class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored">
                <i class="material-icons" _listener="showModal">settings</i>
              </button>
              <span for="marked-settings" class="mdl-tooltip">投稿の設定</span>
            </div>
            <div class="marked-body mdl-textfield mdl-js-textfield">
              <textarea name="content" id="marked-body" class="mdl-textfield__input" type="text" rows="40" >${content}</textarea>
              <label class="mdl-textfield__label" for="marked-body">本文</label>
            </div>
          </div>
          <!--HTML表示セクション-->
          <div class="mdl-cell mdl-cell--6-col">
            <div class="mdl-layout__header-row">
              <span>Html Preview</span>
              <div class="mdl-layout-spacer"></div>
              <button id="tt1" class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored">
                <i class="material-icons">help</i>
              </button>
              <span for="tt1" class="mdl-tooltip">Markdownの書き方</span>
              <button id="html-source" class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored">
                <i class="material-icons" listener="sourceView">compare_arrows</i>
              </button>
              <span for="html-source" class="mdl-tooltip">表示切替え</span>
            </div>
            <div id="marked-preview"></div>
          </div>
          <nav class="marked-nav mdl-cell mdl-cell--12-col">
            <a href="${before}" title="前の画面">
              <button class="mdl-button mdl-js-button mdl-js-ripple-effect mdl-button--icon" >
                <i class="material-icons" role="presentation">arrow_back</i>
              </button>
            </a>
          </nav>
        </div>
      </form>
    </article>`;
};

spa.marked.excerpt = params => {
  const [url, excerpt, before] = params;
  return `
  <article id="marked-container">
    <form action="${url}">
      <div class="mdl-grid">
        <!--Markdown入力セクション-->
        <div class="mdl-cell mdl-cell--6-col">
          <div class="mdl-layout__header-row">
            <span>Markdown Editor&nbsp;&#60;記事概要の編集&#62;</span>
            <div class="mdl-layout-spacer"></div>
            <button id="marked-image" class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored">
              <i class="material-icons" listener="selectImage">image</i>
            </button>
            <input type="file" id="handle-image" />
            <span for="marked-image" class="mdl-tooltip">画像の挿入</span>
            <button id="tt2" class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored">
              <i class="material-icons">sentiment_satisfied</i>
            </button>
            <span for="tt2" class="mdl-tooltip">絵文字パレット</span>
            <button type="submit" id="marked-save" class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored">
              <i class="material-icons" listener="postExcert">save</i>
            </button>
            <span for="marked-save" class="mdl-tooltip">記事概要の登録</span>
          </div>
          <div class="marked-body mdl-textfield mdl-js-textfield">
            <textarea name="content" id="marked-body" class="mdl-textfield__input" type="text" rows="40" >${excerpt}</textarea>
            <label class="mdl-textfield__label" for="marked-body">本文</label>
          </div>
        </div>
        <!--HTML表示セクション-->
        <div class="mdl-cell mdl-cell--6-col">
          <div class="mdl-layout__header-row">
            <span>Html Preview</span>
            <div class="mdl-layout-spacer"></div>
            <button id="tt1" class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored">
              <i class="material-icons">help</i>
            </button>
            <span for="tt1" class="mdl-tooltip">Markdownの書き方</span>
            <button id="html-source" class="mdl-button mdl-js-button mdl-button--icon mdl-button--colored">
              <i class="material-icons" listener="sourceView">compare_arrows</i>
            </button>
            <span for="html-source" class="mdl-tooltip">表示切替え</span>
          </div>
          <div id="marked-preview"></div>
        </div>
        <nav class="marked-nav mdl-cell mdl-cell--12-col">
          <a href="${before}" title="前の画面">
            <button class="mdl-button mdl-js-button mdl-js-ripple-effect mdl-button--icon" >
              <i class="material-icons" role="presentation">arrow_back</i>
            </button>
          </a> 
        </nav>
      </div>
    </form>
  </article>`;
};

