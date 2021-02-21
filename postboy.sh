#!/bin/bash
source ./.aliases
if [ "$1" = "signup" ]; then
    bash-scripts/signup.sh $2 "$3" "$4" "$5"

elif [ "$1" = "login" ]; then
    bash-scripts/login.sh "$2" "$3"

elif [ "$1" = "me" ]; then
    echo "curl "$API_DOMAIN'/me -H '"'authorization: bearer '"
    curl $API_DOMAIN/me -H 'authorization: bearer '$BEARER

elif [ "$1" = "delete-user" ]; then
    bash-scripts/delete-user.sh "$2"
else
    echo "Nothing executed"
fi
echo ""
