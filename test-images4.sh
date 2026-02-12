#!/bin/bash
# Final specific replacements needed

candidates=(
# Lisbon coast (Cascais/Estoril)
"photo-1555881400-74d7acaacd8b lisbon_coast"
"photo-1548515944-7e7ec3a3d565 lisbon_coast2"
"photo-1558981359-219d6364c9c8 lisbon_coast3"
# Cape Town departure view
"photo-1516026672322-bc52d61a55d5 cape_confirm"
# Edinburgh Arthur's Seat
"photo-1477346611705-65d1883cee1e hill_climb"
"photo-1501854140801-50d01698950b nature_hike"
# Edinburgh departure
"photo-1533929736458-ca588d08c8be edinburgh_depart"
# Irish Guinness/Culture
"photo-1549918864-48ac978761a4 irish_confirm"
# Dublin coast
"photo-1533743983669-94fa5c4338ec irish_coast"
# Art museum general (for Van Gogh, Prado, etc. re-use)
"photo-1578662996442-48f60103fc96 art_museum_confirm"
# Temple generic for Vietnam/SE Asia
"photo-1583417319070-4a69db38a482 temple_colonial"
# Victoria Seychelles
"photo-1540979388789-6cee28a1cdc9 seychelles_confirm"
# Block printing / marble inlay India crafts
"photo-1513364776144-60967b0f800f crafts"
# Night safari
"photo-1474511320723-9a56873867b5 wildlife_confirm"
# Jaipur
"photo-1524492412937-b28074a5d7da jaipur_confirm"
# Agra / Taj Mahal
"photo-1548013146-72479768bada taj_confirm"
# Cusco walking tour
"photo-1531065208531-4036c0dba3ca cusco_confirm"
# Buenos Aires walking
"photo-1589909202802-8f4aadce1849 ba_confirm"
# Berlin Museum Island
"photo-1560969184-10fe8719e047 berlin_confirm"
# Istanbul departure
"photo-1541432901042-2d8bd64b4a9b istanbul_confirm"
# Phuket heritage
"photo-1504214208698-ea1916a2195a phuket_confirm"
# Colombo Sri Lanka
"photo-1578301978018-3005759f48f7 colombo_confirm"
# Sri Lanka cultural/Sigiriya
"photo-1586901533048-0e856dff2c0d sigiriya"
# Lake Bled Slovenia
"photo-1507501336603-6e31db2be093 bled"
# Water park
"photo-1499793983394-12ceb1ff0e06 waterpark"
"photo-1504196606672-aef5c9cefc92 waterpark2"
# Hoover Dam
"photo-1489447068241-b3490214e879 dam_confirm"
# Bondi Sydney
"photo-1528072164453-f4e8ef0d475a bondi_confirm"
# Amman Jordan
"photo-1547483238-2cbf881a559f jordan_confirm"
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
