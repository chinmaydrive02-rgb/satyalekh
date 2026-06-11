# gujarat_data.py
# Gujarat administrative hierarchy: Districts → Talukas
# REGENERATED June 2026 by scraping the live AnyROR portal dropdowns
# (record type: Old Scanned VF-7/12). Each taluka stores (English, Gujarati);
# the Gujarati string is the EXACT dropdown text on AnyROR, so the scraper
# can exact-match instead of relying on Gemini translation.
#
# Notable corrections vs the old static list:
#   - Ahmedabad has NO "City" taluka — the city area is split into Asarva,
#     Maninagar, Vatva, Ghatlodiya, Sabarmati, Vejalpur.
#   - New district: Vav-Tharad (split from Banaskantha).
#   - Many districts have separate "<name> City" talukas for urban records.

GUJARAT_DISTRICTS_TALUKAS: dict[str, list[tuple[str, str]]] = {
    "Ahmedabad": [
        ("Mandal", "માંડલ"), ("Detroj-Rampura", "દેત્રોજ-રામપુરા"), ("Viramgam", "વિરમગામ"),
        ("Sanand", "સાણંદ"), ("Daskroi", "દશક્રોઈ"), ("Dholka", "ઘોળકા"), ("Bavla", "બાવળા"),
        ("Dhandhuka", "ઘંઘુકા"), ("Dholera", "ધોલેરા"), ("Asarva (City)", "અસારવા"),
        ("Maninagar (City)", "મણિનગર"), ("Vatva (City)", "વટવા"), ("Ghatlodiya (City)", "ઘાટલોડીયા"),
        ("Sabarmati (City)", "સાબરમતી"), ("Vejalpur (City)", "વેજલપુર"),
    ],
    "Amreli": [
        ("Kunkavav Vadia", "કુંકાવાવ વડિયા"), ("Babra", "બાબરા"), ("Lathi", "લાઠી"),
        ("Lilia", "લીલીયા"), ("Amreli", "અમરેલી"), ("Bagasara", "બગસરા"), ("Dhari", "ધારી"),
        ("Savarkundla", "સાવરકુંડલા"), ("Khambha", "ખાંભા"), ("Jafrabad", "જાફરાબાદ"),
        ("Rajula", "રાજુલા"), ("Amreli City", "અમરેલી શહેર"),
    ],
    "Anand": [
        ("Tarapur", "તારાપુર"), ("Sojitra", "સોજિત્રા"), ("Umreth", "ઉમરેઠ"), ("Anand", "આણંદ"),
        ("Petlad", "પેટલાદ"), ("Khambhat", "ખંભાત"), ("Borsad", "બોરસદ"), ("Anklav", "આંકલાવ"),
        ("Anand City", "આણંદ (શહેર)"),
    ],
    "Aravalli": [
        ("Bhiloda", "ભીલોડા"), ("Meghraj", "મેઘરજ"), ("Modasa", "મોડાસા"), ("Dhansura", "ધનસુરા"),
        ("Malpur", "માલપુર"), ("Bayad", "બાયડ"), ("Shamlaji", "શામળાજી"), ("Sathamba", "સાઠંબા"),
    ],
    "Banaskantha": [
        ("Dhanera", "ધાનેરા"), ("Dantiwada", "દાંતીવાડા"), ("Amirgadh", "અમીરગઢ"), ("Danta", "દાંતા"),
        ("Vadgam", "વડગામ"), ("Palanpur", "પાલનપુર"), ("Deesa", "ડીસા"), ("Kankrej", "કાંકરેજ"),
        ("Palanpur City", "પાલનપુર શહેર"), ("Deesa City", "ડીસા શહેર"), ("Ogad", "ઓગડ"), ("Hadad", "હડાદ"),
    ],
    "Bharuch": [
        ("Jambusar", "જંબુસર"), ("Amod", "આમોદ"), ("Vagra", "વાગરા"), ("Bharuch", "ભરુચ"),
        ("Jhagadia", "ઝગડિયા"), ("Ankleshwar", "અંકલે઼શ્વર"), ("Hansot", "હાંસોટ"), ("Valia", "વાલીયા"),
        ("Netrang", "નેત્રંગ"), ("Bharuch City", "ભરુચ શહેર"),
    ],
    "Bhavnagar": [
        ("Vallabhipur", "વલ્લભીપુર"), ("Umrala", "ઉમરાળા"), ("Bhavnagar", "ભાવનગર"), ("Ghogha", "ઘોઘા"),
        ("Sihor", "શીહોર"), ("Gariyadhar", "ગારીયાધાર"), ("Palitana", "પાલીતાણા"), ("Talaja", "તળાજા"),
        ("Mahuva", "મહુવા"), ("Bhavnagar City", "ભાવનગર શહેર"), ("Jesar", "જેસર"),
    ],
    "Botad": [
        ("Botad", "બોટાદ"), ("Gadhada", "ગઢડા"), ("Ranpur", "રાણપુર"), ("Barwala", "બરવાળા"),
        ("Botad City", "બોટાદ શહેર"),
    ],
    "Chhota Udepur": [
        ("Jetpur Pavi", "જેતપુર પાવી"), ("Chhota Udepur", "છોટાઉદેપુર"), ("Kavant", "કવાંટ"),
        ("Nasvadi", "નસવાડી"), ("Sankheda", "સંખેડા"), ("Bodeli", "બોડેલી"), ("Kadval", "કદવાલ"),
    ],
    "Dahod": [
        ("Fatepura", "ફતેપુરા"), ("Jhalod", "ઝાલોદ"), ("Limkheda", "લીમખેડા"), ("Dahod", "દાહોદ"),
        ("Garbada", "ગરબાડા"), ("Devgadhbaria", "દેવગઢબારીયા"), ("Dhanpur", "ધાનપુર"),
        ("Sanjeli", "સંજેલી"), ("Singvad", "સીંગવડ"), ("Govind Guru Limdi", "ગોવિંદ ગુરુ લીમડી"),
        ("Sukhsar", "સુખસર"),
    ],
    "Dang": [
        ("Dang-Ahwa", "ડાંગ-આહવા"), ("Waghai", "વઘઇ"), ("Subir", "સુબીર"),
    ],
    "Devbhumi Dwarka": [
        ("Dwarka", "દ્વારકા"), ("Khambhalia", "ખંભાળિયા"), ("Kalyanpur", "કલ્યાણપુર"), ("Bhanvad", "ભાણવડ"),
    ],
    "Gandhinagar": [
        ("Kalol", "કલોલ"), ("Mansa", "માણસા"), ("Gandhinagar", "ગાંધીનગર"), ("Dehgam", "દહેગામ"),
        ("Kalol City", "કલોલ શહેર"),
    ],
    "Gir Somnath": [
        ("Gir Gadhada", "ગીર ગઢડા"), ("Talala", "તાલાલા"), ("Patan Veraval", "પાટન વેરાવળ"),
        ("Sutrapada", "સુત્રાપાડા"), ("Kodinar", "કોડીનાર"), ("Una", "ઉના"), ("Veraval City", "વેરાવળ શહેર"),
    ],
    "Jamnagar": [
        ("Jamnagar Rural", "જામનગર ગ્રામ્ય"), ("Jodiya", "જોડીયા"), ("Dhrol", "ધ્રોલ"),
        ("Kalavad", "કાલાવડ"), ("Lalpur", "લાલપુર"), ("Jamjodhpur", "જામજોધપુર"),
        ("Jamnagar City", "જામનગર શહેર"),
    ],
    "Junagadh": [
        ("Manavadar", "માણાવદર"), ("Vanthali", "વંથલી"), ("Junagadh", "જુનાગઢ"), ("Bhesan", "ભેસાણ"),
        ("Visavadar", "વિસાવદર"), ("Mendarda", "મેંદરડા"), ("Keshod", "કેશોદ"), ("Mangrol", "માંગરોળ"),
        ("Maliya Hatina", "માળીયા હાટીના"), ("Junagadh City", "જુનાગઢ સીટી"),
    ],
    "Kheda": [
        ("Kapadvanj", "કપડવંજ"), ("Kathlal", "કઠલાલ"), ("Mahemdavad", "મહેમદાવાદ"), ("Kheda", "ખેડા"),
        ("Matar", "માતર"), ("Nadiad Rural", "નડીઆદ ગ્રામ્ય"), ("Mahudha", "મહુધા"), ("Thasra", "ઠાસરા"),
        ("Galteshwar", "ગળતેશ્વર"), ("Vaso", "વસો"), ("Nadiad City", "નડિયાદ શહેર"), ("Fagvel", "ફાગવેલ"),
    ],
    "Kutch": [
        ("Lakhpat", "લખપત"), ("Rapar", "રાપર"), ("Bhachau", "ભચાઉ"), ("Anjar", "અંજાર"),
        ("Bhuj", "ભુજ"), ("Nakhatrana", "નખત્રાણા"), ("Abdasa", "અબડાસા"), ("Mandvi", "માંડવી"),
        ("Mundra", "મુંદ્રા"), ("Gandhidham", "ગાંઘીધામ"), ("Bhuj City", "ભુજ શહેર"),
    ],
    "Mahisagar": [
        ("Khanpur", "ખાનપુર"), ("Kadana", "કડાણા"), ("Santrampur", "સંતરામપુર"), ("Lunawada", "લુણાવાડા"),
        ("Balasinor", "બાલાસિનોર"), ("Virpur", "વિરપુર"), ("Godhar", "ગોધર"), ("Kothamba", "કોઠંબા"),
    ],
    "Mehsana": [
        ("Satlasana", "સતલાસણા"), ("Kheralu", "ખેરાલુ"), ("Unjha", "ઊંઝા"), ("Visnagar", "વિસનગર"),
        ("Vadnagar", "વડનગર"), ("Vijapur", "વિજાપુર"), ("Mehsana", "મહેસાણા"), ("Becharaji", "બેચરાજી"),
        ("Kadi", "કડી"), ("Jotana", "જોટાણા"), ("Mehsana City", "મહેસાણા શહેર"),
    ],
    "Morbi": [
        ("Maliya", "માળીયા"), ("Morbi", "મોરબી"), ("Tankara", "ટંકારા"), ("Wankaner", "વાંકાનેર"),
        ("Halvad", "હળવદ"), ("Morbi City", "મોરબી શહેર"),
    ],
    "Narmada": [
        ("Tilakwada", "તિલકવાડા"), ("Nandod", "નાંદોદ"), ("Dediapada", "ડેડીયાપાડા"),
        ("Sagbara", "સાગબારા"), ("Garudeshwar", "ગરૂડેશ્વર"), ("Chikda", "ચીકદા"),
    ],
    "Navsari": [
        ("Navsari", "નવસારી"), ("Jalalpore", "જલાલપોર"), ("Gandevi", "ગણદેવી"), ("Chikhli", "ચીખલી"),
        ("Vansda", "વાંસદા"), ("Khergam", "ખેરગામ"), ("Navsari City", "નવસારી શહેર"),
    ],
    "Panchmahal": [
        ("Shehera", "શહેરા"), ("Morva Hadaf", "મોરવા (હડફ)"), ("Godhra", "ગોધરા"), ("Kalol", "કાલોલ"),
        ("Ghoghamba", "ઘોઘંબા"), ("Halol", "હાલોલ"), ("Jambughoda", "જાંબુઘોડા"),
        ("Godhra City", "ગોધરા શહેર"),
    ],
    "Patan": [
        ("Santalpur", "સાંતલપુર"), ("Radhanpur", "રાધનપુર"), ("Siddhpur", "સિદ્ધપુર"), ("Patan", "પાટણ"),
        ("Harij", "હારીજ"), ("Sami", "સમી"), ("Chanasma", "ચાણસ્મા"), ("Shankheshwar", "શંખેશ્વર"),
        ("Saraswati", "સરસ્વતી"), ("Patan City", "પાટણ શહેર"),
    ],
    "Porbandar": [
        ("Porbandar", "પોરબંદર"), ("Ranavav", "રાણાવાવ"), ("Kutiyana", "કુતિયાણા"),
        ("Porbandar City", "પોરબંદર શહેર"),
    ],
    "Rajkot": [
        ("Paddhari", "પડધરી"), ("Rajkot", "રાજકોટ"), ("Lodhika", "લોધીકા"),
        ("Kotda Sangani", "કોટડા સાંગાણી"), ("Jasdan", "જસદણ"), ("Gondal", "ગોંડલ"),
        ("Jamkandorana", "જામકંડોરણા"), ("Upleta", "ઉપલેટા"), ("Dhoraji", "ધોરાજી"),
        ("Jetpur", "જેતપુર"), ("Vinchhiya", "વિંછીયા"), ("Rajkot City (East)", "રાજકોટ શહેર (પુર્વ)"),
        ("Rajkot City (West)", "રાજકોટ શહેર (પશ્ચિમ)"), ("Rajkot City (South)", "રાજકોટ શહેર (દક્ષિણ)"),
        ("Gondal City", "ગોંડલ શહેર"), ("Jetpur City", "જેતપુર શહેર"),
    ],
    "Sabarkantha": [
        ("Khedbrahma", "ખેડબ્રહ્મા"), ("Vijaynagar", "વિજયનગર"), ("Vadali", "વડાલી"), ("Idar", "ઈડર"),
        ("Himatnagar", "હિંમતનગર"), ("Prantij", "પ્રાંતિજ"), ("Talod", "તલોદ"), ("Poshina", "પોશિના"),
    ],
    "Surat": [
        ("Olpad", "ઓલપાડ"), ("Mangrol", "માંગરોલ"), ("Umarpada", "ઉમરપાડા"), ("Mandvi", "માંડવી"),
        ("Kamrej", "કામરેજ"), ("Choryasi", "ચોરાસી"), ("Palsana", "પલસાણા"), ("Bardoli", "બારડોલી"),
        ("Mahuva", "મહુવા"), ("Adajan (City)", "અડાજણ"), ("Katargam (City)", "કતારગામ"),
        ("Puna (City)", "પુણા"), ("Udhna (City)", "ઉધના"), ("Majura (City)", "મજુરા"),
        ("Abrama", "અબ્રામા"), ("Areth", "અરેઠ"), ("Ambika", "અંબિકા"),
    ],
    "Surendranagar": [
        ("Dhrangadhra", "ધ્રાંગધ્રા"), ("Dasada", "દસાડા"), ("Lakhtar", "લખતર"), ("Wadhwan", "વઢવાણ"),
        ("Muli", "મુળી"), ("Chotila", "ચોટીલા"), ("Sayla", "સાયલા"), ("Chuda", "ચુડા"),
        ("Limbdi", "લીંબડી"), ("Thangadh", "થાનગઢ"), ("Surendranagar City", "સુરેન્દ્રનગર શહેર"),
    ],
    "Tapi": [
        ("Nizar", "નિઝર"), ("Uchchhal", "ઉચ્છલ"), ("Songadh", "સોનગઢ"), ("Vyara", "વ્યારા"),
        ("Valod", "વાલોડ"), ("Kukarmunda", "કુકરમુંડા"), ("Dolvan", "ડોલવણ"), ("Ukai", "ઉકાઈ"),
    ],
    "Vadodara": [
        ("Savli", "સાવલી"), ("Vadodara", "વડોદરા"), ("Waghodia", "વાઘોડીયા"), ("Dabhoi", "ડભોઇ"),
        ("Padra", "પાદરા"), ("Karjan", "કરજણ"), ("Sinor", "સિનોર"), ("Desar", "દેસર"),
        ("Vadodara City (North)", "વડોદરા શહેર (ઉત્તર)"), ("Vadodara City (South)", "વડોદરા શહેર (દક્ષિણ)"),
        ("Vadodara City (East)", "વડોદરા શહેર (પૂર્વ)"), ("Vadodara City (West)", "વડોદરા શહેર (પશ્ચિમ)"),
    ],
    "Valsad": [
        ("Valsad", "વલસાડ"), ("Dharampur", "ધરમપુર"), ("Pardi", "પારડી"), ("Kaprada", "કપરાડા"),
        ("Umbergaon", "ઊમરગામ"), ("Vapi", "વાપી"), ("Valsad City", "વલસાડ શહેર"),
        ("Vapi City", "વાપી શહેર"), ("Nanapondha", "નાનાપોંઢા"),
    ],
    "Vav-Tharad": [
        ("Vav", "વાવ"), ("Tharad", "થરાદ"), ("Deodar", "દીયોદર"), ("Bhabhar", "ભાભર"),
        ("Lakhani", "લાખણી"), ("Suigam", "સુઇગામ"), ("Rah", "રાહ"), ("Dharanidhar", "ધરણીધર"),
    ],
}

# English (lowercase) → list of Gujarati variants, for exact dropdown matching.
# Collisions keep every variant (e.g. Kalol is કલોલ in Gandhinagar and કાલોલ
# in Panchmahal — both are tried; only the one present in the dropdown matches).
TALUKA_GUJARATI: dict[str, list[str]] = {}
for _talukas in GUJARAT_DISTRICTS_TALUKAS.values():
    for _en, _gu in _talukas:
        for _key in {_en.lower(), _en.lower().replace(" (city)", "").strip()}:
            TALUKA_GUJARATI.setdefault(_key, [])
            if _gu not in TALUKA_GUJARATI[_key]:
                TALUKA_GUJARATI[_key].append(_gu)


def get_districts() -> list[str]:
    """All Gujarat districts, alphabetically."""
    return sorted(GUJARAT_DISTRICTS_TALUKAS.keys())


def get_talukas(district: str) -> list[str]:
    """English taluka names for a district (case-insensitive, partial match).
    Order matches the AnyROR dropdown (rural talukas first, city last)."""
    if not district:
        return []
    d = district.strip().lower()
    for name, talukas in GUJARAT_DISTRICTS_TALUKAS.items():
        if name.lower() == d:
            return [en for en, _ in talukas]
    for name, talukas in GUJARAT_DISTRICTS_TALUKAS.items():
        if d in name.lower() or name.lower() in d:
            return [en for en, _ in talukas]
    return []


def get_taluka_gujarati(taluka_english: str) -> list[str]:
    """Gujarati variants for an English taluka name ([] if unknown)."""
    if not taluka_english:
        return []
    key = taluka_english.strip().lower()
    return TALUKA_GUJARATI.get(key) or TALUKA_GUJARATI.get(key.replace(" (city)", "").strip(), [])
