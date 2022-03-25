export PATH="/usr/local/opt/gnu-sed/libexec/gnubin:$PATH"


echo "When was the show?"
echo -n "YYYY-MM-DD: "
read -r date

echo "Where was the show?"
echo -n "Venue name: "
read -r venue

add_band () {
  echo "Who did you see?"
  echo -n "Band name: "
  read -r band

  echo "Do you have media?"
  read -p "Create Dropbox folder: (y/n)? " isMedia

  echo "Setlist list?"
  echo -n "URL: "
  read -r setlist_link

  echo "Any notes?"
  echo -n "Note: "
  read -r note

  echo "Add another band for same show?"
  read -p "Repeat: (y/n)? " repeat

  case "$repeat" in
    y|Y )
      generate_row
      add_band
      ;;
    n|N )
      generate_row
      ;;
    * )
      generate_row
      ;;
  esac
}

generate_row () {

  echo $isMedia
  echo "Added $band @ $venue on $date"


  dropbox_path=""
  public_url=""

  if [ $isMedia = "y" ]
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
}

add_band
