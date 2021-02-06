This builds the base image we use. To update:

docker build -t horariotec-base .
docker tag horariotec-base:latest sgerli/horariotec-base:latest
docker push sgerli/horariotec-base:latest
