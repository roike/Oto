/*
 * project: elabo-one
 * spa.model.js
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

/*-----ajaxの引数---------------
 ajax.get(url, params, callback)
 ajax.post(url, params, callback)
 paramsがない場合はnullにする
*/
spa.model = (() =>{
  'use strict';
  //データキャッシュ
  let stateMap = {
    user: null,
    blog: null,
    entry: {list: null},
    channel: {list: null},
    marked: {saved: {}}
  };
    //モックステータス--false-->fakeデータ使用
  const isFakeData = false;

  //インスタンスオブジェクト------------------------
  //初期値-->name='00'-->ログイン未確認
  //未ログイン-->name=='a0'-->ログインにリダイレクト
  //ゲスト-->name=='a1'-->guestログインを許可
  const User = (() => {
    const ajax = isFakeData ? spa.fake.mockAjax : spa.data.getAjax;

    //stateMap.user = {id:,name:,anchor:,login_url:}
    const login = pageList => {
      //console.info(urlList);
      const params = {page: JSON.stringify(pageList)};
      ajax.post('/login', params)
        .then(response => {
          stateMap.user = response;
          spa.gevent.publish( 'spa-login', stateMap.user);
        })
        .catch(error => {
          spa.gevent.publish('spa-error', error);
        })
    };

    return {
      get: () => stateMap.user,
      login: login
    };

  })();

  const Blog = (() => {
    const ajax = isFakeData ? spa.fake.mockAjax : spa.data.getAjax;

    const load = url => {
      ajax.post(url, {'user_id': stateMap.user.id})
        .then(data => {
          stateMap.blog = data.publish;
          spa.gevent.publish('load-blog', stateMap.blog);
        })
        .catch(error => {
          spa.gevent.publish('spa-error', error);
        });
    };

    return {
      load: load,
    };

  })();

  //channel==null-->all blog
  const Entry = channel => {
    const ajax = isFakeData ? spa.fake.mockAjax : spa.data.getAjax;
    let custom_event = 'change-newist';

    //blog新着リスト--6件単位で取り出す
    //[{key:, title:, excerpt:, channel:, date:, tags:, posted:},..]
    const newist = params => {
      params['user_id'] = stateMap.user.id;
      if (channel) {
        params['channel'] = channel;
        custom_event = 'change-home';
      }
      ajax.post('/newist', params)
        .then(data => {
          stateMap.entry.list = data.publish;
          spa.gevent.publish(custom_event, stateMap.entry.list);
        })
        .catch(error => {
          spa.gevent.publish('spa-error', error);
        });
    };

    const current = params => {
      spa.gevent.publish(custom_event, stateMap.entry.list);
    };

    const changeState = (row, state) => {
      const [a, b] = stateMap.entry.list[row].key.split('_');
      const url = `/blog/put/${a}/${b}/${state}`;
      ajax.post(url, {'user_id': stateMap.user.id})
        .then(response => {
          stateMap.entry.list[row].posted = state;
        })
        .catch(error => {
          spa.gevent.publish('spa-error', error);
        })
    };

    return {
      newist: newist,
      current: current,
      list: () => stateMap.entry.list,
      state: changeState
    };

  };

  const Channel = (() => {
    const ajax = isFakeData ? spa.fake.mockAjax : spa.data.getAjax;

    const saveChannel = params => {
      //登録後のchannelリストを返す
      //console.info(params);
      params['user_id'] = stateMap.user.id;
      ajax.post('/channel/save', params)
        .then(data => {
          stateMap.channel.list = data.publish;
          spa.gevent.publish('change-channel', stateMap.channel.list);
        })
        .catch(error => {
          spa.gevent.publish('spa-error', error);
        });
    };
    
    //[{key:,name:,host:,description:,members:,world:},..]
    const listChannel = () => {
      if (!stateMap.channel.list) {
        ajax.post('/channel/list', {'user_id': stateMap.user.id})
          .then(data => {
            stateMap.channel.list = data.publish;
            spa.gevent.publish('change-channel', stateMap.channel.list);
          })
          .catch(error => {
            spa.gevent.publish('spa-error', error);
          });
      } else {
        spa.gevent.publish('change-channel', stateMap.channel.list);
      }
    };

    const searchChannel = name => {
      const t_index = _.findIndex(stateMap.channel.list, {key: name});
      return stateMap.channel.list[t_index];
    };

    return {
      save: saveChannel,
      list: listChannel,
      search: searchChannel
    };

  })();

  const Marked = (() => {
    const ajax = isFakeData ? spa.fake.mockAjax : spa.data.getAjax;
    //const dcopy = spa.util.deepCopy;

    //キャッシュに保存
    const saveMarked = params => {
      //console.info(params);
      _.extend(stateMap.marked.saved, params);
      
    };
    
    //url = /blog/put/abc/slug or /blog/put/abc/slug/excerpt
    const post = (url, params) => {
      params['user_id'] = stateMap.user.id;
      //console.info(params);
      //キャッシュ初期化
      stateMap.marked.saved = {};
      ajax.post(url, params)
        .then(data => {
          spa.gevent.publish('save-marked', data.publish);
        })
        .catch(error => {
          spa.gevent.publish('spa-error', error);
        });
    };
    
    //select = blog or excerptのデータDload
    const edit = url => {
      const params = {user_id: stateMap.user.id};
      const request = {
        channels: () => {
          if (stateMap.channel.list) {
            return new Promise((resolve, reject) => {
              resolve({publish: stateMap.channel.list});
            });
          } else {
            return ajax.post('/channel/list', params);
          }
        },
        //stateMap.blogのキャッシュを使う
        marked: () => ajax.post(url, params)
      };

      const main = () => Promise.all([request.channels(), request.marked()]);

      //publish=blog-marked or excerpt-marked
      main()
        .then(data => {
          //console.info(data);
          stateMap.channel.list = data[0].publish;
          _.extend(stateMap.marked.saved, data[1].publish);
          let custom_event = 'blog-marked';
          if (_.has(stateMap.marked.saved, 'excerpt')) {
            custom_event = 'excerpt-marked';
          }
          spa.gevent.publish(custom_event, stateMap.marked.saved);
        })
        .catch(error => {
          spa.gevent.publish('spa-error', error);
        });
    };

    const alertMessage = params => {
      spa.gevent.publish('spa-message', params);
    }

    return {
      save: saveMarked,
      post: post,
      edit: edit,
      message: alertMessage,
      upload: file => ajax.up('/marked/upload', file),
      channels: () => stateMap.channel.list
    };
  })();

  const initModule = () => {
    //userオブジェクト初期値生成-->初期値-->name='00'-->ログイン未確認
    stateMap.user = { id: '00', name: '00', login_url: null };

  };

  return {
    initModule: initModule,
    user: User,
    entry: Entry,
    marked: Marked,
    channel: Channel,
    blog: Blog
  };
})();
