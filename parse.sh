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
echo $SEMESTERLY_HOME

master_log="${sem_home}/scripts/logs/master.log"

master_log="${sem_home}/scripts/logs/master.log"

declare -a schools=("jhu" "umd" "queens" "vandy" "gw" "umich" "chapman" "salisbury")

timestamp=$(echo $(date) | sed 's/[^0-9]//g')
echo "STARTING COURSE PARSERS ${timestamp}" >> ${master_log}

for school in "${schools[@]}"
do
	python ${sem_home}/manage.py ingest ${school} --term Fall --year 2017 --hide-progress-bar 2> "${sem_home}/scripts/${school}/logs/stderr_${timestamp}.log" 1> "${sem_home}/scripts/${school}/logs/stdout_${timestamp}.log"
	report_on_bad_exit $? ${school} "ingest"
	python ${sem_home}/manage.py digest ${school} --hide-progress-bar 2> "${sem_home}/scripts/${school}/logs/stderr_${timestamp}.log" 1> "${sem_home}/scripts/${school}/logs/stdout_${timestamp}.log"
	report_on_bad_exit $? ${school} "digest"
done
