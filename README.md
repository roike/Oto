## Blog System for Google App Engine with Python

Blog編集と管理および配信を行う親システムと公開のみを行う複数の小システムからなる分散型のブログシステムです。親サイトのデモは<https://elabo-one.appspot.com>にあります。また小システムのデモは現在<https://thirdpen.com>のみ稼働しています。  
Chromeで動作を確認していますが、ES2015、CSS3、HTML5に対応したモダンブラウザであれば動作するはずです。

##Features

###Microservices Type
子システムへの記事配信は独立したエンジンで行います。例えば子システムのSon1は軽量エンジンで行い、Son2には大規模なエンジンで配信するというようなことができます。


## Licensing
See [LICENSE](LICENSE)
