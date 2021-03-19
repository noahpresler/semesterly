ARG DJANGOTAG
FROM nginx:latest

# Need curl for health checks
RUN apt-get update && apt-get install -y curl && apt-get clean

COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./50x.html /usr/share/nginx/html/50x.html

# Get assets
RUN mkdir /code

RUN echo ${DJANGOTAG}
COPY --from=semesterly.azurecr.io/semesterly:4 /code/static /code/static
