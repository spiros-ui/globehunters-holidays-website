#!/bin/bash
# Test replacement Unsplash photo IDs - organized by context
# Each line: candidate_id context

candidates=(
# Desert / Arabian - for Dubai desert safari, Abu Dhabi desert, Doha desert
"photo-1549944850-84e00be4203b desert_safari"
"photo-1542401886-65d6c61db217 desert_dunes"
"photo-1518709268805-4e9042af9f23 abu_dhabi_desert"
"photo-1512100356356-de1b84283e18 desert_landscape"
# Eiffel Tower / Paris
"photo-1431274172761-fca41d930114 eiffel_tower"
"photo-1543349689-9a4d426bee8e eiffel_tower2"
"photo-1500039436846-25ae2f11882e paris_night"
# Louvre / Museum
"photo-1550340499-a6c60fc8287c louvre_museum"
"photo-1541264161754-586d5b4b29f7 louvre_inside"
# Paris food - cheese/wine
"photo-1500259571355-332da5cb07aa cheese_wine"
"photo-1414235077428-338989a2e8c0 food_wine"
# Amsterdam bike
"photo-1551882547-ff40c63fe5fa amsterdam_bike"
"photo-1558981806-ec527fa84c39 amsterdam_bikes"
# Moulin Rouge / Paris cabaret
"photo-1508739773434-c26b3d09e071 nightlife_cabaret"
# Athens / Greek
"photo-1555993539-1732b0258235 athens"
"photo-1603565816030-6b389eeb23cb athens2"
# Santorini volcano
"photo-1504512485720-7d83a16ee930 volcano_hot_springs"
# Milan fashion
"photo-1513581166391-887a96ddeafd milan"
"photo-1610016302534-6f67f1c968d8 milan2"
# Prague Jewish Quarter
"photo-1541849546-216549ae216d prague"
"photo-1592906209472-a36b1f3782ef prague2"
# Madrid Royal Palace
"photo-1543783207-ec64e4d95325 madrid"
# Edinburgh Castle
"photo-1577277625082-36df4915ebeb edinburgh_castle"
"photo-1597220869811-e2ff0df9daa9 edinburgh_castle2"
# Arthur's Seat Edinburgh
"photo-1567160813903-15e843e66786 arthurs_seat"
# Toledo Spain
"photo-1539037116277-4db20889f2d4 spain_toledo"
"photo-1504019347908-b45f9b0b8dd5 medieval_city"
# Brandenburg Gate Berlin
"photo-1560969184-10fe8719e047 berlin_gate"
"photo-1560930950-e6cac7d7b3e8 berlin_gate2"
# Wadi Rum desert
"photo-1547483238-2cbf881a559f wadi_rum"
"photo-1474540412665-1cdae210ae6b wadi_rum2"
# Singapore sentosa
"photo-1565967511849-76a60a516170 singapore_night"
"photo-1508964942454-1a56651d54ac singapore_gardens"
# Hong Kong
"photo-1506973035872-a4ec16b8e8d9 hong_kong"
"photo-1518599904199-0ca897819ddb hong_kong2"
# Disney theme park
"photo-1597466599360-3b9775841aec disney_theme"
"photo-1580852615675-1cdfba4e2aa1 theme_park"
# Angkor Wat
"photo-1508004680771-708b02aabdc0 angkor_wat"
"photo-1600093112277-63e6ebfec6a4 angkor_wat2"
# Night safari / wildlife
"photo-1474511320723-9a56873867b5 wildlife"
"photo-1535338454528-1b4a71a2ec7d wildlife2"
# Giant tortoise Seychelles
"photo-1590001155093-a3c66ab0c3ff tortoise"
# Jaipur India
"photo-1524492412937-b28074a5d7da jaipur"
# Bali Uluwatu
"photo-1555400038-63f5ba517a47 bali"
"photo-1573790387438-4da905039392 bali2"
# Nusa Penida Bali
"photo-1488085061387-422e29b40080 tropical_island"
# Meteora Greece
"photo-1510884495561-5778e5bbf8ef meteora"
# Last Supper Milan
"photo-1545989253-02cc26577d88 painting_art"
# Bangkok river
"photo-1528181304800-259b08848526 bangkok"
"photo-1552465011-b4e21bf6e79a bangkok2"
# Sydney beach / Bondi
"photo-1523482580672-f109ba8cb9be sydney_beach"
"photo-1528072164453-f4e8ef0d475a bondi_beach"
# Dublin Guinness
"photo-1549918864-48ac978761a4 dublin"
# Dublin Trinity
"photo-1560413658-4e0ca37f4547 dublin_trinity"
# French Riviera / Nice
"photo-1533104816931-20fa691ff6ca nice"
"photo-1491166617655-0723a0999cfc nice2"
# French Riviera Cannes
"photo-1537519646099-328cdb7eb98a cannes"
# French Riviera departure
"photo-1504803900752-c2051699d0e9 coastal_departure"
# Sicily
"photo-1523531294919-4bcd7c65e216 sicily"
"photo-1534308983496-4fabb1a015ee sicily2"
# Mount Etna
"photo-1474620249516-07fa22b3dc1e volcano"
# Versailles Palace
"photo-1544620347-c4fd4a3d5957 versailles"
"photo-1462400362591-162324fa5f6d palace_gardens"
# Florence
"photo-1541370976299-4d24ebbc9077 florence"
"photo-1476362555312-ab9e108a0b7e florence2"
# Florence Accademia
"photo-1544004658-b1f1bcbc7be6 florence_art"
# Florence arrival
"photo-1515542622106-78bda8ba0e5b florence_bridge"
# Kuala Lumpur day trip
"photo-1596422846543-75c6fc197f07 kl"
"photo-1508062878650-88b52897f298 kl2"
# Pompeii ruins
"photo-1515859005217-8a1f08870f59 ruins"
# Van Gogh Museum Amsterdam
"photo-1578301978693-85fa9c0320b9 van_gogh_museum"
# Keukenhof tulips
"photo-1490750967868-88aa4f44baee tulips"
# Lisbon coast
"photo-1548707309-dcebeab426c8 lisbon_coast"
# Cesky Krumlov
"photo-1555592395-72c84d72e8e6 czech_town"
# Marienplatz Munich
"photo-1577462469402-1c3e4a29d51c_fail munich"
"photo-1595867818082-083862f3d630 munich2"
# Irish coast
"photo-1564959130747-897a8e1af3ee irish_coast"
# Giant's Causeway Ireland
"photo-1533668873951-40e7ab57ef30 causeway"
# Edinburgh Royal Mile
"photo-1583455722-cbe5b51ae3d1 royal_mile"
# Edinburgh tours
"photo-1533929736458-ca588d08c8be edinburgh_street"
# Phuket Big Buddha
"photo-1552465011-b4e21bf6e79a phuket"
# White Temple Chiang Rai
"photo-1504214208698-ea1916a2195a thai_temple"
"photo-1563492065599-3520f775eeed thai_temple2"
# Jet boat NZ
"photo-1507699622108-4be3abd695ad nz_adventure"
"photo-1469854523086-cc02fe5d8800 nz_road"
# Hobbiton NZ
"photo-1578269174936-2709b6aeb913 hobbiton"
# HK island
"photo-1594973782943-3314fe063f68 hk_cable"
# Vietnam Saigon
"photo-1528127269322-539801943592 vietnam"
"photo-1557750255-c76072a7aad1 vietnam2"
# Cambodia
"photo-1539370278-1fdb2d7d1284 cambodia"
# Sri Lanka Sigiriya
"photo-1586901533048-0e856dff2c0d sri_lanka"
# Istanbul
"photo-1541432901042-2d8bd64b4a9b istanbul"
"photo-1524231757912-21f4fe3a7200 istanbul2"
# Whirling Dervishes
"photo-1529528744093-6f8abeee7403 dervishes"
# Vienna Belvedere
"photo-1516550893923-42d28e5677af vienna"
"photo-1573599852326-2d4da0bbe613 vienna2"
# Marrakech gardens
"photo-1489749798305-4fea3ae63d43 marrakech"
# Cancun departure
"photo-1552074284-5e88ef1aef18 cancun"
# Cape Town
"photo-1580060839134-75a5edca2e99 cape_town"
"photo-1576485290814-1c72aa4bbb8e cape_town2"
# Cape Town departure
"photo-1500534314263-a834e5ee034b beach_departure"
# Zanzibar Stone Town
"photo-1519659528534-7fd733a832a0 zanzibar"
# Zanzibar departure
"photo-1501179691627-eeaa65ea017c beach_departure2"
# Budapest departure
"photo-1549923746-c502d488b3ea budapest"
# Sri Lanka arrival / Colombo
"photo-1554939437-ecc492c67b78 colombo"
# Sacred Valley Peru
"photo-1526392060635-9d6019884377 peru"
"photo-1580619305218-8423a7ef79b4 peru2"
# Peru departure
"photo-1531761535209-180857e963b9 peru_departure"
# Croatia departure
"photo-1555990793-da11153b2473 croatia"
# Costa Rica
"photo-1518182170546-07661fd94144 costa_rica"
# Dubai Palm/Atlantis
"photo-1512453979798-5ea266f8880c dubai_skyline"
# Phuket Old Town
"photo-1559314809-0d155014e29e phuket_food"
# Isla Mujeres Cancun
"photo-1510097467424-192d713fd8b2 cancun_isla"
# Hoover Dam
"photo-1489447068241-b3490214e879 dam"
# San Francisco Chinatown
"photo-1521747116042-5a810fda9664 chinatown"
# Chicago Millennium Park
"photo-1477959858617-67f85cf4f1df chicago"
# Buenos Aires
"photo-1589909202802-8f4aadce1849 buenos_aires"
# Cusco Peru
"photo-1415804941573-a9ed42cf76ae cusco"
# Las Vegas
"photo-1581351721010-8cf859cb14a4 vegas"
# Orlando Disney
"photo-1575713895455-60e8a4e0a8d5 orlando_disney"
# Mumbai
"photo-1566552881560-0be862a7c445 mumbai"
# Gold Coast Australia Zoo
"photo-1459262838948-3e2de6c1ec80 zoo"
# Jakarta monument
"photo-1555899434-94d1368aa7af monument"
# Victoria Seychelles tour
"photo-1540979388789-6cee28a1cdc9 seychelles"
# Paris Catacombs
"photo-1556902918-461bfd32c388 catacombs"
# Block printing India
"photo-1534308983496-4fabb1a015ee art_workshop"
"photo-1533905442393-e1ef5631e926 workshop"
# Ho Chi Minh French colonial
"photo-1583417319070-4a69db38a482 colonial_building"
)

echo "Testing ${#candidates[@]} photo candidates..."
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
