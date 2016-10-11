/*
 * elabo-one spa.fake.js
 * Copyright 2016 ryuji.oike@gmail.com
 * --------------------------------------------------------
 */

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/
/*global $, spa */

spa.fake = (function () {
  'use strict';

  const mockAjax = (() => {
    const mockGet = () => {};

    const mockPost = (url, params) => {
      const mockKey = _.last(url.split('/'));
      return new Promise((resolve, reject) => {
        resolve(spa.fake.data[mockKey]);
        reject();
      });
    };
      
    return {
      get: mockGet,
      post: mockPost
    };

  })();

  
  return {
    mockAjax : mockAjax
  };
})();

spa.fake.data = (() => {

  return {
    login: {
      id: 'third-pen',
      name: 'thirdpen',
      anchor: '/home',
      login_url: null
    },
    list: {
      publish: []
    },
    newist: {
      publish: [
      {
        key: 'abcdef_slug',
        title: 'test-1',
        tags: 'test',
        slug: 'slug',
        excerpt: 'This is the mock data.',
        channel: 'third-pen',
        date: 'June 15, 2016',
        posted: 'Ryuji.Oike'
      },
      {
        key: 'abcdef_slug',
        title: 'test-2',
        tags: 'test',
        slug: 'slug',
        excerpt: 'This is the mock data.',
        channel: 'third-pen',
        date: 'June 15, 2016',
        posted: 'Ryuji.Oike'
      }
      ]
    }
  };

})();
