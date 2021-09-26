#!/bin/bash
gssg --domain "http://192.168.1.10:2368" --dest "docs"
#read -p "Upload website changes via script" desc
git add * && \
git add -u && \
git commit -m "autoupload changes via script"
# git commit -m "$(read -p 'Upload website changes via script: ')" && \
git push origin master

