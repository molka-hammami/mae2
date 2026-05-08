const EMAIL = "mae.assurances@mae.tn";

const REGION_COLORS = {
  "Tunis & Grand Tunis": "#166534",
  "Nord / Nord-Ouest": "#3f8d69",
  "Cap Bon / Sahel": "#65b36f",
  Centre: "#a9d798",
  "Sud / Sud-Ouest": "#e8be59",
  "Sud / Sud-Est": "#e97667",
};

const GOVERNORATE_COORDS = {
  Tunis: [36.8065, 10.1815],
  Gafsa: [34.425, 8.7842],
  Siliana: [36.0849, 9.3708],
  Mahdia: [35.5047, 11.0622],
  Jendouba: [36.5011, 8.7802],
  Manouba: [36.8078, 10.1011],
  Zaghouan: [36.4029, 10.1429],
  Kebili: [33.7044, 8.969],
  Kasserine: [35.1676, 8.8365],
  Tozeur: [33.9197, 8.1335],
  Tataouine: [32.9297, 10.4518],
  "Sidi Bouzid": [35.0382, 9.4849],
  Bizerte: [37.2744, 9.8739],
  Sousse: [35.8256, 10.6369],
  Sfax: [34.7406, 10.7603],
  Kairouan: [35.6781, 10.0963],
  Gabes: [33.8815, 10.0982],
  Beja: [36.7256, 9.1817],
  Nabeul: [36.4513, 10.7357],
  Monastir: [35.7643, 10.8113],
  Kef: [36.1822, 8.7148],
  Ariana: [36.8625, 10.1956],
  "Ben Arous": [36.7531, 10.2189],
  Medenine: [33.3549, 10.5055],
};

const AGENCY_ROWS = `
Tunis|Tunis & Grand Tunis|Tunis|Tunis - Place Barcelone|5 place monji bali 1055 tunis|94519668 / 93699631
Gafsa|Sud / Sud-Ouest|Gafsa|Gafsa|Av. Habib Bourguiba 2100 Gafsa|93699710 / 93699651
Gafsa|Sud / Sud-Ouest|Gafsa|Gafsa III|Av. Jamel Abdenaceur Imm. La Lune 2eme Etage Gafsa 2100|97012259
Gafsa|Sud / Sud-Ouest|Gafsa|Gafsa II|Av palestine radhouani gafsa-cite enour|92608870 / 99892470
Siliana|Nord / Nord-Ouest|Siliana|Siliana|25, Av. Habib Bourguiba 6100 Seliana|93699713 / 93699653
Mahdia|Cap Bon / Sahel|Mahdia|Mahdia|36, Av. Habib Bourguiba 5100 Mahdia|93699714 / 93699654
Mahdia|Cap Bon / Sahel|Mahdia|Chebba|Rue med ali chebba mahdia 5170|99560790
Mahdia|Cap Bon / Sahel|Mahdia|Boumerdes|AV HBIB Bourguiba|98309327 / 73620854
Mahdia|Cap Bon / Sahel|Mahdia|ELJEM|Av. Taieb Mhiri, El Jem 5160|99455970
Jendouba|Nord / Nord-Ouest|Jendouba|Jendouba|5, Rue 1er Juin, Place de la Republique - Jendouba 8100|92942182 / 93699656
Jendouba|Nord / Nord-Ouest|Jendouba|Ghadimaou|Ghardimaou 8160|22519131
Jendouba|Nord / Nord-Ouest|Jendouba|Boussalem|Avenue Habib Bourguiba Bousalem 8170|92159330 / 92159330
Manouba|Tunis & Grand Tunis|Manouba|Manouba|111, Avenue Habib Bourguiba - Manouba 2010|92059366 / 93699665
Manouba|Tunis & Grand Tunis|Manouba|Manouba II|4, Avenue 2 Mars -Manouba- 2010|97440964
Manouba|Tunis & Grand Tunis|Manouba|Manouba 823|39 Av Mongi Slim Bardo 2000|71223673 / 96823823
Zaghouan|Cap Bon / Sahel|Zaghouan|Zaghouan|Avenue Independance - 1100 Zaghouane|93699690 / 93699630
Kebili|Sud / Sud-Ouest|Kebili|Kebili|Avenue nalout kebili 4200|98943097
Kasserine|Centre|Kasserine|Kasserine|Avenue Habib Bourguiba Kasserine 1200|54521538
Kasserine|Centre|Kasserine|Feriana|Avenue Habib Bourguiba Feriana 1240|98448668
Kasserine|Centre|Kasserine|Sbeitla|Av Abdelaziz Sbiki Kasserine 1200|98305466
Tozeur|Sud / Sud-Ouest|Tozeur|Tozeur|Avenue Farhat Hached TOZEUR 2200|98283045
Tataouine|Sud / Sud-Est|Tataouine|Tataouine|12, Av.hedi Chaker - 3200 Tataouine|93699670 / 93699730
Sidi Bouzid|Centre|Sidi Bouzid|Sidi Bouzid|Adresse rue 20 mars 9100 sidi bouzid|76622163 / 92553844
Tunis|Tunis & Grand Tunis|Tunis|Bab Bnet|34, Bd Bab Benat - Tunis|93699731 / 93699635
Tunis|Tunis & Grand Tunis|Tunis|Al Djazira|19 Bis, Rue Djazira - Tunis|93699727 / 93699640
Tunis|Tunis & Grand Tunis|Tunis|Jean Jaures|20 Av. Jean jaures 1001|93699642 / 93699702
Tunis|Tunis & Grand Tunis|Tunis|Lafayette|15 Bis, Rue du Koweit tunis belvedere 1002|93699763 / 93699643
Tunis|Tunis & Grand Tunis|Tunis|Bardo|Imm. Bardo Center 2000 Bardo|93106837 / 93699706
Tunis|Tunis & Grand Tunis|Tunis|Les Berges du Lac|29 rue du Lac Turkhana residence les lilas les berges du Lac 1053|93699717 / 93699657
Tunis|Tunis & Grand Tunis|Tunis|Manar|Residence Hannibal, Rue 7400 Manar I 2092|92782116 / 93699658
Tunis|Tunis & Grand Tunis|Tunis|El Kram|75, Avenue Med V - Kram 2089|93699671 / 93699669
Tunis|Tunis & Grand Tunis|Tunis|Ezzouhour|68 Bis, Rue Sabra et Chatila Cite Ezzouhour 2052 Tunis|93548150
Tunis|Tunis & Grand Tunis|Tunis|Sidi hessine|10 rue 4883 Sidi Hcine 1095|99506209
Tunis|Tunis & Grand Tunis|Tunis|El Ouerdia|89 Rue du Sahel Montfleury Tunis 1009|97066864
Tunis|Tunis & Grand Tunis|Tunis|Ettadhamen|Km 4 Route de Bizerte Cite Intillaka 1064|98327192
Tunis|Tunis & Grand Tunis|Tunis|L'Aouina|Rue Mongi Slim Residence Salma App. 12 L'Aouina 2036|98274234
Tunis|Tunis & Grand Tunis|Tunis|El Mechtel|37 Rue El Khartoum Belvedere 1002 Tunis|96516765 / 93699769
Tunis|Tunis & Grand Tunis|Tunis|La Goulette|34 Avenue Bourguiba La Goulette - 2060|93106837 / 99964814
Tunis|Tunis & Grand Tunis|Tunis|Lac II|Rez de chausse dream residence cite des pins les berges du lac ii 1053|93699687 / 93108018
Tunis|Tunis & Grand Tunis|Tunis|La Marsa|75 Angle rue ben cherifia la marsa 2070|97980481
Tunis|Tunis & Grand Tunis|Tunis|Ezahrouni|18 Rue 4667 EZZahrouni 2051 Tunis|93548150
Tunis|Tunis & Grand Tunis|Tunis|Mutuelleville|81 Av Jugurtha Mutuelleville Tunis 1082|54022714
Tunis|Tunis & Grand Tunis|Tunis|Ain Zaghouan|Ain Zaghouen Nord|50304163
Bizerte|Nord / Nord-Ouest|Bizerte|Bizerte|8, Rue Moncef Bey 7000 Bizerte|92593380 / 93699632
Bizerte|Nord / Nord-Ouest|Bizerte|Menzel Bourguiba|83, Avenue de l'independance Menzel Bourguiba 7050|94459140
Sousse|Cap Bon / Sahel|Sousse|Sousse 1|6, Bd M'hamed Maarouf 4000 Sousse|92516740 / 93699633
Sousse|Cap Bon / Sahel|Sousse|Sousse|Residence Sidi Dhaher, Khezama Hammam - Sousse 4051|99080587 / 93699648
Sousse|Cap Bon / Sahel|Sousse|M'saken|Av. 20 Mars M'Saken 4070|93699693 / 93699662
Sousse|Cap Bon / Sahel|Sousse|Sousse Erriadh|Immeuble CARTHAGO Route de ceinture - Sousse Erriadh - 4023|99516819
Sousse|Cap Bon / Sahel|Sousse|Sahloul|Av yasser arafat imb jaim bloc a 9 sahloul 4054 sousse|94752487
Sousse|Cap Bon / Sahel|Sousse|Enfidha|8, Rue El JAMAA 4030 Enfidha|98512024
Sousse|Cap Bon / Sahel|Sousse|kalaa kebira|rue 14 janvier kalaa kebira|73317954 / 25809745
Sousse|Cap Bon / Sahel|Sousse|Sousse 822|Av Du Commandant Bejaoui Au Dessus Aziza Bouhssina Sousse 4000|99692560 / 93931518
Sfax|Centre|Sfax|Sfax 1|65, Rue Habib Maazoun 3000 Sfax|93699724 / 93699634
Sfax|Centre|Sfax|Sfax|Galerie III, 1er etage, 430 Bd. 7 Novembre 3027 Sfax|99495650 / 93699647
Sfax|Centre|Sfax|Sfax Sekiet Ezzit|Av. Hedi Chaker Im. Maalej Sakiet Ezzit - Sfax 3021|93699719 / 93699659
Sfax|Centre|Sfax|Sfax skiet Edayer|Route de Mahdia Km 6, Avenue Mongi Slim - Immeuble Neifar - 3011 Sfax|99577724 / 93699664
Sfax|Centre|Sfax|Sfax El Jadida|128 LES GALERIERS SFAX EL JADIDA 3027|74403522
Sfax|Centre|Sfax|Sfax III|Rue Ennasria Imm. El Borj Bloc A 1er Etage 3002 Sfax|92553838
Sfax|Centre|Sfax|Sfax IV|12 Rue Leopold Senghor Imm. Karray 2eme Etage App. N2 3000 Sfax|97054535
Sfax|Centre|Sfax|Sfax V|Route de mahdia km 0.5 immeuble pavillon d'or 3000|99960086
Kairouan|Centre|Kairouan|Kairouan|23 Av de la victoire 3100 - kairouan|92735469 / 93699636
Kairouan|Centre|Kairouan|Kairouan II|Rue 20 Mars 3100 Kairouan|98918905
Gabes|Sud / Sud-Est|Gabes|Gabes|Angle Av. Med. Ali et Rue Bahloul Dhahri 6000 Gabes|93699686 / 93699637
Gabes|Sud / Sud-Est|Gabes|Gabes III|Av farhat hached n342 gabes 6000|98998241
Gabes|Sud / Sud-Est|Gabes|El-Hamma|73 Av mongi slim immb ghoudi gabes 6000|94982764
Gabes|Sud / Sud-Est|Gabes|Gabes II|Avenue de la republique 6000 Gabes|93548909
Beja|Nord / Nord-Ouest|Beja|Beja|45, Avenue de la Republique - 9000 Beja|92687554 / 93699638
Beja|Nord / Nord-Ouest|Beja|Beja II|Beja garden s6 route de Tabarka Beja 9000|99029181 / 99139650
Beja|Nord / Nord-Ouest|Beja|Testour|Cite Gharnata Testour 9060|99138450
Beja|Nord / Nord-Ouest|Beja|Mjez El Bab|Place de l'independance Medjez el Bab 9070|22223842
Nabeul|Cap Bon / Sahel|Nabeul|Nabeul|15, Rue de France 8000 Nabeul|93106816 / 93699639
Nabeul|Cap Bon / Sahel|Nabeul|Kelibia|65, Av. Habib Bourguiba 8090 Kelibia|93699715 / 936699655
Nabeul|Cap Bon / Sahel|Nabeul|Hammamet|127, Av. De la Republique Hammamet 8050|93699661
Nabeul|Cap Bon / Sahel|Nabeul|Nabeul II|Rue Hedi nouira imm cherif Nabeul 8000|92043840 / 99960099
Nabeul|Cap Bon / Sahel|Nabeul|Grombalia|Rue 18 janvier derriere b.n.a grombalia 8030|98430374
Nabeul|Cap Bon / Sahel|Nabeul|Korba|Avenue de la liberte 8070 Korba|99535592
Nabeul|Cap Bon / Sahel|Nabeul|Hammamet GP1|rue yasser arafet gp1 manaret hammamet|94511893 / 98322982
Nabeul|Cap Bon / Sahel|Nabeul|Soliman|Avenue de la Republique, Route de Menzel Bouzelfa - 8020 Soliman|99030810 / 93106846
Nabeul|Cap Bon / Sahel|Nabeul|Menzel Temim|Avenue Habib Bourguiba, 8080 Menzel Temim|72374187 / 99535592
Nabeul|Cap Bon / Sahel|Nabeul|Beni Khalled|Avenue de la revolution immeuble Dabbabi, 8021 Beni Khalled|72374187 / 99535592
Monastir|Cap Bon / Sahel|Monastir|Monastir|Residance IRIS RTE Kenis El Agba - 5000 Monastir|93699641
Monastir|Cap Bon / Sahel|Monastir|Moknine|Avenue Mongi Slim Moknine 5050|98978815
Monastir|Cap Bon / Sahel|Monastir|Monastir II|8 immeuble cnrps n4 monastir 5000|92490458
Monastir|Cap Bon / Sahel|Monastir|Teboulba|Avenue habib bourguiba 5080 teboulba|98363200
Monastir|Cap Bon / Sahel|Monastir|JEMMAL|Avenue des Martyrs, Jemmal 5020|92129493 / 96526372
Kef|Nord / Nord-Ouest|Kef|Kef|65, Avenu Habib Bourguiba - 7100 El Kef|93699644 / 93699748
Kef|Nord / Nord-Ouest|Kef|kef II|B.P N02 EL KEF OUEST 7117|98644306
Ariana|Tunis & Grand Tunis|Ariana|Ariana|Imm. Ariana Center 2080 Ariana|94522695 / 93699645
Ariana|Tunis & Grand Tunis|Ariana|Ennasr|Av. Hedi Nouira, Ennasr II - 2037|95073181 / 93699666
Ariana|Tunis & Grand Tunis|Ariana|El menzah|65 Av. Mouaoui Ibn Aby Sofiene El Menzah 6 - 2090|93699668
Ariana|Tunis & Grand Tunis|Ariana|Soukra|116 Av Union Maghreb Arabe - Soukra|93699671
Ariana|Tunis & Grand Tunis|Ariana|Raoued|3, Residence Mariem RDC Ennkhilet 2083|98998241
Ariana|Tunis & Grand Tunis|Ariana|Ennaser II|Avenue Hedi Nouira Residence MIRAMAR mezanine Bloc B - ENNASR 2 - 2001|22431674
Ben Arous|Tunis & Grand Tunis|Ben Arous|Ben Arous I|7 rue avenue de France Ben Arous 2013|93689947 / 93699649
Ben Arous|Tunis & Grand Tunis|Ben Arous|Mourouj 1|Av. des Martyres, Lamty Center 2074 El Mourouj|99923394 / 93699652
Ben Arous|Tunis & Grand Tunis|Ben Arous|Hammam Lif|7, Av. De la Republique - Hammam-Lif 2050|93699689 / 93699660
Ben Arous|Tunis & Grand Tunis|Ben Arous|Ben Arous II|Centre Folla 3, App. N 6 BEN Arous 2013|93699772 / 93699667
Ben Arous|Tunis & Grand Tunis|Ben Arous|El Mourouj 3|B16, 7 Nov. Complexe Challakh El Mourouj 4 2074|23849302
Ben Arous|Tunis & Grand Tunis|Ben Arous|Ezzahra|Av. de Paris Complexe Boukhris Boumhel 2097|96543794
Ben Arous|Tunis & Grand Tunis|Ben Arous|Megrine|68, Av. H. Bourguiba 2033 Megrine|98901215
Ben Arous|Tunis & Grand Tunis|Ben Arous|Fouchana|Av. 7 Nov. APP. El Guabsia 2082 Fouchana|95500471
Ben Arous|Tunis & Grand Tunis|Ben Arous|Rades|av med ali rades 2040|95937768
Ben Arous|Tunis & Grand Tunis|Ben Arous|Mourouj 6|5 residence El riadh avenue des martyrs El mourouj 6|92740510
Ben Arous|Tunis & Grand Tunis|Ben Arous|Succursale Maison Chery|Maison Chery Borj Ghorbel Ben Arous 2013|95003566
Ben Arous|Tunis & Grand Tunis|Ben Arous|Nouvelle Madina|8 Avenue Monastir, nouvelle medina 3 code postale 2063|71316061 / 98448668
Medenine|Sud / Sud-Est|Medenine|Djerba|Complexe El Hadji, Rue Habib Thameur Houmt Souk Djerba|93699711 / 93699650
Medenine|Sud / Sud-Est|Medenine|Zarzis|Av. Med. V Zarzis - 4170|99497560 / 93699663
Medenine|Sud / Sud-Est|Medenine|Medenine|65, Av. Habib Bourguiba 4100 Medenine|98483260
Medenine|Sud / Sud-Est|Medenine|Djerba II|35, Avenue Ali Balhouane Djerba Midoun 4116|98483260
Medenine|Sud / Sud-Est|Medenine|Ben Gerdaine|avenue hedi jarray ben gherdane 4160 ben Gherdane|96393725
Medenine|Sud / Sud-Est|Medenine|Zarzis II|Avenue habib bourguiba residence med amine klich zarzis 4170|99497870 / 99487440
`;

const governorateOffsets = {};

function offsetCoordinate(governorate) {
  const base = GOVERNORATE_COORDS[governorate] || [36.8065, 10.1815];
  const index = governorateOffsets[governorate] || 0;
  governorateOffsets[governorate] = index + 1;

  const row = Math.floor(index / 5) - 2;
  const col = (index % 5) - 2;

  return [base[0] + row * 0.018, base[1] + col * 0.018];
}

export const MAE_REGION_COLORS = REGION_COLORS;

export const MAE_AGENCIES = AGENCY_ROWS.trim().split("\n").map((row, index) => {
  const [governorate, region, city, name, address, phones] = row.split("|");
  const [lat, lng] = offsetCoordinate(governorate);

  return {
    id: index + 1,
    governorate,
    region,
    city,
    name,
    address,
    phones: phones.split("/").map((phone) => phone.trim()).filter(Boolean),
    email: EMAIL,
    lat,
    lng,
  };
});

export const MAE_REGION_STATS = Object.entries(
  MAE_AGENCIES.reduce((acc, agency) => {
    acc[agency.region] = (acc[agency.region] || 0) + 1;
    return acc;
  }, {})
)
  .map(([region, count]) => ({
    region,
    count,
    color: REGION_COLORS[region] || "#166534",
  }))
  .sort((a, b) => b.count - a.count);
