FROM scabrej1/semesterly-base:latest

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

RUN pip install -r /code/requirements.txt
# This is needed on newer ubuntu
RUN pip install psycopg2-binary

RUN npm install
RUN npm run build

