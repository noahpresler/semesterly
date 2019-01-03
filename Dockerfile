FROM jhuopensource/semesterly-base:latest

RUN mkdir /code
WORKDIR /code

# Just adding basics
# ADD ./requirements.txt /code/
# ADD ./package.json /code/

# Add everything
ADD . /code/
COPY ./build/semesterly-nginx.conf /etc/nginx/sites-available/
RUN rm /etc/nginx/sites-enabled/*
RUN ln -s /etc/nginx/sites-available/semesterly-nginx.conf /etc/nginx/sites-enabled


RUN pip install -r /code/requirements.txt
RUN pip install psycopg2-binary

RUN npm install
RUN npm run build

