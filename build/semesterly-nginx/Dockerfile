ARG djangoTag=0
ARG djangoImage=semesterly:$djangoTag


FROM nginx:latest

# This is just to create an alias
#FROM $djangoImage as latestDjango
RUN echo $djangoTag
RUN echo $djangoImage



# Need curl for health checks
RUN apt-get update && apt-get install -y curl && apt-get clean

COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./50x.html /usr/share/nginx/html/50x.html

# Get assets
RUN mkdir /code

RUN echo ${DJANGOTAG}
COPY --from=latestDjango /code/static /code/static
