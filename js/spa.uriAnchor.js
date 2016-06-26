/*
 * template spa.uriAncjor.js
 * Copyright 2016 ryuji.oike@gmail.com
 *-----------------------------------------------------------------
 * 
*/

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global spa */

spa.uriAnchor = (() => {
  'use strict';

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

  const makeError = spa.util.makeError;

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

    const event = new Event('popstate');
    window.dispatchEvent(event);

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


