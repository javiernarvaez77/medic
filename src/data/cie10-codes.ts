/** Common CIE-10 codes for chronic disease management */
export interface CIE10Entry {
  code: string;
  name: string;
}

export const CIE10_CODES: CIE10Entry[] = [
  // Hipertensión
  { code: "I10", name: "Hipertensión esencial (primaria)" },
  { code: "I11.0", name: "Enfermedad cardíaca hipertensiva con insuficiencia cardíaca" },
  { code: "I11.9", name: "Enfermedad cardíaca hipertensiva sin insuficiencia cardíaca" },
  { code: "I12.0", name: "Enfermedad renal hipertensiva con insuficiencia renal" },
  { code: "I12.9", name: "Enfermedad renal hipertensiva sin insuficiencia renal" },
  { code: "I13.0", name: "Enfermedad cardiorrenal hipertensiva con insuficiencia cardíaca" },
  { code: "I13.1", name: "Enfermedad cardiorrenal hipertensiva con insuficiencia renal" },
  { code: "I15.0", name: "Hipertensión renovascular" },
  { code: "I15.9", name: "Hipertensión secundaria, no especificada" },

  // Diabetes
  { code: "E10.0", name: "Diabetes mellitus tipo 1 con coma" },
  { code: "E10.1", name: "Diabetes mellitus tipo 1 con cetoacidosis" },
  { code: "E10.2", name: "Diabetes mellitus tipo 1 con complicaciones renales" },
  { code: "E10.3", name: "Diabetes mellitus tipo 1 con complicaciones oftálmicas" },
  { code: "E10.4", name: "Diabetes mellitus tipo 1 con complicaciones neurológicas" },
  { code: "E10.5", name: "Diabetes mellitus tipo 1 con complicaciones circulatorias periféricas" },
  { code: "E10.6", name: "Diabetes mellitus tipo 1 con otras complicaciones especificadas" },
  { code: "E10.9", name: "Diabetes mellitus tipo 1 sin complicaciones" },
  { code: "E11.0", name: "Diabetes mellitus tipo 2 con coma" },
  { code: "E11.1", name: "Diabetes mellitus tipo 2 con cetoacidosis" },
  { code: "E11.2", name: "Diabetes mellitus tipo 2 con complicaciones renales" },
  { code: "E11.3", name: "Diabetes mellitus tipo 2 con complicaciones oftálmicas" },
  { code: "E11.4", name: "Diabetes mellitus tipo 2 con complicaciones neurológicas" },
  { code: "E11.5", name: "Diabetes mellitus tipo 2 con complicaciones circulatorias periféricas" },
  { code: "E11.6", name: "Diabetes mellitus tipo 2 con otras complicaciones especificadas" },
  { code: "E11.9", name: "Diabetes mellitus tipo 2 sin complicaciones" },
  { code: "E13.9", name: "Otra diabetes mellitus especificada sin complicaciones" },
  { code: "E14.9", name: "Diabetes mellitus no especificada sin complicaciones" },

  // Riesgo cardiovascular / Enfermedades cardíacas
  { code: "I20.0", name: "Angina inestable" },
  { code: "I20.9", name: "Angina de pecho, no especificada" },
  { code: "I21.9", name: "Infarto agudo de miocardio, sin especificar" },
  { code: "I25.1", name: "Enfermedad aterosclerótica del corazón" },
  { code: "I25.9", name: "Enfermedad isquémica crónica del corazón, no especificada" },
  { code: "I48.0", name: "Fibrilación auricular paroxística" },
  { code: "I48.1", name: "Fibrilación auricular persistente" },
  { code: "I48.9", name: "Fibrilación y aleteo auricular, no especificado" },
  { code: "I50.0", name: "Insuficiencia cardíaca congestiva" },
  { code: "I50.1", name: "Insuficiencia ventricular izquierda" },
  { code: "I50.9", name: "Insuficiencia cardíaca, no especificada" },
  { code: "I63.9", name: "Infarto cerebral, no especificado" },
  { code: "I64", name: "Accidente cerebrovascular, no especificado" },
  { code: "I67.9", name: "Enfermedad cerebrovascular, no especificada" },
  { code: "I70.0", name: "Aterosclerosis de la aorta" },
  { code: "I70.9", name: "Aterosclerosis generalizada y la no especificada" },
  { code: "I73.9", name: "Enfermedad vascular periférica, no especificada" },

  // Dislipidemias
  { code: "E78.0", name: "Hipercolesterolemia pura" },
  { code: "E78.1", name: "Hipergliceridemia pura" },
  { code: "E78.2", name: "Hiperlipidemia mixta" },
  { code: "E78.5", name: "Hiperlipidemia no especificada" },

  // Enfermedad renal
  { code: "N18.1", name: "Enfermedad renal crónica, estadio 1" },
  { code: "N18.2", name: "Enfermedad renal crónica, estadio 2" },
  { code: "N18.3", name: "Enfermedad renal crónica, estadio 3" },
  { code: "N18.4", name: "Enfermedad renal crónica, estadio 4" },
  { code: "N18.5", name: "Enfermedad renal crónica, estadio 5" },
  { code: "N18.9", name: "Enfermedad renal crónica, no especificada" },
  { code: "N19", name: "Insuficiencia renal no especificada" },

  // Enfermedad respiratoria
  { code: "J44.0", name: "EPOC con infección aguda de las vías respiratorias inferiores" },
  { code: "J44.1", name: "EPOC con exacerbación aguda, no especificada" },
  { code: "J44.9", name: "Enfermedad pulmonar obstructiva crónica, no especificada" },
  { code: "J45.0", name: "Asma predominantemente alérgica" },
  { code: "J45.1", name: "Asma no alérgica" },
  { code: "J45.9", name: "Asma, no especificada" },
  { code: "J96.1", name: "Insuficiencia respiratoria crónica" },

  // Tiroides
  { code: "E01.0", name: "Bocio difuso por deficiencia de yodo" },
  { code: "E03.9", name: "Hipotiroidismo, no especificado" },
  { code: "E04.0", name: "Bocio no tóxico difuso" },
  { code: "E04.1", name: "Nódulo tiroideo solitario no tóxico" },
  { code: "E04.9", name: "Bocio no tóxico, no especificado" },
  { code: "E05.0", name: "Tirotoxicosis con bocio difuso" },
  { code: "E05.9", name: "Tirotoxicosis, no especificada" },
  { code: "E06.3", name: "Tiroiditis autoinmune (Hashimoto)" },
  { code: "E07.9", name: "Trastorno de la glándula tiroides, no especificado" },

  // Obesidad
  { code: "E66.0", name: "Obesidad debida a exceso de calorías" },
  { code: "E66.9", name: "Obesidad, no especificada" },

  // Otros comunes en adultos mayores
  { code: "M81.0", name: "Osteoporosis postmenopáusica" },
  { code: "M81.9", name: "Osteoporosis, no especificada" },
  { code: "G30.9", name: "Enfermedad de Alzheimer, no especificada" },
  { code: "G20", name: "Enfermedad de Parkinson" },
  { code: "F03", name: "Demencia, no especificada" },
  { code: "M17.9", name: "Gonartrosis (artrosis de rodilla), no especificada" },
  { code: "M16.9", name: "Coxartrosis (artrosis de cadera), no especificada" },
  { code: "M19.9", name: "Artrosis, no especificada" },
  { code: "M54.5", name: "Lumbago no especificado" },
  { code: "N40", name: "Hiperplasia de la próstata" },
  { code: "D64.9", name: "Anemia, no especificada" },
  { code: "K21.0", name: "Enfermedad de reflujo gastroesofágico con esofagitis" },
  { code: "K21.9", name: "Enfermedad de reflujo gastroesofágico sin esofagitis" },
  { code: "F32.9", name: "Episodio depresivo, no especificado" },
  { code: "F41.1", name: "Trastorno de ansiedad generalizada" },
  { code: "G47.3", name: "Apnea del sueño" },
  { code: "R73.0", name: "Tolerancia anormal a la glucosa" },
];
