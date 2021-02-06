FROM python:3.6
RUN apt-get update


RUN apt-get install -y \
	libpq-dev \
	libxml2-dev \
	libxslt-dev \
	git \
	curl

# Install node 10.x
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt-get install -y nodejs

# This saves some build time by installing base requirements
ADD ./requirements_base.txt /tmp
RUN pip install -r /tmp/requirements_base.txt