#!/bin/bash
echo ""
echo ""
echo 'curl -X DELETE '$API_DOMAIN'/user/'$1 "-H 'authorization: bearer '\$BEARER"
echo ""
echo "Response:"
curl -X DELETE $API_DOMAIN/user/$1 -H 'authorization: bearer '$BEARER
echo ""
