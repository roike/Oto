#!/usr/bin/env python
# -*- coding: utf-8 -*-
# elabo-one models.helper
# Copyright 2016 ryuji.oike@gmail.com
# --------------------------------------------------------

import logging, re
from urlparse import urljoin
#externals------------------------------
import mistune
from pygments import highlight
from pygments.lexers import get_lexer_by_name
from pygments.formatters import html
from bs4 import BeautifulSoup, Comment

#---------XSS Sanitization---------------------

#-----MarkDown-----------------------------------
class HighlightRenderer(mistune.Renderer):
    def block_code(self, code, lang):
        if not lang:
            return '\n<pre><code>%s</code></pre>\n' % \
                mistune.escape(code)
        lexer = get_lexer_by_name(lang, stripall=True)
        formatter = html.HtmlFormatter()
        return highlight(code, lexer, formatter)


def test_code_hilite():
    renderer = HighlightRenderer()
    markdown = mistune.Markdown(renderer=renderer)

    print(markdown('```python\nassert 1 == 1\n```'))

#markdownをhtmlに変換する
def convert_to_html(content):
    renderer = HighlightRenderer()
    markdown = mistune.Markdown(renderer=renderer)

    return markdown(content)


#-----BeautifulSoup------------------------------

#---whitelistにマッチしたHtml以外はescapeする--
def sanitizeHtml(value, base_url=None):
    rjs = r'[\s]*(&#x.{1,7})?'.join(list('javascript:'))
    re_scripts = re.compile('(%s)' % rjs, re.IGNORECASE)
    validTags = 'p i strong b u a h1 h2 h3 h4 h5 h6 pre br img li ul ol table tr td th'.split()
    validAttrs = 'href src width height'.split()
    urlAttrs = 'href src'.split() # Attributes which should have a URL
    soup = BeautifulSoup(value, 'lxml')
    for comment in soup.find_all(text=lambda text: isinstance(text, Comment)):
        # Get rid of comments
        comment.extract()
    for tag in soup.find_all(True):
        if tag.name not in validTags:
            tag.hidden = True
        attrs = tag.attrs
        tag.attrs = {}
        for attr, val in attrs.items():
            if attr in validAttrs:
                val = re_scripts.sub('', val) # Remove scripts js
            if attr in urlAttrs:
                val = urljoin(base_url, val) # Calculate the absolute url
            tag.attrs.update({attr: val})

    return soup.body.encode_contents()

#--Htmlから特定タグの設定情報を抽出する--
def list_tag_property(html, tag, fn):
    soup = BeautifulSoup(html, 'lxml')

    return [fn(ele) for ele in soup(tag)]

#--imgタグはfigureタグでラップする
def wrap_img(html):
    soup = BeautifulSoup(html, 'lxml')
    for tag in soup.find_all('img'):
        soup.img.wrap(soup.new_tag("figure"))
        
    return soup.body.encode_contents()

#--Html内の特定タグの設定情報を追加する--
def append_tag_property(html,tag_name,fn):
    soup = BeautifulSoup(html, 'lxml')
    for tag in soup(tag_name):
        for attr,val in fn(tag).items():
            tag.attrs.append((attr, val))
        
    return soup.body.encode_contents()

