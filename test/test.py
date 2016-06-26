#!/usr/bin/env python
# -*- coding: utf-8 -*-
# elabo-one test.test
# Copyright 2016 ryuji.oike@gmail.com
# --------------------------------------------------------
# utility for remote_api_shell


from google.appengine.ext import ndb
from json import loads, dumps

#insert third party libraries
import vendor
vendor.add('lib')

from models.blog import *

print 'Now available test module.'

#channelのリストを取得する--hostはchannelのオーナー
def get_channel_list(host):
    channel_list = Channel.get_list(host)
    
    for channel in channel_list:
        print channel.get('name')

#homeの新着リストを取得する
def get_newist_home():
    params = {
            'offset': 0,
            'channel': 'home',
            'tags': 'thirdpen',
            'fetch': 10,
            'posted': True,
            }
    return Blog.newist(params, 'home')
    
