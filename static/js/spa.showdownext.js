/*
 * project: elabo-one
 * spa.showdownext.js
 * See License
 *-----------------------------------------------------------------
 *include showdown Extension and MathJax loading
*/

/*jslint         browser : true, continue : true,
  devel  : true, indent  : 2,    maxerr   : 50,
  newcap : true, nomen   : true, plusplus : true,
  regexp : true, sloppy  : true, vars     : false,
  white  : true
*/

/*global spa */
spa.showdownext = (() => {
  const setExt = () => { 
    showdown.extension('mathExt', () => {
      let matches = [];
      const fig = '<figure>' + '<img src="%1" alt="%2" title="%4">' + '<figcaption>%3</figcaption>' + '</figure>';
      const imgRegex = /(?:<p>)?<img.*?src="(.+?)".*?alt="(.*?)"(.*?)\/?>(?:<\/p>)?/gi; 
      return [
        { 
          //convert extention for mathmatical formula
          type: 'lang',
          regex: /\\\\\[([^]+?)\\\\\]/gi,
          replace: (s, match) => {
            matches.push(`<div class="mathjax">\\[${match}\\]</div>`);
            let n = matches.length - 1;
            return '%PLACEHOLDER' + n + '%';
          }
        },
        {
          type: 'output',
          filter: text => {
            for (let i=0; i< matches.length; ++i) {
              let pat = '<p>%PLACEHOLDER' + i + '% *<\/p>';
              text = text.replace(new RegExp(pat, 'gi'), matches[i]);
            }
            //reset array
            matches = [];
            return text;
          }
        },
        {
          type: 'output',
          filter: text => {
            let tag = fig;
            return text.replace(new RegExp(imgRegex, 'gi'), (match, url, alt, rest) => {
              //console.info(match);
              return tag.replace('%1', url).replace('%2', alt).replace('%3', alt).replace('%4', alt);
            });
          }
        }
      ];
    });
  };

  return {
    set: setExt
  };

})();

//
//take from github:MathJax/test/sample-dynamic-2.html
spa.mathjax = (() => {
  const Preview = {
    mjRunning: false,  // true when MathJax is processing
    mjPending: false,  // true when a typeset has been queued
  };
  //  Creates the preview and runs MathJax on it.
  //  If MathJax is already trying to render the code, return
  //  If the text hasn't changed, return
  //  Otherwise, indicate that MathJax is running, and start the
  //    typesetting.  After it is done, call PreviewDone.
  Preview.CreatePreview = () => {
    if (Preview.mjPending) return;
    const doms = document.getElementsByClassName('mathjax');
    //console.info(doms[0].innerHTML);
    if (Preview.mjRunning) {
      Preview.mjPending = true;
      MathJax.Hub.Queue(["CreatePreview",Preview]);
    } else {
      Preview.mjRunning = true;
      MathJax.Hub.Queue(
        ["Typeset",MathJax.Hub,doms],
        ["PreviewDone",Preview]
      );
    }
  };
  //  Indicate that MathJax is no longer running,
  //  and swap the buffers to show the results.
  Preview.PreviewDone = () => {
    Preview.mjRunning = Preview.mjPending = false;
  };

  const Init = () => {
    Preview.callback = MathJax.Callback(["CreatePreview",Preview]);
    //Set this to true if you want to be able to call the callback more than once
    Preview.callback.autoReset = true;
  };

  const Update = () => {
    Preview.callback();
  };

  return {
    init: Init,
    update: Update
  };

})();

