#!/usr/bin/env bash

report_on_bad_exit() {
	exit_status=$1
	school=$2
	cmd=$3
	if [ ${exit_status} = 0 ]; then
		return
	fi
	timestamp=$(date)
	message="\nEXIT FAILURE ${exit_status} ${timestamp} from ${school} ${cmd}\n"
	echo -e "${message}" >> "${SEMESTERLY_HOME}/scripts/logs/master.log"
}

sem_home="${SEMESTERLY_HOME:-/home/django}"
export SEMESTERLY_HOME=${sem_home}

declare -a schools=("jhu" "umd" "queens" "vandy" "gw" "umich" "chapman" "salisbury")

for school in "${schools[@]}"
do
	python ${sem_home}/manage.py ingest ${school} --term Fall --year 2017
	report_on_bad_exit $? ${school} "ingest"
	python ${sem_home}/manage.py digest ${school}
	report_on_bad_exit $? ${school} "digest"
done
