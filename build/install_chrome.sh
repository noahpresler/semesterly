#!/bin/bash
# Install chrome on local docker environment
# You can run this from your web container shell:
# /code/build/install_chrome.sh

export DEBIAN_FRONTEND=noninteractive
apt update
apt install wget unzip

cd /tmp
# Please note chrome and chromedriver major versions need to match - update both when updating
wget -O google-chrome-stable.deb https://dl.google.com/linux/chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_89.0.4389.82-1_amd64.deb
wget https://chromedriver.storage.googleapis.com/89.0.4389.23/chromedriver_linux64.zip

apt install -yq ./google-chrome-stable.deb

unzip chromedriver_linux64.zip
mv chromedriver /usr/bin/chromedriver
chown root:root /usr/bin/chromedriver
chmod +x /usr/bin/chromedriver

rm -rf google-chrome-stable.deb chromedriver_linux64.zip