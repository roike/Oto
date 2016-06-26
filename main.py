#!/usr/bin/env python
# -*- coding: utf-8 -*-
# elabo-one main
# Copyright 2016 ryuji.oike@gmail.com
# --------------------------------------------------------

from google.appengine.api import users, taskqueue
from google.appengine.ext import ndb
from bottle import Bottle, debug, request, response, static_file, abort
from json import loads
import logging
#dictで帰す場合にBottleがJsonに変換する<--dumpsは不要
#response.headers['Content-Type'] = 'application/json; charset=UTF-8'<--default
#localモジュール---------------------------------
from controllers.blog import write_gcs, read_gcs
from models.blog import Channel, Blog

FORMATS = dict(jpg='image/jpeg', png='image/png', gif='image/gif')

# Create the Bottle WSGI application.

bottle = Bottle()
debug(True)

#downLoadのget Requestを通過させる-----------------
@bottle.route('/dwload/<filename>')
def dwload_image(filename):
    img_format = filename.split('.')[-1]
    content_type = FORMATS.get(img_format)
    if content_type:
        response.headers['Content-Type'] = content_type
        return read_gcs(filename)

#---static_file section--------------------------------
#このセクションは認証不要
#urlを直接入力する場合(bookmarkも同じ)もここに入る
#anchorがあればログインチェック後に指定anchorを表示
#なければtemplateでページ不在を知らせる<--未実装
@bottle.route('/')
@bottle.route('/<anchor>')
@bottle.route('/<anchor>/<abcd>/<slug>')
@bottle.route('/<anchor>/<action>/<abcd>/<slug>')
@bottle.route('/<anchor>/<action>/<abcd>/<slug>/<prop>')
def init_anchor(anchor='home', action=None, abcd=None, slug=None, prop=None):
    if anchor in ['home', 'marked', 'channel', 'newist', 'blog' ]:
        return static_file('editor.html', root='./')

    abort(404, 'Sorry, Nothing at this URL.')


#-------decorator section-------------------------

def allow_login(func):
    #なりすましの場合はここでフィルターされる
    def wrapper(*args, **kwargs):
        login_user = users.get_current_user()
        request_user = request.forms.get('user_id')
        if request_user == login_user.nickname():
            return func(*args, **kwargs)
        #if login_user is None or request_user != login_user.nickname():
        response.status = 403
        #response.content_type = 'application/json; charset=utf-8'
        return {'error': 'Forbidden, No access right.'}
    return wrapper

#---dynamic module section---------------------
#staticファイルをダウンロード-->ログインチェック-->
#未ログイン-->login誘導-->staticファイルDW-->ログインチェック-->
#ログイン済み-->指定ページ開く
#ログイン後のデータ要求時のチェックは以下--->
#ログイン時にユーザニックネイムを発行
#以後のデータ要求時にユーザニックネイムをクライアント側とサーバ側で照合
#上記不一致の場合は未ログイン状態に初期化してフロントに戻す
#exceptが発生した場合は-------------------->
#例外をreturnすればjs.spa.modelでcatchする
#except Exception as e: abort(500)

@bottle.route('/login', method='post')
def user_login():
    anchor = '/' + '/'.join(loads(request.forms.get('page')))
    return ensured_login(anchor)

#blogのコンテンツ取り出し
@bottle.route('/blog/<abcd>/<slug>', method='post')
@allow_login
def get_blog(abcd, slug):
    try:
        request_user = request.forms.get('user_id')
        blog = ndb.Key(Blog, '%s_%s' % (abcd, slug)).get()
        publish = blog.get_blog()
        if request_user == publish.get('nickname'):
            return {'publish': publish}
        response.status = 403
        return {'error': 'Forbidden, No access right.'}
    except Exception as e:
        loging.info(e)
        abort(500)

#更新にmarkdownの取り出し--exclude excerpt---
@bottle.route('/marked/<abcd>/<slug>', method='post')
@allow_login
def get_marked(abcd, slug):
    try:
        request_user = request.forms.get('user_id')
        blog = ndb.Key(Blog, '%s_%s' % (abcd, slug)).get()
        publish = blog.get_marked()
        if request_user == publish.get('nickname'):
            return {'publish': publish}
        response.status = 403
        return {'error': 'Forbidden, No access right.'}
    except Exception as e:
        loging.info(e)
        abort(500)

#更新にexcerptの取り出し
@bottle.route('/marked/excerpt/<abcd>/<slug>', method='post')
@allow_login
def get_excerpt(abcd, slug):
    try:
        request_user = request.forms.get('user_id')
        blog = ndb.Key(Blog, '%s_%s' % (abcd, slug)).get()
        publish = blog.get_excerpt()
        if request_user == publish.get('nickname'):
            return {'publish': publish}
        response.status = 403
        return {'error': 'Forbidden, No access right.'}
    except Exception as e:
        loging.info(e)
        abort(500)

#新規にBlogの登録--戻り値は登録キー
@bottle.route('/blog/add', method='post')
@allow_login
def add_blog():
    try:
        return {'publish': Blog.save_blog(request.forms)}
    except Exception as e:
        loging.info(e)
        abort(500)

#Blogの更新--戻り値は登録キー
@bottle.route('/blog/put/<abcd>/<slug>', method='post')
@allow_login
def put_blog(abcd, slug):
    try:
        blog = ndb.Key(Blog, '%s_%s' % (abcd, slug)).get()
        return {'publish': blog.put_blog(request.forms)}
    except Exception as e:
        loging.info(e)
        abort(500)

#excerpt,Postedの登録
@bottle.route('/blog/put/<abcd>/<slug>/<prop>', method='post')
@allow_login
def put_property(abcd, slug, prop):
    try:
        blog = ndb.Key(Blog, '%s_%s' % (abcd, slug)).get()
        return {'publish': blog.put_property(prop, request.forms)}

    except Exception as e:
        loging.info(e)
        abort(500)


#現在はcurrent_userが投稿したBlogのみ新着リストする
@bottle.route('/newist', method='post')
@allow_login
def entry_newist():
    try:
        params = {'posted': False}
        params.update(request.forms)
        #logging.info(params)
        cb = 'entry'
        if params.get('channel', '') == 'home':
            cb = 'home'
        return {'publish': Blog.newist(params, cb)}
    except Exception as e:
        loging.info(e)
        abort(500)

@bottle.route('/channel/list', method='post')
@allow_login
def channel_list():
    #current_userがhostするchannelをリストする
    #allow_loginでrequest_user==current_userを確認済み
    request_user = request.forms.get('user_id')
    try:
        return {'publish': Channel.get_list(request_user)}
    except Exception as e:
        loging.info(e)
        abort(500)

@bottle.route('/channel/save', method='post')
@allow_login
def channel_save():
    request_user = request.forms.get('user_id')
    params = {'host': request_user}
    params.update(request.forms)
    try:
        channel = Channel.put_new(params)
        return {'publish': Channel.get_list(host)}
    except Exception as e:
        loging.info(e)
        abort(500)

#file upload
@bottle.route('/marked/upload', method='post')
def upload_file():
    #!認証が抜けている
    #filesize = int(request.headers['Content_Length'])
    upload =request.files.get('file')
    try:
        filename = write_gcs(upload)
        return dict(filename=filename)
    except Exception as e:
        loging.info(e)
        abort(500)



#---utility section------------------------------

def send_mail(nickname):
    #login mail送信
    taskqueue.Task(
            url='/task/mail/login', 
            params={'result': u'login', 'name': nickname}
            ).add('master')

def ensured_login(anchor):
    #url='/blog or /admin?
    #Notice:セキュリティ上user.user_id()はクライアントに直接戻さない
    user = users.get_current_user()
    values = { 'id': 'a0', 'name': 'a0', 'anchor': anchor, 'login_url': None }
    if user:
        values['id'] = user.nickname()
        values['name'] = user.nickname()
        #login mail送信----------
        #send_mail(nickname)
    else:
        values['login_url'] = users.create_login_url(anchor)
    
    logging.info(values)
    return values


