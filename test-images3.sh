#!/bin/bash
# Final batch of replacement candidates

candidates=(
# Volcano/Etna - need working volcano photo
"photo-1462332420958-a05d1e002413 volcano1"
"photo-1557456170-0cf4f4d0d362 volcano2"
"photo-1454789548928-9efd52dc4031 volcano3"
"photo-1439405326854-014607f694d7 mountain_lava"
# Paris catacombs - need underground/tunnel
"photo-1565711561500-49678a10a63f underground_confirm"
"photo-1520116468816-95b69f847357 tunnel"
# Edinburgh Royal Mile
"photo-1533929736458-ca588d08c8be edinburgh_confirm"
"photo-1548769948-e70e0d7b9e28 edinburgh_old"
# Cape Town departure / scenic
"photo-1516026672322-bc52d61a55d5 cape_aerial"
"photo-1566658283207-5ac81afae72a cape_sea"
# Coastal Nice departure
"photo-1507525428034-b723cf961d3e coast_nice"
# Sri Lanka Colombo
"photo-1552832230-c0197dd311b5 colombo_test"
# Colombo / Sri Lanka city
"photo-1578301978018-3005759f48f7 south_asia"
"photo-1590766940554-634b7261c3a4 sri_city"
# Cannes / French Riviera
"photo-1530122037265-a5f1f91d3b99 riviera_coast"
"photo-1533660139372-15b2d9b32562 med_coast"
# Florence Accademia / David / Art
"photo-1502602898657-3e91760cbb34 paris_art_test"
"photo-1578662996442-48f60103fc96 art_museum"
# Lisbon coast
"photo-1513735718075-2e2d8a2f3484 lisbon_coast_test"
"photo-1536363121591-a0f97c64e5e2 lisbon2"
# Costa Rica additional
"photo-1518182170546-07661fd94144 costa_confirm"
# Seychelles additional
"photo-1540979388789-6cee28a1cdc9 seych_confirm"
# Mumbai additional
"photo-1566552881560-0be862a7c445 mumbai_confirm"
# Buenos Aires additional
"photo-1589909202802-8f4aadce1849 ba_confirm"
# White Temple Chiang Rai
"photo-1528181304800-259b08848526 thailand_test"
# Bangkok arrival/river
"photo-1563492065599-3520f775eeed bangkok_river_test"
)

for entry in "${candidates[@]}"; do
  id=$(echo "$entry" | awk '{print $1}')
  ctx=$(echo "$entry" | awk '{print $2}')
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://images.unsplash.com/${id}?w=400&q=60")
  if [ "$code" = "200" ]; then
    echo "OK  ${id} (${ctx})"
  else
    echo "FAIL ${id} (${ctx}) -> ${code}"
  fi
done
