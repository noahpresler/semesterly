This builds the base image we use. To update:
```
docker build -t semesterly-base-py3 .

docker tag semesterly-base-py3:latest jhuopensource/semesterly-base-py3:latest

docker push jhuopensource/semesterly-base-py3:latest
```