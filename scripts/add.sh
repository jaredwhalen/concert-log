export PATH="/usr/local/opt/gnu-sed/libexec/gnubin:$PATH"
#new entry
date=$1
band=$2
venue=$3
isMedia="${4:-false}"
setlist_link=$5
note=$6
dropbox_path=""
public_url=""
if [ $isMedia = true ]
then
  dropbox_path="Apps/console.log-media/$date/$band"

  curl -X POST https://api.dropboxapi.com/2/files/create_folder_v2 \
    --header "Authorization: Bearer $DROPBOX_API" \
    --header "Content-Type: application/json" \
    --data "{\"path\": \"/$dropbox_path\",\"autorename\": false}"

    echo "LINE BREAK"

  public_url=$(curl -X POST https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings \
    --header "Authorization: Bearer $DROPBOX_API" \
    --header "Content-Type: application/json" \
    --data "{\"path\": \"/$dropbox_path\",\"settings\": {\"audience\": \"public\",\"access\": \"viewer\",\"requested_visibility\": \"public\",\"allow_download\": true}}" | \
    python2 -c "import sys, json; print json.load(sys.stdin)['url']")
fi

newLine="${date},${band},${venue},${public_url},${setlist_link},${note}"

sed -i.bak 2i"$newLine" concerts.csv
echo "Added $band @ $venue on $date"
cat concerts.csv | python -c 'import csv, json, sys; print(json.dumps([dict(r) for r in csv.DictReader(sys.stdin)]))' > src/data/concerts.json
