This builds the base image we use. To update:

docker build -t semesterly-base .
docker tag semesterly-base:latest jhuopensource/semesterly-base:latest
docker push jhuopensource/semesterly-base:latest
