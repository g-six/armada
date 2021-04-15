echo 'Request API: POST '$API_DOMAIN'/signup'
echo 'Request body:'
echo '   {
    "email": "'$1'",
    "password": "'"$2"'",
    "first_name": "'"$3"'",
    "last_name": "'"$4"'",
    "user_type": "'"$5"'"
}'
echo ""
echo "Response: "
curl -X POST $API_DOMAIN/signup -H 'content-type: application/json' \
    -d '{
        "email": "'$1'",
        "password": "'"$2"'",
        "first_name": "'"$3"'",
        "last_name": "'"$4"'",
        "user_type": "'"$5"'"
    }'
echo ""

