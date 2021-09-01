#FROM nginx:latest
#Use ACR Image due to pull rate issues
FROM semesterly.azurecr.io/nginx:latest

# Need curl for health checks
RUN apt-get update && apt-get install -y curl && apt-get clean

COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./50x.html /usr/share/nginx/html/50x.html

# Get assets
RUN mkdir /code
COPY --from=semesterly.azurecr.io/semesterly:latest /code/static /code/static
