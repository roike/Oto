/*
 * template spa.gevent.js
 * See License
 * -----------------------------------------------------------------
 * 2016-10-08 updated
*/

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/* global spa */

spa.gevent = (() => {
  'use strict';
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

    return true;
  };

  //event_nameは競合不可
  const subscribeEvent = function ( id, event_name, fn ) {
    //console.info('bind collection %s', collection);
    if ( _.has(customEventDict, event_name) ){
      delete customEventDict[ event_name ];
    }

    eventTarget[id].addEventListener( event_name, fn );

    customEventDict[ event_name ] = id;
    //console.info(customEventDict);
  };

  const unsubscribeEvent = function ( id, event_name ) {
    if ( _.has(customEventDict, event_name) ){
      delete customEventDict[ event_name ];
    }

    return true;
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

