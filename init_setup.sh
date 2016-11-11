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

if [ -e ${SEMESTERLY_HOME}/semesterly/local_settings.py ]; then
	echo -e "\nexiting setup: ${SEMESTERLY_HOME}/semesterly/local_settings.py already exists"
	return 1
fi

echo -e "\nSTATUS: starting basic development environment setup :-)"

######################################

sudo apt install -y \
	python-dev \
	python-pip \
	python3-dev \
	python3-pip \
	libpq-dev \
	postgresql-devel \
	libxml2-dev \
	libxslt1-dev \
	postgresql-client-common \
	postgresql-contrib

sudo -H pip install --upgrade pip
sudo -H pip install virtualenv virtualenvwrapper

# Add the following to the bottom of your ~/.bashrc
if cat ~/.bashrc | grep -q 'virtualenvwrapper'; then
	: # do nothing
else
	echo ". /usr/local/bin/virtualenvwrapper.sh" >> ${HOME}/.bashrc
fi

mkvirtualenv "${VIRTUALENV_NAME}"
workon "${VIRTUALENV_NAME}"
pip install -r ${SEMESTERLY_HOME}/requirements.txt

# Setup django database
read -r -d '' PSQL_COMMANDS << EOF
CREATE DATABASE ${DATABASE_NAME};
CREATE USER ${DATABASE_USER_NAME} WITH PASSWORD '${DATABASE_USER_PASS}';
ALTER ROLE ${DATABASE_USER_NAME} SET client_encoding TO 'utf8';
ALTER ROLE ${DATABASE_USER_NAME} SET default_transaction_isolation TO 'read committed';
ALTER ROLE ${DATABASE_USER_NAME} SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE ${DATABASE_NAME} TO ${DATABASE_USER_NAME};
EOF
echo "${PSQL_COMMANDS}"

while read -r cmd; do
	sudo -u postgres -H -- psql -c "${cmd}"
done <<< "${PSQL_COMMANDS}"
unset PSQL_COMMANDS

cat > ${SEMESTERLY_HOME}/semesterly/local_settings.py << EOF
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
EOF

# Do first migrations
python manage.py makemigrations
python manage.py migrate

echo "STATUS: finished basic development environment setup :-)"

######### EXTENDED SETUP ###########

# Setup amazon textbooks for parsing
if [ -e ${HOME}/.amazon-product-api ]; then
	echo -e "\nexiting extended setup: ~/.amazon-product-api already exists."
	return 0
fi
cat > ${HOME}/.amazon-product-api << EOF
[Credentials]
access_key = AKIAJGUOXN3COOYBPTHQ
secret_key = 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
associate_tag = semesterly-20
EOF

######################################

# ... anything else?
