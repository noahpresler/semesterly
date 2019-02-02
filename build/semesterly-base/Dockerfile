FROM ubuntu:bionic

ADD ./requirements_base.txt /tmp

RUN apt-get update && \
    apt-get install -y \
	python-pip \
	libpq-dev \
	libxml2-dev \
	libxslt-dev \
	git \
	curl \
	nginx \

    # Install node 8.x
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash - && \
    apt-get install -y nodejs \

    # This saves some build time by installing base requirements
RUN pip install -r /tmp/requirements_base.txt
