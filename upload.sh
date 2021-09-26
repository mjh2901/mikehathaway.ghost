#!/bin/bash
gssg --domain "http://192.168.1.10:2368" --dest "docs" --url 'https://mjh2901.github.io'
#read -p "Upload website changes via script" desc
git add * && \
git add -u && \
git commit -m "autoupload changes via publish.sh script"
# git commit -m "$(read -p 'Upload website changes via script: ')" && \
git push origin master

