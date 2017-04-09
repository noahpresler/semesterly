#!/usr/bin/env bash

report_on_bad_exit() {
	exit_status=$1
	school=$2
	cmd=$3
	if [ ${exit_status} = 0 ]; then
		return
	fi
	message="\nEXIT FAILURE ${exit_status} from ${school} ${cmd}\n"
	echo -e "${message}" >> "${SEMESTERLY_HOME}/scripts/logs/master.log"
}

sem_home="${SEMESTERLY_HOME:-/home/django}"
export SEMESTERLY_HOME=${sem_home}

declare -a schools=("jhu" "umd" "queens" "vandy" "gw" "umich" "chapman" "salisbury")

for school in "${schools[@]}"
do
	python ${sem_home}/manage.py ingest --textbooks ${school}
	report_on_bad_exit $? ${school} "ingest textbooks"
	python ${sem_home}/manage.py digest --textbooks ${school}
	report_on_bad_exit $? ${school} "digest textbooks"
done
