#!/usr/bin/env python
# -*- coding: utf-8 -*-
# elabo-one models.blog
# Copyright 2016 ryuji.oike@gmail.com
# --------------------------------------------------------

#from datetime import date, timedelta
from google.appengine.ext import ndb
from datetime import date
import random, logging, calendar
#local module----------------------------
from helper import convert_to_html, append_tag_property, sanitizeHtml, wrap_img

CHANNEL_NAME_REGEX = r'[-a-z0-9]+'
ALPHABETS = u'abcdefghijklnmopqrstuvwxyz'

class Channel(ndb.Model):
    #Channel(id=<channel_name>)
    #プロパティ-------------------------------------------
    name = ndb.StringProperty(indexed=False)
    #host-->channelのホスト<--user.nickname()
    host = ndb.StringProperty()
    #簡単な紹介
    description = ndb.StringProperty(indexed=False)
    #@の左側を使う
    nickname = ndb.ComputedProperty(lambda self: self.host.split('@')[0])
    members = ndb.IntegerProperty(default=1, indexed=False)
    #True->公開
    world = ndb.BooleanProperty(default=True, indexed=False)
    #False->コメントを許可しない
    comment_state = ndb.BooleanProperty(default=False)
    date_update = ndb.DateTimeProperty(auto_now=True)
    #-----------------------------------------------------


    def gen_access_token(self):
        abc = ''.join(random.choice(ALPHABETS) for i in xrange(16))
        return abc

    @classmethod
    def put_new(cls, params):
        #params={name,host,description,world}
        #既存の場合は上書き
        state = {'false': False, 'true': True}
        channel = Channel(id=params.get('name'))
        channel.name = params.get('name')
        channel.host = params.get('host')
        channel.description = params.get('description')
        channel.world = state[params.get('world')]
        
        return channel.put()

    @classmethod
    def get_list(cls, host):
        #Max list=10 それ以上ある場合の処理は必要に応じて実装 
        def call_back(entity):
            #logging.info(entity.name)
            world = u'非公開'
            if entity.world: world = u'公開'
            return {
                    'key': entity.key.string_id(),
                    'name': entity.name,
                    'host': entity.nickname,
                    'description': entity.description,
                    'members': entity.members,
                    'world': world
                    }
        #ホストするchannelがない場合は空リスト=[]を返す
        query = cls.query(cls.host==host).order(-cls.date_update)
        return map(call_back, query.fetch(10, offset=0))

class Comment(ndb.Model):
    #コメント投稿許可はchannelで設定
    channel_key = ndb.KeyProperty(kind=Channel)
    blog_key = ndb.KeyProperty(kind=Channel)
    poster = ndb.StringProperty()
    post_date_add = ndb.DateTimeProperty(auto_now_add=True, indexed=False)
    post_date_update = ndb.DateTimeProperty(auto_now=True)
    body_markdown = ndb.TextProperty()
    body_html = ndb.TextProperty()
    delete_flag = ndb.BooleanProperty(default=False)
    #コメントの確認-->更新された場合はFalse
    checked = ndb.BooleanProperty(default=False)


class Blog(ndb.Model):
    #仕様---------------------------------------------------------------
    #.投稿記事の登録
    #.設定time=utc
    #.記事の削除は一度delete_flag=Trueにする、物理的に削除するかどうかは検討
    #.記事検索は更新日でする--更新されている記事は最新化されている
    #.urlのanchor=Blog.key.urlsafe()
    #.blogのkeyは6文字のアルファベット_slugで生成する
    #.url-->/blog/6文字アルファベ/slugになる
    #.slugが空の場合--4文字アルファベ生成
    #.ChannelはBlog所属先
    #データproperty-------------------------------------
    #self.key=<abcdef>_slug
    channel_key = ndb.KeyProperty(kind=Channel)
    #--ndb.UserPropertyは使わないが推薦されている<--docs.User Objects
    poster = ndb.StringProperty()
    title = ndb.StringProperty(indexed=False)
    slug = ndb.StringProperty(default=None, indexed=False)
    tags = ndb.StringProperty(repeated=True)
    #auto_now_add->新規追加時のみ,auto_now-->更新ごと
    #--但しrepeated=Trueの場合はauto_now=Trueが優先
    post_date_add = ndb.DateTimeProperty(auto_now_add=True, indexed=False)
    post_date_update = ndb.DateTimeProperty(auto_now=True)
    #記事概要--新着記事でリスト
    excerpt_markdown = ndb.TextProperty(default=u'記事概要はありません')
    content_markdown = ndb.TextProperty()
    excerpt_html = ndb.TextProperty()
    content_html = ndb.TextProperty()
    #posted=Trueのみ公開-->Falseは下書き中
    posted = ndb.BooleanProperty(default=False)
    #記事の削除flag=Trueで記事が削除された
    delete_flag = ndb.BooleanProperty(default=False)

    #property cache

    #--------------パーマンリンクの作成は不要かも？----------------

    #--------------------------------------------    
    #アルファベットからランダムに文字列を生成する
    #key-->6文字、slug-->4文字
    def random_abc(self,n=6):
        return ''.join(random.choice(alphabets) for i in xrange(n))

    def get_blog(self):
        update = self.post_date_update
        y, m, d = update.year, update.month, update.day
        m_name = calendar.month_name[m]
        return {
                'key': self.key.string_id(),
                'nickname': self.poster, 
                'title': self.title,
                'tags': self.tags[0],
                'content': self.content_html,
                'date': '%s %s, %s' % (m_name, d, y)
                }
        
    def get_marked(self):

        return {
                'key': self.key.string_id(),
                'nickname': self.poster,
                'title': self.title,
                'tags': self.tags[0],
                'slug': self.slug,
                'content': self.content_markdown,
                'channel': self.channel_key.string_id()
                }

    def get_excerpt(self):

        return {
                'key': self.key.string_id(),
                'nickname': self.poster,
                'excerpt': self.excerpt_markdown,
                }

    def put_blog(self, params):
        self.channel_key = ndb.Key(Channel, params.get('channel'))
        self.title = params.get('title')
        self.tags = [params.get('tags')]
        self.slug = params.get('slug')
        self.content_markdown = params.get('content')
        self.poster = params.get('user_id')
        #markdown->html変換する->imgをfigureでwrapする
        self.content_html = wrap_img(sanitizeHtml(convert_to_html(self.content_markdown)))
        
        blog_key = self.put()
        return blog_key.string_id()

    def put_property(self, prop, params):
        if prop == u'Post':
            self.posted = True
        elif prop == u'Draft':
            self.posted = False
        else:
            self.excerpt_markdown = params.get('content')
            #markdown->html変換する->imgをfigureでwrapする
            self.excerpt_html = wrap_img(sanitizeHtml(convert_to_html(self.excerpt_markdown)))

        blog_key = self.put()
        return blog_key.string_id()


    #--登録--------------------------------------------------------------------------
    #htmlをサニタイズする場合はsanitizeHtmlでラップする
    #keyがあれば更新、なければ新規
    @classmethod
    def save_blog(cls, params):
        #params={key, title, tags, content, slug, user_id, channel}
        key_name = params.get('key')
        if key_name is None:
            slug = params.get('slug')
            if slug is None:
                slug = ''.join(random.choice(ALPHABETS) for i in xrange(4))
            abc = ''.join(random.choice(ALPHABETS) for i in xrange(6))
            key_name = '%s_%s' % (abc, slug)
        
        blog = cls(id=key_name)
        blog.channel_key = ndb.Key(Channel, params.get('channel'))
        blog.title = params.get('title')
        blog.tags = [params.get('tags')]
        blog.slug = params.get('slug')
        blog.content_markdown = params.get('content')
        blog.poster = params.get('user_id')
        #markdown->html変換する->imgをfigureでwrapする
        blog.content_html = wrap_img(sanitizeHtml(convert_to_html(blog.content_markdown)))
        
        blog_key = blog.put()
        return blog_key.string_id()

    #チャネル毎の新着ブログ取り出し-------------------
    @classmethod
    def newist(cls, params, cb='entry'):
        logging.info(params)
        offset = int(params.get('offset'))
        channel = params.get('channel')
        tags = params.get('tags').decode('utf-8')
        line = int(params.get('fetch'))
        post_state = params.get('posted')
        nickname = params.get('user_id', None)
        logging.info(nickname)

        def format_data():
            def entry(entity):
                #logging.info(entity.title)
                update = entity.post_date_update
                y, m, d = update.year, update.month, update.day
                m_name = calendar.month_name[m]
                posted = u'Draft'
                if entity.posted: posted = u'Post'
                excerpt = u'記事概要はありません'
                if entity.excerpt_html: excerpt = entity.excerpt_html
                return {
                    'key': entity.key.string_id(),
                    'title': entity.title,
                    'tags': entity.tags,
                    'slug': entity.slug,
                    'excerpt': excerpt,
                    'channel': entity.channel_key.string_id(),
                    'date': '%s %s, %s' % (m_name, d, y),
                    'posted': posted
                }

            #Blog Subsystem Only
            def home(entity):
                return {
                    'title': entity.title,
                    'slug': entity.slug,
                    'content': entity.content_html
                }
            
            return {'entry': entry, 'home': home}

        query = cls.query()
        if nickname:
            query = query.filter(cls.poster==nickname)
        if channel:
            channel_key = ndb.Key(Channel, channel)
            query = query.filter(cls.channel_key==channel_key)
        if tags != u'all':
            query = query.filter(cls.tags==tags)
        if post_state:
            query = query.filter(cls.posted==True)
        query = query.order(-cls.post_date_update)

        call_back = format_data()[cb]
        return map(call_back, query.fetch(line, offset=offset))



class DaylyArchives(ndb.Model):
    pass

class MonthlyArchives(ndb.Model):
    pass
        
class DaylyTags(ndb.Model):
    pass

class MonthlyTags(ndb.Model):
    pass


class Comment(ndb.Model):
    pass

        
