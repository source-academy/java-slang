#! /usr/bin/env bash

set -e

JSDOC="node_modules/.bin/jsdoc"
TMPL="docs/jsdoc/templates/template"
DST="docs/pages"
MD="docs/md"
LIB="docs/lib"
SPECS="docs/specs"

main() {

    if [ "$1" == "prepare" ]; then
	prepare
    elif [ "$1" == "clean" ]; then
	clean
    elif [[ "$(git rev-parse --show-toplevel 2> /dev/null)" -ef "$PWD" ]]; then
        run
    else
        echo "Please run this command from the git root directory."
        false  # exit 1
    fi
}

run() {

    # Source landing page
    
    ${JSDOC} -r -t ${TMPL} \
	     -c docs/jsdoc/conf.json \
	     -R ${MD}/README_top.md \
	     -d ${DST}/ \
	     ${LIB}/empty.js
    
}

prepare() {
    run
    cp -r docs/images ${DST} ; \
    cd ${SPECS}; make; cp *.pdf ../source; cd ../..
}

clean() {

    rm -rf  ${DST}/*
    
}

main $1
