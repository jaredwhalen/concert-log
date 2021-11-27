#new entry
date=$1
band=$2
venue=$3
isMedia="${4:-false}"
setlistLink=$5
note=$6
mediaPath=""
if [ $isMedia = true ]
then
  mediaPath="media/$date/$band"
  mkdir -p "$mediaPath"
fi

newLine="${date},${band},${venue},${mediaPath},${setlistLink},${note}"

sed -i.bak 2i"$newLine" concerts.csv
echo "Added $band @ $venue on $date"
cat concerts.csv | python -c 'import csv, json, sys; print(json.dumps([dict(r) for r in csv.DictReader(sys.stdin)]))' | > src/data/concerts.json
