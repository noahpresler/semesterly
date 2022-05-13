#!/bin/bash
# Install chrome on local docker environment
# You can run this from your web container shell:
# /code/build/install_chrome.sh

export DEBIAN_FRONTEND=noninteractive
apt update
apt install wget

cd /tmp
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
apt install ./google-chrome-stable_current_amd64.deb
rm google-chrome-stable_current_amd64.deb

