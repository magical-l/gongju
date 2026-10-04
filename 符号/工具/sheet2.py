# -*- coding: utf-8 -*-
import os, numpy as np
from PIL import Image, ImageDraw, ImageFont
import grid3 as G3
UI = r'C:\Windows\Fonts\consola.ttf'
CJK = r'C:\Windows\Fonts\msyh.ttc'
def _f(s): return ImageFont.truetype(UI, s)
def _fc(s): return ImageFont.truetype(CJK, s)
def sheet(items, path, cols=6, cell=170, nfont=12, nlen=26):
    rows=(len(items)+cols-1)//cols; ch=cell+34
    img=Image.new('L',(cols*cell, rows*ch),255); d=ImageDraw.Draw(img); f=_f(15)
    for i,(cp,name) in enumerate(items):
        cx,cy=(i%cols)*cell,(i//cols)*ch
        d.rectangle([cx,cy,cx+cell-1,cy+ch-1],outline=140)
        a=G3.get(cp)
        if a is not None and a.size:
            im=Image.fromarray((~a*255).astype('uint8'))
            s=min((cell-20)/im.width,(cell-20)/im.height,5.0)
            im=im.resize((max(1,int(im.width*s)),max(1,int(im.height*s))),Image.LANCZOS)
            img.paste(im,(cx+(cell-im.width)//2, cy+10+(cell-20-im.height)//2))
        d.text((cx+4,cy+cell+2),'U+%04X'%cp,font=f,fill=0)
        d.text((cx+4,cy+cell+17),name[:nlen],font=_fc(nfont),fill=50)
    img.save(path); return path
