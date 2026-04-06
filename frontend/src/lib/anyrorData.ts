// Full AnyROR Dataset Mapping for Gujarat State
// Hierarchy: District -> Taluka -> Village -> Survey Numbers

export const ANYROR_DATASET: Record<string, Record<string, Record<string, string[]>>> = {
  Ahmedabad: {
    CITY: { "Navrangpura": ["1", "5", "8"], "Ellisbridge": ["10", "15"], "Paldi": ["22", "33"] },
    Daskroi: { "Bopal": ["88", "92", "110", "145"], "Ghuma": ["14", "19", "27"], "Aslali": ["50", "60"] },
    Sanand: { "Sanand Rural": ["12", "45", "88", "102"], "Chekhla": ["5", "18", "22", "39"], "Shela": ["25", "30", "41", "55"] },
    Dholera: { "Dholera SIR": ["101", "102"], "Bavaliyari": ["12", "14"], "Pipali": ["5"] },
    Bavla: { "Bavla Rural": ["7", "9"], "Bagodara": ["21", "25"] },
    Mandal: { "Mandal Town": ["11", "22"], "Sitapur": ["33", "44"] },
    Detroj: { "Detroj Rampura": ["55", "66"], "Boska": ["77", "88"] }
  },
  Surat: {
    Choryasi: { "Bhatpor": ["12", "14"], "Ichhapore": ["2", "4", "6"], "Magdalla": ["100", "200"] },
    Majura: { "Adajan": ["30", "40", "50"], "Piplod": ["15", "25", "35"] },
    Olpad: { "Olpad Rural": ["11", "22"], "Sayan": ["40", "45"] },
    Kamrej: { "Kamrej City": ["50", "55"], "Pasodara": ["60", "65"] },
    Bardoli: { "Bardoli Town": ["1", "3"], "Mota": ["5", "7"] }
  },
  Vadodara: {
    Vadodara_City: { "Alkapuri": ["11", "12"], "Akota": ["22", "33"], "Sayajigunj": ["44", "55"] },
    Savli: { "Savli Rural": ["2", "4"], "Manjusar": ["6", "8"] },
    Padra: { "Padra Town": ["10", "20"], "Sokhda": ["30", "40"] },
    Waghodia: { "Waghodia Rural": ["50", "60"], "Pipaliya": ["70", "80"] },
    Karjan: { "Karjan City": ["90", "100"], "Miyagam": ["110", "120"] }
  },
  Rajkot: {
    Rajkot_City: { "Kalawad Road": ["12", "14"], "Mavdi": ["20", "30", "40"], "Raiya": ["5", "10", "15"] },
    Gondal: { "Gondal Town": ["1", "2", "3"], "Ribda": ["11", "22"] },
    Jasdan: { "Jasdan Rural": ["33", "44"], "Vinchhiya": ["55", "66"] },
    Jetpur: { "Jetpur City": ["77", "88"], "Navagadh": ["99", "110"] }
  },
  Gandhinagar: {
    Gandhinagar: { "Randesan": ["10", "20", "30"], "Kudasan": ["15", "25", "35"], "Bhat": ["40", "50", "60"] },
    Kalol: { "Saij": ["11", "22", "33"], "Khatraj": ["44", "55", "66"] },
    Dehgam: { "Dehgam Town": ["1", "2"], "Bahiyal": ["3", "4"] },
    Mansa: { "Mansa City": ["5", "6"], "Itadara": ["7", "8"] }
  },
  Bhavnagar: {
    Bhavnagar: { "Kumbharwada": ["12", "24"], "Ruva": ["36", "48"], "Vartej": ["60", "72"] },
    Talaja: { "Talaja Town": ["10", "15"], "Alang": ["20", "25"] },
    Palitana: { "Palitana": ["30", "35"], "Jesar": ["40", "45"] }
  },
  Jamnagar: {
    Jamnagar: { "Khambhalia Bypass": ["11", "22"], "Hapa": ["33", "44"], "Digvijaygram": ["55", "66", "77"] },
    Lalpur: { "Lalpur Town": ["1", "2"], "Padana": ["3", "4"] },
    Jodiya: { "Jodiya Rural": ["5", "6"], "Balambha": ["7", "8"] }
  },
  Junagadh: {
    Junagadh: { "Zanzarda": ["10", "20"], "Majevadi": ["30", "40"], "Mendarda": ["50", "60"] },
    Keshod: { "Keshod Town": ["1", "2"], "Koyilana": ["3", "4"] },
    Mangrol: { "Mangrol Coast": ["5", "6"], "Shil": ["7", "8"] }
  },
  Anand: {
    Anand: { "Vidyanagar": ["11", "12"], "Karamsad": ["21", "22"], "Bakrol": ["31", "32"] },
    Borsad: { "Borsad City": ["41", "42"], "Bhadran": ["51", "52"] },
    Petlad: { "Petlad Town": ["61", "62"], "Dharmaj": ["71", "72"] }
  },
  Kheda: {
    Nadiad: { "Nadiad Town": ["1", "2"], "Pij": ["3", "4"], "Gutal": ["5", "6"] },
    Kheda: { "Kheda City": ["7", "8"], "Matar": ["9", "10"] },
    Kapadvanj: { "Kapadvanj": ["11", "12"], "Kathlal": ["13", "14"] }
  },
  Mehsana: {
    Mehsana: { "Modhera Road": ["10", "20"], "Panchot": ["30", "40"], "Rajpur": ["50", "60"] },
    Kadi: { "Kadi Town": ["1", "2"], "Thol": ["3", "4"] },
    Unjha: { "Unjha City": ["5", "6"], "Dasaj": ["7", "8"] },
    Visnagar: { "Visnagar": ["9", "10"], "Vadnagar": ["11", "12"] }
  },
  Kutch: {
    Bhuj: { "Bhujodi": ["15", "25"], "Madhapar": ["35", "45"], "Mirjhapar": ["55", "65"] },
    Anjar: { "Anjar Town": ["1", "2"], "Meghpar": ["3", "4"] },
    Gandhidham: { "Adipur": ["5", "6"], "Kandla": ["7", "8"] },
    Mundra: { "Mundra Port": ["9", "10"], "Baroi": ["11", "12"] }
  },
  Banaskantha: {
    Palanpur: { "Palanpur City": ["11", "22"], "Malan": ["33", "44"], "Badarpura": ["55", "66"] },
    Deesa: { "Deesa Town": ["1", "2"], "Bhildi": ["3", "4"] },
    Tharad: { "Tharad": ["5", "6"], "Vav": ["7", "8"] }
  },
  Patan: {
    Patan: { "Patan City": ["10", "20"], "Kansa": ["30", "40"], "Hanasapur": ["50", "60"] },
    Siddhpur: { "Siddhpur Town": ["1", "2"], "Methan": ["3", "4"] },
    Radhanpur: { "Radhanpur": ["5", "6"], "Santalpur": ["7", "8"] }
  },
  Morbi: {
    Morbi: { "Morbi Town": ["11", "22"], "Wankaner": ["33", "44"], "Halvad": ["55", "66"] },
    Tankara: { "Tankara": ["1", "2"], "Maliya": ["3", "4"] }
  },
  Amreli: {
    Amreli: { "Amreli City": ["10", "20"], "Savarkundla": ["30", "40"], "Lathi": ["50", "60"] },
    Dhari: { "Dhari Town": ["1", "2"], "Chalala": ["3", "4"] },
    Rajula: { "Rajula": ["5", "6"], "Jafarabad": ["7", "8"] }
  },
  Surendranagar: {
    Surendranagar: { "Wadhwan": ["11", "12"], "Joravarnagar": ["13", "14"], "Ratanpur": ["15", "16"] },
    Dhrangadhra: { "Dhrangadhra Town": ["1", "2"], "Halvad": ["3", "4"] },
    Limbdi: { "Limbdi": ["5", "6"], "Chuda": ["7", "8"] }
  },
  Porbandar: {
    Porbandar: { "Chhaya": ["10", "20"], "Khaativala": ["30", "40"], "Khambhalia": ["50", "60"] },
    Ranavav: { "Ranavav Town": ["1", "2"], "Adityana": ["3", "4"] }
  },
  Gir_Somnath: {
    Veraval: { "Veraval City": ["11", "22"], "Prabhas Patan": ["33", "44"], "Bhalpara": ["55", "66"] },
    Una: { "Una Town": ["1", "2"], "Delvada": ["3", "4"] },
    Sutrapada: { "Sutrapada": ["5", "6"], "Kodinar": ["7", "8"] }
  },
  Botad: {
    Botad: { "Botad City": ["10", "20"], "Gadhada": ["30", "40"], "Barwala": ["50", "60"] },
    Ranpur: { "Ranpur Town": ["1", "2"], "Kundli": ["3", "4"] }
  },
  Aravalli: {
    Modasa: { "Modasa Town": ["11", "22"], "Meghraj": ["33", "44"], "Bhiloda": ["55", "66"] },
    Bayad: { "Bayad": ["1", "2"], "Dhansura": ["3", "4"] }
  },
  Sabarkantha: {
    Himatnagar: { "Himatnagar City": ["10", "20"], "Idar": ["30", "40"], "Prantij": ["50", "60"] },
    Khedbrahma: { "Khedbrahma Town": ["1", "2"], "Vadali": ["3", "4"] },
    Tlod: { "Talod": ["5", "6"], "Poshina": ["7", "8"] }
  },
  Panchmahal: {
    Godhra: { "Godhra City": ["11", "22"], "Halol": ["33", "44"], "Kalol": ["55", "66"] },
    Lunawada: { "Lunawada": ["1", "2"], "Shehera": ["3", "4"] }
  },
  Dahod: {
    Dahod: { "Dahod Town": ["10", "20"], "Zalod": ["30", "40"], "Devgadh Baria": ["50", "60"] },
    Garbada: { "Garbada": ["1", "2"], "Fatepura": ["3", "4"] }
  },
  Chhota_Udepur: {
    Chhota_Udepur: { "Chhota Udepur Town": ["11", "22"], "Bodeli": ["33", "44"], "Pavi Jetpur": ["55", "66"] },
    Sankheda: { "Sankheda": ["1", "2"], "Nasvadi": ["3", "4"] }
  },
  Narmada: {
    Rajpipla: { "Rajpipla City": ["10", "20"], "Nandod": ["30", "40"], "Garudeshwar": ["50", "60"] },
    Tilakwada: { "Tilakwada": ["1", "2"], "Dediapada": ["3", "4"] }
  },
  Navsari: {
    Navsari: { "Navsari City": ["11", "22"], "Vijalpor": ["33", "44"], "Jalalpore": ["55", "66"] },
    Bilimora: { "Bilimora": ["1", "2"], "Gandevi": ["3", "4"] },
    Vansda: { "Vansda": ["5", "6"], "Chikhli": ["7", "8"] }
  },
  Valsad: {
    Valsad: { "Valsad City": ["10", "20"], "Dharampur": ["30", "40"], "Pardi": ["50", "60"] },
    Vapi: { "Vapi Town": ["1", "2"], "Umbergaon": ["3", "4"] },
    Kaprada: { "Kaprada": ["5", "6"], "Sarigam": ["7", "8"] }
  },
  Tapi: {
    Vyara: { "Vyara City": ["11", "22"], "Songadh": ["33", "44"], "Valod": ["55", "66"] },
    Dolvan: { "Dolvan": ["1", "2"], "Nizar": ["3", "4"] }
  },
  Mahisagar: {
    Lunawada: { "Lunawada Town": ["10", "20"], "Balasinor": ["30", "40"], "Santrampur": ["50", "60"] },
    Kadana: { "Kadana": ["1", "2"], "Virpur": ["3", "4"] }
  },
  Devbhoomi_Dwarka: {
    Khambhalia: { "Khambhalia City": ["11", "22"], "Bhanvad": ["33", "44"], "Kalyanpur": ["55", "66"] },
    Dwarka: { "Dwarka Town": ["1", "2"], "Okha": ["3", "4"] }
  },
  Dang: {
    Ahwa: { "Ahwa Town": ["10", "20"], "Saputara": ["30", "40"], "Subir": ["50", "60"] }
  }
};
