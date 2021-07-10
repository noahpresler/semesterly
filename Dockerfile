FROM scabrej1/semesterly-py3_8-base:latest
# sgerli/horariotec-base:
RUN mkdir /code
WORKDIR /code

# Just adding basics
# ADD ./requirements.txt /code/
# ADD ./package.json /code/

# Add everything
ADD . /code/


# Nginx moved out
# COPY ./build/semesterly-nginx.conf /etc/nginx/sites-available/
# RUN rm /etc/nginx/sites-enabled/*
# RUN ln -s /etc/nginx/sites-available/semesterly-nginx.conf /etc/nginx/sites-enabled
# RUN echo "daemon off;" >> /etc/nginx/nginx.conf

# Use environment based config
COPY ./build/local_settings.py /code/semesterly/local_settings.py

# Add parser script
COPY ./build/run_parser.sh /code/run_parser.sh

RUN pip3 install -r /code/requirements.txt
# This is needed on newer ubuntu
RUN pip3 install psycopg2-binary

# Install node 14.x
# RUN pip3 install -r /tmp/requirements_base.txt
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install -y nodejs

# Install package.json dependencies
RUN npm install
RUN npm run build
