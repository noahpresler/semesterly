#!/usr/bin/env bash

report_on_bad_exit() {
	exit_status=$1
	school=$2
	cmd=$3
	if [ ${exit_status} = 0 ]; then
		return
	fi
	echo -e "\nEXIT FAILURE ${exit_status} from ${school} ${cmd}\n" >> ${SEMESTERLY_HOME}/script/logs/master.log
}

sem_home="${SEMESTERLY_HOME:-/home/django}"
export SEMESTERLY_HOME=${sem_home}

declare -a schools=("jhu" "umd" "queens" "vandy" "gw" "umich" "chapman" "salisbury")

for school in "${schools[@]}"
do
	python ${sem_home}/manage.py ingest ${school}
	report_on_bad_exit $? ${school} "ingest"
	python ${sem_home}/digest.py digest ${school}
	report_on_bad_exit $? ${school} "digest"
done
