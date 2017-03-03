#!/usr/bin/env bash

# Script to create school directory scaffolding

if [ "$1" == "" ]; then
	echo "usage: ./scaffolding <school_code>"
		exit
fi

school="${1}"

if [[ -z "${SEMESTERLY_HOME}" ]]; then
	>&2 echo -e "error: SEMESTERLY_HOME env variable is not set.\
		\nGo to semesterly home dir, and run \n\texport SEMESTERLY_HOME=\$(pwd) \
		\nConsider adding absolute path to ~/.bashrc"
	exit
fi

if [ -d "${SEMESTERLY_HOME}/scripts/${school}" ]; then
	>&2 echo "error: directory already exists for ${SEMESTERLY_HOME}/scripts/${school}"
	exit
fi

dir="${SEMESTERLY_HOME}/scripts/${school}"
mkdir "${dir}"
touch "${dir}/__init__.py"
touch "${dir}/config.json"
mkdir "${dir}/data"
mkdir "${dir}/logs"
touch "${dir}/${school}_courses.py"
touch "${dir}/${school}_textbooks.py"
touch "${dir}/${school}_evals.py"

echo "{\"school\": {\"code\": \"${school}\", \"name\":\"TODO\"}}" > ${dir}/config.json

echo -e "Finished creating rudimentary scaffolding for ${school}. Edit ${dir}/config.json"
