/*
 * template spa.gevent.js
 * Copyrighted by ryuji.oike@gmail.com
 * -----------------------------------------------------------------
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
  let customSubMap = {};

  //----------------- END MODULE SCOPE VARIABLES ---------------

  //------------------- BEGIN PUBLIC METHODS -------------------
  const publishEvent = (event_name, data) => {

    const event_obj  = customSubMap[ event_name ];

    if ( ! event_obj ) { return false; }

    event = new CustomEvent(event_name, {detail: data});
    event_obj.dispatchEvent(event);

    return true;
  };

  //--event_nameは競合不可
  const subscribeEvent = function ( collection, event_name, fn ) {
    //console.info('bind collection %s', collection);
    if ( customSubMap[ event_name ] ){
      delete customSubMap[ event_name ];
    }

    collection.addEventListener( event_name, fn );

    customSubMap[ event_name ] = collection;
  };

  const unsubscribeEvent = function ( collection, event_name ) {
    if ( ! customSubMap[ event_name ] ){ return false; }

    delete customSubMap[ event_name ];

    return true;
  };

  //------------------- END PUBLIC METHODS ---------------------

  // return public methods
  return {
    publish     : publishEvent,
    subscribe   : subscribeEvent,
    unsubscribe : unsubscribeEvent
  };
})();

