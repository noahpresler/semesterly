FROM nginx:latest

# Need curl for health checks
RUN apt-get update && apt-get install -y curl && apt-get clean

COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./50x.html /usr/share/nginx/html/50x.html

# Get assets
RUN mkdir /code
COPY --from=896112238827.dkr.ecr.us-east-1.amazonaws.com/semesterly:latest /code/static /code/static