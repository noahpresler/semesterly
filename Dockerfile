FROM jhuopensource/semesterly-base:latest

RUN mkdir /code
WORKDIR /code

# Just adding basics
# ADD ./requirements.txt /code/
# ADD ./package.json /code/

# Add everything
ADD . /code/

RUN pip install -r /code/requirements.txt

RUN npm install
RUN npm run build