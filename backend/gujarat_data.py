# gujarat_data.py
# Static Gujarat administrative hierarchy: Districts â Talukas
# Villages are fetched live from AnyROR portal via Playwright

GUJARAT_DISTRICTS_TALUKAS: dict[str, list[str]] = {
    "Ahmedabad": [
        "Ahmedabad City", "Bavla", "Daskroi", "Detroj-Rampura",
        "Dhandhuka", "Dholera", "Dholka", "Mandal", "Sanand", "Viramgam"
    ],
    "Amreli": [
        "Amreli", "Babra", "Bagasara", "Dhari", "Jafrabad", "Khambha",
        "Kunkavav Vadia", "Lathi", "Lilia", "Rajula", "Savarkundla"
    ],
    "Anand": [
        "Anand", "Anklav", "Borsad", "Khambhat", "Petlad",
        "Sojitra", "Tarapur", "Umreth"
    ],
    "Aravalli": [
        "Bayad", "Bhiloda", "Dhansura", "Malpur", "Meghraj", "Modasa"
    ],
    "Banaskantha": [
        "Amirgadh", "Bhabhar", "Danta", "Dantiwada", "Deesa", "Deodar",
        "Kankrej", "Lakhani", "Palanpur", "Suigam", "Tharad", "Vadgam", "Vav"
    ],
    "Bharuch": [
        "Amod", "Ankleshwar", "Bharuch", "Hansot", "Jambusar",
        "Jhagadia", "Netrang", "Vagra", "Valia"
    ],
    "Bhavnagar": [
        "Bhavnagar", "Gariadhar", "Ghogha", "Jesar", "Mahuva",
        "Palitana", "Shihor", "Talaja", "Umrala", "Vallabhipur"
    ],
    "Botad": [
        "Barwala", "Botad", "Gadhada", "Ranpur"
    ],
    "Chhota Udaipur": [
        "Bodeli", "Chhota Udaipur", "Jetpur Pavi", "Kavant",
        "Naswadi", "Sankheda"
    ],
    "Dahod": [
        "Dahod", "Devgadh Baria", "Dhanpur", "Fatepura", "Garbada",
        "Jhalod", "Limkheda", "Sanjeli", "Zalod"
    ],
    "Dang": [
        "Ahwa", "Dang"
    ],
    "Devbhoomi Dwarka": [
        "Bhanvad", "Dwarka", "Kalyanpur", "Khambhalia", "Okhamandal"
    ],
    "Gandhinagar": [
        "Dehgam", "Gandhinagar", "Kalol", "Mansa"
    ],
    "Gir Somnath": [
        "Gir Gadhada", "Kodinar", "Mangrol", "Sutrapada", "Talala", "Una", "Veraval"
    ],
    "Jamnagar": [
        "Dhrol", "Jamnagar", "Jamjodhpur", "Jodia", "Kalavad", "Lalpur"
    ],
    "Junagadh": [
        "Bhesan", "Junagadh", "Keshod", "Maliya Hatina", "Manavadar",
        "Mendarda", "Vanthali", "Visavadar"
    ],
    "Kachchh": [
        "Abdasa", "Anjar", "Bhachau", "Bhuj", "Gandhidham", "Lakhpat",
        "Mandvi", "Mundra", "Nakhatrana", "Rapar"
    ],
    "Kheda": [
        "Balasinor", "Kapadvanj", "Kathlal", "Kheda", "Mahemdabad",
        "Mahudha", "Matar", "Nadiad", "Thasra", "Vaso"
    ],
    "Mahisagar": [
        "Balasinor", "Kadana", "Khanpur", "Lunawada", "Santrampur", "Virpur"
    ],
    "Mehsana": [
        "Becharaji", "Kadi", "Kheralu", "Mehsana", "Satlasana",
        "Sidhpur", "Unjha", "Vadnagar", "Vijapur", "Visnagar"
    ],
    "Morbi": [
        "Halvad", "Maliya", "Morbi", "Tankara", "Wankaner"
    ],
    "Narmada": [
        "Dediyapad", "Garudeshwar", "Nandod", "Sagbara", "Tilakwada"
    ],
    "Navsari": [
        "Chikhhli", "Gandevi", "Jalalpore", "Khergam", "Navsari", "Vansda"
    ],
    "Panchmahal": [
        "Godhra", "Ghoghamba", "Halol", "Jambughoda", "Kalol",
        "Morva Hadaf", "Shahera"
    ],
    "Patan": [
        "Chanasma", "Harij", "Patan", "Radhanpur", "Sami", "Santalpur", "Sidhpur"
    ],
    "Porbandar": [
        "Kutiyana", "Porbandar", "Ranavav"
    ],
    "Rajkot": [
        "Dhoraji", "Gondal", "Jasdan", "Jetpur", "Kotda Sangani",
        "Lodhika", "Paddhari", "Rajkot", "Upleta", "Vinchhiya"
    ],
    "Sabarkantha": [
        "Himmatnagar", "Idar", "Khedbrahma", "Prantij", "Talod", "Vadali", "Vijaynagar"
    ],
    "Surat": [
        "Bardoli", "Choryasi", "Kamrej", "Mahuva", "Mandvi", "Mangrol",
        "Olpad", "Palsana", "Surat City", "Umarpada", "Valod"
    ],
    "Surendranagar": [
        "Chotila", "Dhangadhra", "Halvad", "Lakhtar", "Limbdi",
        "Muli", "Sayla", "Thangadh", "Wadhwan"
    ],
    "Tapi": [
        "Dolvan", "Nizar", "Songadh", "Uchchhal", "Valod", "Vyara"
    ],
    "Vadodara": [
        "Dabhoi", "Desar", "Karjan", "Padra", "Savli", "Shinor",
        "Vadodara City", "Waghodia"
    ],
    "Valsad": [
        "Dharampur", "Kaprada", "Pardi", "Umbergaon", "Valsad", "Vapi"
    ],
}


def get_districts() -> list[str]:
    return sorted(GUJARAT_DISTRICTS_TALUKAS.keys())


def get_talukas(district: str) -> list[str]:
    district_lower = district.lower().strip()
    # Exact match (case-insensitive)
    for key, talukas in GUJARAT_DISTRICTS_TALUKAS.items():
        if key.lower() == district_lower:
            return sorted(talukas)
    # Partial match
    for key, talukas in GUJARAT_DISTRICTS_TALUKAS.items():
        if district_lower in key.lower() or key.lower() in district_lower:
            return sorted(talukas)
    return []
