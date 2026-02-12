#!/bin/bash
# Test more replacement candidates for the failed ones and missing topics

candidates=(
# Meteora Greece clifftop monasteries
"photo-1510227272981-87123e468793 meteora"
"photo-1530841377377-3ff06c0ca713 meteora2"
"photo-1602703316364-e3e7f08f1b2c meteora3"
# Volcano/Etna
"photo-1476003406664-4a2d5de89e22 volcano"
"photo-1562864764-73b7f8a5a826 volcano2"
# Painting art / Last Supper
"photo-1578662996442-48f60103fc96 painting"
"photo-1541367777708-7905fe3296c0 painting2"
# Paris catacombs
"photo-1528191776388-7e98b06b7a6b catacombs"
"photo-1565711561500-49678a10a63f underground"
# Tulips / Keukenhof
"photo-1455659817273-f96807779a8a tulips"
"photo-1468327768560-75b778cbb551 tulips2"
# Czech Krumlov
"photo-1519677100203-a0e668c92439 czech"
"photo-1560783461-5c81f5d5b3e2 medieval_europe"
# Munich Marienplatz
"photo-1534313314376-a72289b6181e munich"
"photo-1467269204594-9661b134dd2b munich2"
# Irish coast
"photo-1533743983669-94fa5c4338ec irish"
"photo-1500150124003-88ac8f1bde06 green_coast"
# Giant's Causeway
"photo-1513836279014-a89f7a76ae86 causeway"
"photo-1500042600524-97b1ec7eaacc causeway2"
# Edinburgh Royal Mile
"photo-1525310534566-4a51c08a04b9 edinburgh"
"photo-1544944379-3d0e3e3e3e3e edinburgh2"
# Dublin Trinity
"photo-1495562569060-2eec283d3391 trinity"
"photo-1567619067250-6a3e86e8c9e6 library"
# Cannes Film
"photo-1546412414-e1885e51148b cannes"
"photo-1517627043994-b991abb62fc8 coast"
# French Riviera departure
"photo-1499678329028-101435549a4e airport"
"photo-1548199973-03cce0bbc87b coastal"
# Florence art/Accademia
"photo-1543429776-2782fc8e5a9c art"
"photo-1565537422174-cd9e8e27d9a0_test edinburgh2b"
# Cusco Peru
"photo-1526481280693-3bfa7568e0f8 cusco"
"photo-1531065208531-4036c0dba3ca cusco2"
# Orlando theme park
"photo-1568454537842-d933259bb258 theme_park"
"photo-1585320806297-9794b3e4eeae theme_park2"
# Colombo Sri Lanka
"photo-1583600267865-9a9c28e67fbd colombo"
# Workshop cultural
"photo-1513364776144-60967b0f800f workshop"
"photo-1517411032315-54ef2cb783bb workshop2"
# Lisbon coast
"photo-1548515944-f3554ba49ca4 lisbon"
"photo-1513735718075-2e2d8a2f3484 coastal"
# Cape Town departure
"photo-1562206443-9b1e82a5e58e cape_departure"
# Cambodia temples
"photo-1552465011-b4e21bf6e79a cambodia_test"
"photo-1503503330041-4e5dc9d02f2a temple"
# Dervishes Turkey
"photo-1541432901042-2d8bd64b4a9b dervishes_alt"
"photo-1530841377377-3ff06c0ca713 dervishes2"
# Hobbiton additional test
"photo-1578269174936-2709b6aeb913 hobbiton_confirm"
# Sigiriya Lion Rock
"photo-1586901533048-0e856dff2c0d sigiriya_confirm"
# Luxor Egypt
"photo-1568322445389-f64ac2515020 luxor"
"photo-1539650116574-8efeb43e2750 egypt"
# Phuket heritage
"photo-1504214208698-ea1916a2195a phuket_heritage"
# Sri Lanka departure
"photo-1519659528534-7fd733a832a0 sri_departure"
)

echo "Testing ${#candidates[@]} additional photo candidates..."
echo ""

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
