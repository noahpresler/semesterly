#!/usr/bin/env bash

##### CONFIGURABLE PARAMETERS #######

SEMESTERLY_HOME="."
DATABASE_NAME="semesterly"
DATABASE_USER_NAME="semmy"
DATABASE_USER_PASS="3ez5me"
VIRTUALENV_NAME="sem"

#####################################

echo "Semesterly Setup Script for Ubuntu (tested on 16.04)"
echo "IMPORTANT: make sure you are in the home directory of the Semesterly project."
echo "NOTE: view configurable variables in script file setup.sh"
read -p "Press any key to continue (^C to quit)..." -n1 -s

echo -e "\nSTATUS: starting basic development environment setup :-)"

######################################

export SEMESTERLY_HOME=$(pwd)

sudo apt update && sudo apt upgrade

sudo apt install -y \
	python-dev \
	python-pip \
	python3-dev \
	python3-pip \
	libpq-dev \
	libxml2-dev \
	libxslt1-dev \
	postgresql-client-common \
	postgresql-contrib \
	libssl-dev \
	libffi-dev \
	build-essential \
	pgadmin3 \
	npm
# postgresql-devel \ # NOTE: not sure if this is needed...?

# front-end tools
# npm install --global gulp-cli
# npm install
# npm install gulp

sudo -H pip install --upgrade pip

# Add the following to the bottom of your ~/.bashrc
if cat ~/.bashrc | grep -q 'virtualenvwrapper'; then
	echo "skipping: python virtual environment setup, already exists"
else
	sudo -H pip install virtualenv virtualenvwrapper
	echo ". /usr/local/bin/virtualenvwrapper.sh" >> ${HOME}/.bashrc
fi

mkvirtualenv "${VIRTUALENV_NAME}"
workon "${VIRTUALENV_NAME}"
pip install -r ${SEMESTERLY_HOME}/requirements.txt

# Setup django database
read -r -d '' PSQL_COMMANDS <<- EOM
CREATE DATABASE ${DATABASE_NAME};
CREATE USER ${DATABASE_USER_NAME} WITH PASSWORD '${DATABASE_USER_PASS}';
ALTER ROLE ${DATABASE_USER_NAME} SET client_encoding TO 'utf8';
ALTER ROLE ${DATABASE_USER_NAME} SET default_transaction_isolation TO 'read committed';
ALTER ROLE ${DATABASE_USER_NAME} SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE ${DATABASE_NAME} TO ${DATABASE_USER_NAME};
EOM

while read -r cmd; do
	sudo -u postgres -H -- psql -c "${cmd}"
done <<< "${PSQL_COMMANDS}"
unset PSQL_COMMANDS

if [ -e ${SEMESTERLY_HOME}/semesterly/local_settings.py ]; then
	: # do nothing
	# echo -e "\nexiting setup: ${SEMESTERLY_HOME}/semesterly/local_settings.py already exists"
else
	cat > ${SEMESTERLY_HOME}/semesterly/local_settings.py <<- EOM
# Database
# https://docs.djangoproject.com/en/1.6/ref/settings/#databases
# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql_psycopg2',
        'NAME': '"${DATABASE_NAME}"',
        'USER': '"${DATABASE_USER_NAME}"',
        'PASSWORD': '"${DATABASE_USER_PASS}"',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
EOM

fi


# Do first migrations
python manage.py makemigrations
python manage.py migrate

# Establish local DNS lookup for local server
DNSURLS="
	sem.ly
	jhu.sem.ly
	uoft.sem.ly
	queens.sem.ly
	vandy.sem.ly
	umd.sem.ly
	chapman.sem.ly
	pennstate.sem.ly
	gw.sem.ly
	umich.sem.ly"
for url in ${DNSURLS//\\n/ }
do
	if cat /etc/hosts | grep -q "${url}"; then
		: # do nothing
	else
		echo "127.0.0.1    ${url}" | sudo tee -a /etc/hosts
	fi
done

echo "STATUS: finished basic development environment setup :-)"

######### EXTENDED SETUP ###########

# Setup amazon textbooks for parsing
if [ -e ${HOME}/.amazon-product-api ]; then
	echo -e "\nskipping: ~/.amazon-product-api already exists."
else
cat > ${HOME}/.amazon-product-api <<- EOM
[Credentials]
access_key = ***REMOVED***
secret_key = ***REMOVED***
associate_tag = semesterly-20
EOM
fi

######################################

# ... anything else?
