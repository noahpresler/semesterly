#!/usr/bin/env bash

# Script to create school directory scaffolding

if [[ -z "${SEMESTERLY_HOME}" ]]; then
  echo "SEMESTERLY_HOME env variable is not set"
  echo -e "go to semesterly home dir, and run \n\texport SEMESTERLY_HOME=\$(pwd)"
  echo "Consider adding to ~/.bashrc"
  exit
fi