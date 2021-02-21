#!/bin/bash
echo ""
echo 'curl -X POST '$API_DOMAIN'/login \'
echo "     -H 'content-type: application/json' \\"
echo '     -d '"'"'{"email": "'$1'", "password": "'"$2"'"}'
curl -X POST $API_DOMAIN/login -H 'content-type: application/json' \
        -d '{"email": "'$1'", "password": "'"$2"'"}'
echo ""