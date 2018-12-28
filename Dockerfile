FROM ubuntu:xenial
RUN apt-get update


RUN apt-get install -y \
	python-pip \
	libpq-dev \
	libxml2-dev \
	libxslt-dev \
	git \
	curl

# Install node 8.x
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash -
RUN apt-get install -y nodejs

RUN mkdir /code
WORKDIR /code
ADD ./requirements.txt /code/
RUN pip install -r /code/requirements.txt

ADD ./package.json /code/
RUN npm install
