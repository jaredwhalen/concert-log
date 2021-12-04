message="${1:-Update!}"

cat concerts.csv | python -c 'import csv, json, sys; print(json.dumps([dict(r) for r in csv.DictReader(sys.stdin)]))' > src/data/concerts.json
npm run build

git add .
git commit -m "$message"
git push origin main

git checkout gh-pages
git rebase main
git push origin gh-pages
node gh-pages.js
git checkout main
