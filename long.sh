#!/bin/bash
while true
do 
	# Echo current date to stdout
	echo `date`
	# Echo 'error!' to stderr
	echo 'error!' >&2
	sleep 1
done
