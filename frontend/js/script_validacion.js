// ==========================================
// CONFIGURACIÓN Y CONSTANTES DEL SISTEMA
// ==========================================

// PIN de acceso al sistema de validación
const PIN_CODE = "2025";

// Lista de supervisores autorizados para aprobar correcciones y cierres con novedades
// Formato: código de supervisor => nombre completo
const SUPERVISORS = {
    '*197501': 'JUVENAL GALINDO',
    '*197502': 'LAURA PELAEZ'
};

// Email de destino para reportes de validación
const REPORT_EMAIL = "laura.pelaez@logimat.com.co";

// URL de Google Sheets que contiene la base de datos maestra de referencias y unidades de empaque
// Esta hoja se sincroniza en tiempo real para obtener información actualizada de productos
const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSPQdfoNhLGDrjllSqgR_4lQxH0GmxQ02XHG9txUynTDQQXG6Vg8chO95cZQVlge0HctFCvgTIciBPS/pub?gid=1080426998&single=true&output=csv";

// ==========================================
// BASE DE DATOS GEOGRÁFICA (CIUDADES Y DEPARTAMENTOS)
// ==========================================
// Datos sin procesar de ciudades y departamentos de Colombia
// Formato: CIUDAD\tDEPARTAMENTO
const CITIES_RAW_DATA = `EL ENCANTO	AMAZONAS
LA CHORRERA	AMAZONAS
LA PEDRERA	AMAZONAS
LA VICTORIA	AMAZONAS
LETICIA	AMAZONAS
MIRITI - PARANÁ	AMAZONAS
PUERTO ALEGRIA	AMAZONAS
PUERTO ARICA	AMAZONAS
PUERTO NARIÑO	AMAZONAS
PUERTO SANTANDER	AMAZONAS
TARAPACÁ	AMAZONAS
CÁCERES	ANTIOQUIA
CAUCASIA	ANTIOQUIA
EL BAGRE	ANTIOQUIA
NECHÍ	ANTIOQUIA
TARAZÁ	ANTIOQUIA
ZARAGOZA	ANTIOQUIA
CARACOLÍ	ANTIOQUIA
MACEO	ANTIOQUIA
PUERTO BERRiO	ANTIOQUIA
PUERTO NARE	ANTIOQUIA
PUERTO TRIUNFO	ANTIOQUIA
YONDÓ	ANTIOQUIA
AMALFI	ANTIOQUIA
ANORÍ	ANTIOQUIA
CISNEROS	ANTIOQUIA
REMEDIOS	ANTIOQUIA
SAN ROQUE	ANTIOQUIA
SANTO DOMINGO	ANTIOQUIA
SEGOVIA	ANTIOQUIA
VEGACHÍ	ANTIOQUIA
YALÍ	ANTIOQUIA
YOLOMBÓ	ANTIOQUIA
ANGOSTURA	ANTIOQUIA
BELMIRA	ANTIOQUIA
BRICEÑO	ANTIOQUIA
CAMPAMENTO	ANTIOQUIA
CAROLINA	ANTIOQUIA
DON MATiAS	ANTIOQUIA
ENTRERRIOS	ANTIOQUIA
GÓMEZ PLATA	ANTIOQUIA
GUADALUPE	ANTIOQUIA
ITUANGO	ANTIOQUIA
SAN ANDRÉS	ANTIOQUIA
SAN JOSÉ DE LA MONTAÑA	ANTIOQUIA
SAN PEDRO	ANTIOQUIA
SANTA ROSA de osos	ANTIOQUIA
TOLEDO	ANTIOQUIA
VALDIVIA	ANTIOQUIA
YARUMAL	ANTIOQUIA
ABRIAQUÍ	ANTIOQUIA
ANZA	ANTIOQUIA
ARMENIA	ANTIOQUIA
BURITICÁ	ANTIOQUIA
CAÑASGORDAS	ANTIOQUIA
DABEIBA	ANTIOQUIA
EBÉJICO	ANTIOQUIA
FRONTINO	ANTIOQUIA
GIRALDO	ANTIOQUIA
HELICONIA	ANTIOQUIA
LIBORINA	ANTIOQUIA
OLAYA	ANTIOQUIA
PEQUE	ANTIOQUIA
SABANALARGA	ANTIOQUIA
SAN JERÓNIMO	ANTIOQUIA
SANTAFÉ DE ANTIOQUIA	ANTIOQUIA
SOPETRaN	ANTIOQUIA
URAMITA	ANTIOQUIA
ABEJORRAL	ANTIOQUIA
ALEJANDRÍA	ANTIOQUIA
ARGELIA	ANTIOQUIA
CARMEN DE VIBORAL	ANTIOQUIA
COCORNÁ	ANTIOQUIA
CONCEPCIÓN	ANTIOQUIA
GRANADA	ANTIOQUIA
GUARNE	ANTIOQUIA
GUATAPE	ANTIOQUIA
LA CEJA	ANTIOQUIA
LA UNIÓN	ANTIOQUIA
MARINILLA	ANTIOQUIA
NARIÑO	ANTIOQUIA
PEÑOL	ANTIOQUIA
RETIRO	ANTIOQUIA
RIONEGRO	ANTIOQUIA
SAN CARLOS	ANTIOQUIA
SAN FRANCISCO	ANTIOQUIA
SAN LUIS	ANTIOQUIA
SAN RAFAEL	ANTIOQUIA
SAN VICENTE	ANTIOQUIA
SANTUARIO	ANTIOQUIA
SONSON	ANTIOQUIA
AMAGa	ANTIOQUIA
ANDES	ANTIOQUIA
ANGELOPOLIS	ANTIOQUIA
BETANIA	ANTIOQUIA
BETULIA	ANTIOQUIA
CAICEDO	ANTIOQUIA
CARAMANTA	ANTIOQUIA
CIUDAD BOLÍVAR	ANTIOQUIA
CONCORDIA	ANTIOQUIA
FREDONIA	ANTIOQUIA
HISPANIA	ANTIOQUIA
JARDÍN	ANTIOQUIA
JERICÓ	ANTIOQUIA
LA PINTADA	ANTIOQUIA
MONTEBELLO	ANTIOQUIA
PUEBLORRICO	ANTIOQUIA
SALGAR	ANTIOQUIA
SANTA BaRBARA	ANTIOQUIA
TÁMESIS	ANTIOQUIA
TARSO	ANTIOQUIA
TITIRIBÍ	ANTIOQUIA
URRAO	ANTIOQUIA
VALPARAISO	ANTIOQUIA
VENECIA	ANTIOQUIA
APARTADÓ	ANTIOQUIA
ARBOLETES	ANTIOQUIA
CAREPA	ANTIOQUIA
CHIGORODÓ	ANTIOQUIA
MURINDÓ	ANTIOQUIA
MUTATA	ANTIOQUIA
NECOCLÍ	ANTIOQUIA
SAN JUAN DE URABA	ANTIOQUIA
SAN PEDRO DE URABA	ANTIOQUIA
TURBO	ANTIOQUIA
VIGÍA DEL FUERTE	ANTIOQUIA
BARBOSA	ANTIOQUIA
BELLO	ANTIOQUIA
CALDAS	ANTIOQUIA
COPACABANA	ANTIOQUIA
ENVIGADO	ANTIOQUIA
GIRARDOTA	ANTIOQUIA
ITAGUI	ANTIOQUIA
LA ESTRELLA	ANTIOQUIA
MEDELLÍN	ANTIOQUIA
SABANETA	ANTIOQUIA
ARAUCA	ARAUCA
ARAUQUITA	ARAUCA
CRAVO NORTE	ARAUCA
FORTUL	ARAUCA
PUERTO RONDÓN	ARAUCA
SARAVENA	ARAUCA
TAME	ARAUCA
PROVIDENCIA Y SANTA CATALINA	ARCHIPIELAGO DE SAN ANDRES
SAN ANDReS	ARCHIPIELAGO DE SAN ANDRES
BARRANQUILLA	ATLÁNTICO
GALAPA	ATLÁNTICO
MALAMBO	ATLÁNTICO
PUERTO COLOMBIA	ATLÁNTICO
SOLEDAD	ATLÁNTICO
CAMPO DE LA CRUZ	ATLÁNTICO
CANDELARIA	ATLÁNTICO
LURUACO	ATLÁNTICO
MANATi	ATLÁNTICO
REPELON	ATLÁNTICO
SANTA LUCiA	ATLÁNTICO
SUAN	ATLÁNTICO
BARANOA	ATLÁNTICO
PALMAR DE VARELA	ATLÁNTICO
POLONUEVO	ATLÁNTICO
PONEDERA	ATLÁNTICO
SABANAGRANDE	ATLÁNTICO
SABANALARGA	ATLÁNTICO
SANTO TOMAS	ATLÁNTICO
JUAN DE ACOSTA	ATLÁNTICO
PIOJÓ	ATLÁNTICO
TUBARA	ATLÁNTICO
USIACURi	ATLÁNTICO
BOGOTÁ D.C.	BOGOTÁ D.C.
CICUCO	BOLIVAR
HATILLO DE LOBA	BOLIVAR
MARGARITA	BOLIVAR
MOMPÓS	BOLIVAR
SAN FERNANDO	BOLIVAR
TALAIGUA NUEVO	BOLIVAR
ARJONA	BOLIVAR
ARROYOHONDO	BOLIVAR
CALAMAR	BOLIVAR
CARTAGENA	BOLIVAR
CLEMENCIA	BOLIVAR
MAHATES	BOLIVAR
SAN CRISTOBAL	BOLIVAR
SAN ESTANISLAO	BOLIVAR
SANTA CATALINA	BOLIVAR
SANTA ROSA DE LIMA	BOLIVAR
SOPLAVIENTO	BOLIVAR
TURBACO	BOLIVAR
TURBANA	BOLIVAR
VILLANUEVA	BOLIVAR
ALTOS DEL ROSARIO	BOLIVAR
BARRANCO DE LOBA	BOLIVAR
EL PEÑON	BOLIVAR
REGIDOR	BOLIVAR
RÍO VIEJO	BOLIVAR
SAN MARTIN DE LOBA	BOLIVAR
ARENAL	BOLIVAR
CANTAGALLO	BOLIVAR
MORALES	BOLIVAR
SAN PABLO	BOLIVAR
SANTA ROSA DEL SUR	BOLIVAR
SIMITÍ	BOLIVAR
ACHÍ	BOLIVAR
MAGANGUÉ	BOLIVAR
MONTECRISTO	BOLIVAR
PINILLOS	BOLIVAR
SAN JACINTO DEL CAUCA	BOLIVAR
TIQUISIO	BOLIVAR
CARMEN DE BOLÍVAR	BOLIVAR
CÓRDOBA	BOLIVAR
EL GUAMO	BOLIVAR
MARÍA LA BAJA	BOLIVAR
SAN JACINTO	BOLIVAR
SAN JUAN NEPOMUCENO	BOLIVAR
ZAMBRANO	BOLIVAR
CHÍQUIZA	BOYACÁ
CHIVATÁ	BOYACÁ
CÓMBITA	BOYACÁ
CUCAITA	BOYACÁ
MOTAVITA	BOYACÁ
OICATÁ	BOYACÁ
SAMACÁ	BOYACÁ
SIACHOQUE	BOYACÁ
SORA	BOYACÁ
SORACÁ	BOYACÁ
SOTAQUIRÁ	BOYACÁ
TOCA	BOYACÁ
TUNJA	BOYACÁ
TUTA	BOYACÁ
VENTAQUEMADA	BOYACÁ
CHISCAS	BOYACÁ
CUBARÁ	BOYACÁ
EL COCUY	BOYACÁ
EL ESPINO	BOYACÁ
GUACAMAYAS	BOYACÁ
GÜICÁN	BOYACÁ
PANQUEBA	BOYACÁ
LABRANZAGRANDE	BOYACÁ
PAJARITO	BOYACÁ
PAYA	BOYACÁ
PISBA	BOYACÁ
BERBEO	BOYACÁ
CAMPOHERMOSO	BOYACÁ
MIRAFLORES	BOYACÁ
PÁEZ	BOYACÁ
SAN EDUARDO	BOYACÁ
ZETAQUIRA	BOYACÁ
BOYACÁ	BOYACÁ
CIÉNEGA	BOYACÁ
JENESANO	BOYACÁ
NUEVO COLÓN	BOYACÁ
RAMIRIQUÍ	BOYACÁ
RONDÓN	BOYACÁ
TIBANÁ	BOYACÁ
TURMEQUÉ	BOYACÁ
UMBITA	BOYACÁ
VIRACACHÁ	BOYACÁ
CHINAVITA	BOYACÁ
GARAGOA	BOYACÁ
MACANAL	BOYACÁ
PACHAVITA	BOYACÁ
SAN LUIS DE GACENO	BOYACÁ
SANTA MARÍA	BOYACÁ
BOAVITA	BOYACÁ
COVARACHÍA	BOYACÁ
LA UVITA	BOYACÁ
SAN MATEO	BOYACÁ
SATIVANORTE	BOYACÁ
SATIVASUR	BOYACÁ
SOATÁ	BOYACÁ
SUSACÓN	BOYACÁ
TIPACOQUE	BOYACÁ
BRICEÑO	BOYACÁ
BUENAVISTA	BOYACÁ
CALDAS	BOYACÁ
CHIQUINQUIRÁ	BOYACÁ
COPER	BOYACÁ
LA VICTORIA	BOYACÁ
MARIPÍ	BOYACÁ
MUZO	BOYACÁ
OTANCHE	BOYACÁ
PAUNA	BOYACÁ
PUERTO BOYACa	BOYACÁ
QUÍPAMA	BOYACÁ
SABOYÁ	BOYACÁ
SAN MIGUEL DE SEMA	BOYACÁ
SAN PABLO BORBUR	BOYACÁ
TUNUNGUÁ	BOYACÁ
ALMEIDA	BOYACÁ
CHIVOR	BOYACÁ
GUATEQUE	BOYACÁ
GUAYATÁ	BOYACÁ
LA CAPILLA	BOYACÁ
SOMONDOCO	BOYACÁ
SUTATENZA	BOYACÁ
TENZA	BOYACÁ
ARCABUCO	BOYACÁ
CHITARAQUE	BOYACÁ
GACHANTIVÁ	BOYACÁ
MONIQUIRÁ	BOYACÁ
RÁQUIRA	BOYACÁ
SÁCHICA	BOYACÁ
SAN JOSÉ DE PARE	BOYACÁ
SANTA SOFÍA	BOYACÁ
SANTANA	BOYACÁ
SUTAMARCHÁN	BOYACÁ
TINJACÁ	BOYACÁ
TOGÜÍ	BOYACÁ
VILLA DE LEYVA	BOYACÁ
AQUITANIA	BOYACÁ
CUÍTIVA	BOYACÁ
FIRAVITOBA	BOYACÁ
GAMEZA	BOYACÁ
IZA	BOYACÁ
MONGUA	BOYACÁ
MONGUÍ	BOYACÁ
NOBSA	BOYACÁ
PESCA	BOYACÁ
SOGAMOSO	BOYACÁ
TIBASOSA	BOYACÁ
TÓPAGA	BOYACÁ
TOTA	BOYACÁ
BELÉN	BOYACÁ
BUSBANZÁ	BOYACÁ
CERINZA	BOYACÁ
CORRALES	BOYACÁ
DUITAMA	BOYACÁ
FLORESTA	BOYACÁ
PAIPA	BOYACÁ
SAN ROSA VITERBO	BOYACÁ
TUTAZÁ	BOYACÁ
BETÉITIVA	BOYACÁ
CHITA	BOYACÁ
JERICÓ	BOYACÁ
PAZ DE RÍO	BOYACÁ
SOCHA	BOYACÁ
SOCOTÁ	BOYACÁ
TASCO	BOYACÁ
FILADELFIA	CALDAS
LA MERCED	CALDAS
MARMATO	CALDAS
RIOSUCIO	CALDAS
SUPÍA	CALDAS
MANZANARES	CALDAS
MARQUETALIA	CALDAS
MARULANDA	CALDAS
PENSILVANIA	CALDAS
ANSERMA	CALDAS
BELALCÁZAR	CALDAS
RISARALDA	CALDAS
SAN JOSÉ	CALDAS
VITERBO	CALDAS
CHINCHINa	CALDAS
MANIZALES	CALDAS
NEIRA	CALDAS
PALESTINA	CALDAS
VILLAMARiA	CALDAS
AGUADAS	CALDAS
ARANZAZU	CALDAS
PÁCORA	CALDAS
SALAMINA	CALDAS
LA DORADA	CALDAS
NORCASIA	CALDAS
SAMANÁ	CALDAS
VICTORIA	CALDAS
ALBANIA	CAQUETA
BELÉN DE LOS ANDAQUIES	CAQUETA
CARTAGENA DEL CHAIRÁ	CAQUETA
CURRILLO	CAQUETA
EL DONCELLO	CAQUETA
EL PAUJIL	CAQUETA
FLORENCIA	CAQUETA
LA MONTAÑITA	CAQUETA
MILaN	CAQUETA
MORELIA	CAQUETA
PUERTO RICO	CAQUETA
SAN JOSE DEL FRAGUA	CAQUETA
SAN VICENTE DEL CAGUÁN	CAQUETA
SOLANO	CAQUETA
SOLITA	CAQUETA
VALPARAISO	CAQUETA
AGUAZUL	CASANARE
CHAMEZA	CASANARE
HATO COROZAL	CASANARE
LA SALINA	CASANARE
MANÍ	CASANARE
MONTERREY	CASANARE
NUNCHÍA	CASANARE
OROCUÉ	CASANARE
PAZ DE ARIPORO	CASANARE
PORE	CASANARE
RECETOR	CASANARE
SABANALARGA	CASANARE
SÁCAMA	CASANARE
SAN LUIS DE PALENQUE	CASANARE
TÁMARA	CASANARE
TAURAMENA	CASANARE
TRINIDAD	CASANARE
VILLANUEVA	CASANARE
YOPAL	CASANARE
CAJIBÍO	CAUCA
EL TAMBO	CAUCA
LA SIERRA	CAUCA
MORALES	CAUCA
PIENDAMO	CAUCA
POPAYÁN	CAUCA
ROSAS	CAUCA
SOTARA	CAUCA
TIMBIO	CAUCA
BUENOS AIRES	CAUCA
CALOTO	CAUCA
CORINTO	CAUCA
MIRANDA	CAUCA
PADILLA	CAUCA
PUERTO TEJADA	CAUCA
SANTANDER DE QUILICHAO	CAUCA
SUAREZ	CAUCA
VILLA RICA	CAUCA
GUAPI	CAUCA
LOPEZ	CAUCA
TIMBIQUI	CAUCA
CALDONO	CAUCA
INZÁ	CAUCA
JAMBALO	CAUCA
PAEZ	CAUCA
PURACE	CAUCA
Silvia	CAUCA
TORIBIO	CAUCA
TOTORO	CAUCA
ALMAGUER	CAUCA
ARGELIA	CAUCA
BALBOA	CAUCA
BOLÍVAR	CAUCA
FLORENCIA	CAUCA
LA VEGA	CAUCA
MERCADERES	CAUCA
PATIA	CAUCA
PIAMONTE	CAUCA
SAN SEBASTIAN	CAUCA
SANTA ROSA	CAUCA
SUCRE	CAUCA
BECERRIL	CESAR
CHIMICHAGUA	CESAR
CHIRIGUANA	CESAR
CURUMANÍ	CESAR
LA JAGUA DE IBIRICO	CESAR
PAILITAS	CESAR
TAMALAMEQUE	CESAR
ASTREA	CESAR
BOSCONIA	CESAR
EL COPEY	CESAR
EL PASO	CESAR
AGUSTÍN CODAZZI	CESAR
LA PAZ	CESAR
MANAURE	CESAR
PUEBLO BELLO	CESAR
SAN DIEGO	CESAR
VALLEDUPAR	CESAR
AGUACHICA	CESAR
GAMARRA	CESAR
GONZÁLEZ	CESAR
LA GLORIA	CESAR
PELAYA	CESAR
RÍO DE ORO	CESAR
SAN ALBERTO	CESAR
SAN MARTÍN	CESAR
ATRATO	CHOCO
BAGADÓ	CHOCO
BOJAYA	CHOCO
EL CARMEN DE ATRATO	CHOCO
LLORÓ	CHOCO
MEDIO ATRATO	CHOCO
QUIBDÓ	CHOCO
RIO QUITO	CHOCO
ACANDÍ	CHOCO
BELÉN DE BAJIRA	CHOCO
CARMÉN DEL DARIÉN	CHOCO
RIOSUCIO	CHOCO
UNGUÍA	CHOCO
BAHÍA SOLANO	CHOCO
JURADÓ	CHOCO
NUQUÍ	CHOCO
ALTO BAUDÓ	CHOCO
BAJO BAUDÓ	CHOCO
El Litoral del San Juan	CHOCO
MEDIO BAUDÓ	CHOCO
CANTON DE SAN PABLO	CHOCO
CERTEGUI	CHOCO
CONDOTO	CHOCO
ITSMINA	CHOCO
MEDIO SAN JUAN	CHOCO
NÓVITA	CHOCO
RÍO FRÍO	CHOCO
SAN JOSÉ DEL PALMAR	CHOCO
SIPÍ	CHOCO
TADÓ	CHOCO
UNION PANAMERICANA	CHOCO
TIERRALTA	CORDOBA
VALENCIA	CORDOBA
CHIMÁ	CORDOBA
COTORRA	CORDOBA
LORICA	CORDOBA
MOMIL	CORDOBA
PURÍSIMA	CORDOBA
MONTERÍA	CORDOBA
CANALETE	CORDOBA
LOS CÓRDOBAS	CORDOBA
MOÑITOS	CORDOBA
PUERTO ESCONDIDO	CORDOBA
SAN ANTERO	CORDOBA
SAN BERNARDO DEL VIENTO	CORDOBA
CHINÚ	CORDOBA
SAHAGÚN	CORDOBA
SAN ANDRÉS SOTAVENTO	CORDOBA
AYAPEL	CORDOBA
BUENAVISTA	CORDOBA
LA APARTADA	CORDOBA
MONTELÍBANO	CORDOBA
PLANETA RICA	CORDOBA
Pueblo Nuevo	CORDOBA
PUERTO LIBERTADOR	CORDOBA
CERETÉ	CORDOBA
CIÉNAGA DE ORO	CORDOBA
SAN CARLOS	CORDOBA
SAN PELAYO	CORDOBA
CHOCONTÁ	CUNDINAMARCA
MACHETA	CUNDINAMARCA
MANTA	CUNDINAMARCA
SESQUILÉ	CUNDINAMARCA
SUESCA	CUNDINAMARCA
TIBIRITA	CUNDINAMARCA
VILLAPINZÓN	CUNDINAMARCA
AGUA DE DIOS	CUNDINAMARCA
GIRARDOT	CUNDINAMARCA
GUATAQUÍ	CUNDINAMARCA
JERUSALÉN	CUNDINAMARCA
NARIÑO	CUNDINAMARCA
NILO	CUNDINAMARCA
RICAURTE	CUNDINAMARCA
TOCAIMA	CUNDINAMARCA
CAPARRAPÍ	CUNDINAMARCA
GUADUAS	CUNDINAMARCA
PUERTO SALGAR	CUNDINAMARCA
ALBÁN	CUNDINAMARCA
LA PEÑA	CUNDINAMARCA
LA VEGA	CUNDINAMARCA
NIMAIMA	CUNDINAMARCA
NOCAIMA	CUNDINAMARCA
QUEBRADANEGRA	CUNDINAMARCA
SAN FRANCISCO	CUNDINAMARCA
SASAIMA	CUNDINAMARCA
SUPATÁ	CUNDINAMARCA
ÚTICA	CUNDINAMARCA
VERGARA	CUNDINAMARCA
VILLETA	CUNDINAMARCA
GACHALA	CUNDINAMARCA
GACHETA	CUNDINAMARCA
GAMA	CUNDINAMARCA
GUASCA	CUNDINAMARCA
GUATAVITA	CUNDINAMARCA
JUNÍN	CUNDINAMARCA
LA CALERA	CUNDINAMARCA
UBALÁ	CUNDINAMARCA
BELTRÁN	CUNDINAMARCA
BITUIMA	CUNDINAMARCA
CHAGUANÍ	CUNDINAMARCA
GUAYABAL DE SIQUIMA	CUNDINAMARCA
PULI	CUNDINAMARCA
SAN JUAN DE RÍO SECO	CUNDINAMARCA
VIANÍ	CUNDINAMARCA
MEDINA	CUNDINAMARCA
PARATEBUENO	CUNDINAMARCA
CAQUEZA	CUNDINAMARCA
CHIPAQUE	CUNDINAMARCA
CHOACHÍ	CUNDINAMARCA
FOMEQUE	CUNDINAMARCA
FOSCA	CUNDINAMARCA
GUAYABETAL	CUNDINAMARCA
GUTIÉRREZ	CUNDINAMARCA
QUETAME	CUNDINAMARCA
UBAQUE	CUNDINAMARCA
UNE	CUNDINAMARCA
EL PEÑÓN	CUNDINAMARCA
LA PALMA	CUNDINAMARCA
PACHO	CUNDINAMARCA
PAIME	CUNDINAMARCA
SAN CAYETANO	CUNDINAMARCA
TOPAIPI	CUNDINAMARCA
VILLAGOMEZ	CUNDINAMARCA
YACOPÍ	CUNDINAMARCA
CAJICÁ	CUNDINAMARCA
CHÍA	CUNDINAMARCA
COGUA	CUNDINAMARCA
GACHANCIPÁ	CUNDINAMARCA
NEMOCoN	CUNDINAMARCA
SOPÓ	CUNDINAMARCA
TABIO	CUNDINAMARCA
TOCANCIPÁ	CUNDINAMARCA
ZIPAQUIRÁ	CUNDINAMARCA
BOJACÁ	CUNDINAMARCA
COTA	CUNDINAMARCA
EL ROSAL	CUNDINAMARCA
FACATATIVÁ	CUNDINAMARCA
FUNZA	CUNDINAMARCA
MADRID	CUNDINAMARCA
MOSQUERA	CUNDINAMARCA
SUBACHOQUE	CUNDINAMARCA
TENJO	CUNDINAMARCA
ZIPACoN	CUNDINAMARCA
SIBATÉ	CUNDINAMARCA
SOACHA	CUNDINAMARCA
ARBELÁEZ	CUNDINAMARCA
CABRERA	CUNDINAMARCA
FUSAGASUGÁ	CUNDINAMARCA
GRANADA	CUNDINAMARCA
PANDI	CUNDINAMARCA
PASCA	CUNDINAMARCA
SAN BERNARDO	CUNDINAMARCA
SILVANIA	CUNDINAMARCA
TIBACUY	CUNDINAMARCA
VENECIA	CUNDINAMARCA
ANAPOIMA	CUNDINAMARCA
ANOLAIMA	CUNDINAMARCA
APULO	CUNDINAMARCA
CACHIPAY	CUNDINAMARCA
EL COLEGIO	CUNDINAMARCA
LA MESA	CUNDINAMARCA
QUIPILE	CUNDINAMARCA
SAN ANTONIO DE TEQUENDAMA	CUNDINAMARCA
TENA	CUNDINAMARCA
VIOTÁ	CUNDINAMARCA
CARMEN DE CARUPA	CUNDINAMARCA
CUCUNUBÁ	CUNDINAMARCA
FÚQUENE	CUNDINAMARCA
GUACHETÁ	CUNDINAMARCA
LENGUAZAQUE	CUNDINAMARCA
SIMIJACA	CUNDINAMARCA
SUSA	CUNDINAMARCA
SUTATAUSA	CUNDINAMARCA
TAUSA	CUNDINAMARCA
UBATE	CUNDINAMARCA
BARRANCO MINA	GUAINIA
CACAHUAL	GUAINIA
INÍRIDA	GUAINIA
LA GUADALUPE	GUAINIA
MAPIRIPaN	GUAINIA
MORICHAL	GUAINIA
PANA PANA	GUAINIA
PUERTO COLOMBIA	GUAINIA
SAN FELIPE	GUAINIA
CALAMAR	GUAVIARE
EL RETORNO	GUAVIARE
MIRAFLORES	GUAVIARE
SAN JOSÉ DEL GUAVIARE	GUAVIARE
AGRADO	HUILA
ALTAMIRA	HUILA
GARZÓN	HUILA
GIGANTE	HUILA
GUADALUPE	HUILA
PITAL	HUILA
SUAZA	HUILA
TARQUI	HUILA
AIPE	HUILA
ALGECIRAS	HUILA
BARAYA	HUILA
CAMPOALEGRE	HUILA
COLOMBIA	HUILA
HOBO	HUILA
IQUIRA	HUILA
NEIVA	HUILA
PALERMO	HUILA
RIVERA	HUILA
SANTA MARÍA	HUILA
TELLO	HUILA
TERUEL	HUILA
VILLAVIEJA	HUILA
YAGUARÁ	HUILA
LA ARGENTINA	HUILA
LA PLATA	HUILA
NÁTAGA	HUILA
PAICOL	HUILA
TESALIA	HUILA
ACEVEDO	HUILA
ELÍAS	HUILA
ISNOS	HUILA
OPORAPA	HUILA
PALESTINA	HUILA
PITALITO	HUILA
SALADOBLANCO	HUILA
SAN AGUSTÍN	HUILA
TIMANÁ	HUILA
ALBANIA	LA GUAJIRA
DIBULLA	LA GUAJIRA
MAICAO	LA GUAJIRA
MANAURE	LA GUAJIRA
RIOHACHA	LA GUAJIRA
URIBIA	LA GUAJIRA
BARRANCAS	LA GUAJIRA
DISTRACCION	LA GUAJIRA
EL MOLINO	LA GUAJIRA
FONSECA	LA GUAJIRA
HATONUEVO	LA GUAJIRA
LA JAGUA DEL PILAR	LA GUAJIRA
SAN JUAN DEL CESAR	LA GUAJIRA
URUMITA	LA GUAJIRA
VILLANUEVA	LA GUAJIRA
ARIGUANÍ	MAGDALENA
CHIBOLO	MAGDALENA
NUEVA GRANADA	MAGDALENA
PLATO	MAGDALENA
SABANAS DE SAN ANGEL	MAGDALENA
TENERIFE	MAGDALENA
ALGARROBO	MAGDALENA
ARACATACA	MAGDALENA
CIÉNAGA	MAGDALENA
EL RETEN	MAGDALENA
FUNDACION	MAGDALENA
PUEBLO VIEJO	MAGDALENA
ZONA BANANERA	MAGDALENA
CERRO SAN ANTONIO	MAGDALENA
CONCORDIA	MAGDALENA
EL PIÑON	MAGDALENA
PEDRAZA	MAGDALENA
PIVIJAY	MAGDALENA
REMOLINO	MAGDALENA
SALAMINA	MAGDALENA
SITIONUEVO	MAGDALENA
ZAPAYAN	MAGDALENA
SANTA MARTA	MAGDALENA
EL BANCO	MAGDALENA
GUAMAL	MAGDALENA
PIJIÑO DEL CARMEN	MAGDALENA
SAN SEBASTIAN DE BUENAVISTA	MAGDALENA
SAN ZENON	MAGDALENA
SANTA ANA	MAGDALENA
SANTA BARBARA DE PINTO	MAGDALENA
EL CASTILLO	META
EL DORADO	META
FUENTE DE ORO	META
GRANADA	META
LA MACARENA	META
LA URIBE	META
LEJANÍAS	META
MAPIRIPaN	META
MESETAS	META
PUERTO CONCORDIA	META
PUERTO LLERAS	META
PUERTO RICO	META
SAN JUAN DE ARAMA	META
VISTA HERMOSA	META
VILLAVICENCIO	META
ACACiAS	META
BARRANCA DE UPIA	META
CASTILLA LA NUEVA	META
CUMARAL	META
EL CALVARIO	META
GUAMAL	META
RESTREPO	META
SAN CARLOS GUAROA	META
SAN JUANITO	META
SAN LUIS DE CUBARRAL	META
SAN MARTÍN	META
CABUYARO	META
PUERTO GAITÁN	META
PUERTO LoPEZ	META
CHACHAGUI	NARIÑO
CONSACA	NARIÑO
EL PEÑOL	NARIÑO
EL TAMBO	NARIÑO
LA FLORIDA	NARIÑO
NARIÑO	NARIÑO
PASTO	NARIÑO
SANDONÁ	NARIÑO
TANGUA	NARIÑO
YACUANQUER	NARIÑO
ANCUYA	NARIÑO
GUAITARILLA	NARIÑO
LA LLANADA	NARIÑO
LINARES	NARIÑO
LOS ANDES	NARIÑO
MALLAMA	NARIÑO
OSPINA	NARIÑO
PROVIDENCIA	NARIÑO
RICAURTE	NARIÑO
SAMANIEGO	NARIÑO
SANTA CRUZ	NARIÑO
SAPUYES	NARIÑO
TUQUERRES	NARIÑO
BARBACOAS	NARIÑO
EL CHARCO	NARIÑO
FRANCISCO PIZARRO	NARIÑO
LA TOLA	NARIÑO
Magui	NARIÑO
MOSQUERA	NARIÑO
OLAYA HERRERA	NARIÑO
ROBERTO PAYAN	NARIÑO
SANTA BaRBARA	NARIÑO
TUMACO	NARIÑO
ALBAN	NARIÑO
ARBOLEDA	NARIÑO
BELEN	NARIÑO
BUESACO	NARIÑO
COLON	NARIÑO
CUMBITARA	NARIÑO
EL ROSARIO	NARIÑO
El Tablon de Gomez	NARIÑO
LA CRUZ	NARIÑO
LA UNION	NARIÑO
LEIVA	NARIÑO
POLICARPA	NARIÑO
SAN BERNARDO	NARIÑO
SAN LORENZO	NARIÑO
SAN PABLO	NARIÑO
SAN PEDRO DE CARTAGO	NARIÑO
TAMINANGO	NARIÑO
ALDANA	NARIÑO
CONTADERO	NARIÑO
CÓRDOBA	NARIÑO
CUASPUD	NARIÑO
CUMBAL	NARIÑO
FUNES	NARIÑO
GUACHUCAL	NARIÑO
GUALMATAN	NARIÑO
ILES	NARIÑO
IMUES	NARIÑO
IPIALES	NARIÑO
POTOSÍ	NARIÑO
PUERRES	NARIÑO
PUPIALES	NARIÑO
ARBOLEDAS	NORTE DE SANTANDER
CUCUTILLA	NORTE DE SANTANDER
GRAMALOTE	NORTE DE SANTANDER
LOURDES	NORTE DE SANTANDER
SALAZAR	NORTE DE SANTANDER
SANTIAGO	NORTE DE SANTANDER
VILLA CARO	NORTE DE SANTANDER
BUCARASICA	NORTE DE SANTANDER
EL TARRA	NORTE DE SANTANDER
SARDINATA	NORTE DE SANTANDER
TIBÚ	NORTE DE SANTANDER
ABREGO	NORTE DE SANTANDER
CACHIRÁ	NORTE DE SANTANDER
CONVENCIÓN	NORTE DE SANTANDER
EL CARMEN	NORTE DE SANTANDER
HACARÍ	NORTE DE SANTANDER
LA ESPERANZA	NORTE DE SANTANDER
LA PLAYA	NORTE DE SANTANDER
OCAÑA	NORTE DE SANTANDER
SAN CALIXTO	NORTE DE SANTANDER
TEORAMA	NORTE DE SANTANDER
CÚCUTA	NORTE DE SANTANDER
EL ZULIA	NORTE DE SANTANDER
LOS PATIOS	NORTE DE SANTANDER
PUERTO SANTANDER	NORTE DE SANTANDER
SAN CAYETANO	NORTE DE SANTANDER
VILLA DEL ROSARIO	NORTE DE SANTANDER
CÁCOTA	NORTE DE SANTANDER
CHITAGÁ	NORTE DE SANTANDER
MUTISCUA	NORTE DE SANTANDER
PAMPLONA	NORTE DE SANTANDER
PAMPLONITA	NORTE DE SANTANDER
SILOS	NORTE DE SANTANDER
BOCHALEMA	NORTE DE SANTANDER
CHINÁCOTA	NORTE DE SANTANDER
DURANIA	NORTE DE SANTANDER
HERRÁN	NORTE DE SANTANDER
LABATECA	NORTE DE SANTANDER
RAGONVALIA	NORTE DE SANTANDER
TOLEDO	NORTE DE SANTANDER
COLÓN	PUTUMAYO
MOCOA	PUTUMAYO
ORITO	PUTUMAYO
PUERTO ASIS	PUTUMAYO
PUERTO CAICEDO	PUTUMAYO
PUERTO GUZMAN	PUTUMAYO
PUERTO LEGUIZAMO	PUTUMAYO
SAN FRANCISCO	PUTUMAYO
SAN MIGUEL	PUTUMAYO
SANTIAGO	PUTUMAYO
SIBUNDOY	PUTUMAYO
VALLE DEL GUAMUEZ	PUTUMAYO
VILLA GARZON	PUTUMAYO
ARMENIA	QUINDIO
BUENAVISTA	QUINDIO
CALARCA	QUINDIO
CoRDOBA	QUINDIO
GeNOVA	QUINDIO
PIJAO	QUINDIO
FILANDIA	QUINDIO
SALENTO	QUINDIO
CIRCASIA	QUINDIO
LA TEBAIDA	QUINDIO
Montengro	QUINDIO
QUIMBAYA	QUINDIO
DOSQUEBRADAS	RISARALDA
LA VIRGINIA	RISARALDA
MARSELLA	RISARALDA
PEREIRA	RISARALDA
SANTA ROSA DE CABAL	RISARALDA
APÍA	RISARALDA
BALBOA	RISARALDA
BELÉN DE UMBRÍA	RISARALDA
GUÁTICA	RISARALDA
LA CELIA	RISARALDA
QUINCHiA	RISARALDA
SANTUARIO	RISARALDA
MISTRATÓ	RISARALDA
PUEBLO RICO	RISARALDA
CHIMA	SANTANDER
CONFINES	SANTANDER
CONTRATACIÓN	SANTANDER
EL GUACAMAYO	SANTANDER
GALÁN	SANTANDER
GAMBITA	SANTANDER
GUADALUPE	SANTANDER
GUAPOTÁ	SANTANDER
HATO	SANTANDER
OIBA	SANTANDER
PALMAR	SANTANDER
PALMAS DEL SOCORRO	SANTANDER
SANTA HELENA DEL OPÓN	SANTANDER
SIMACOTA	SANTANDER
SOCORRO	SANTANDER
SUAITA	SANTANDER
CAPITANEJO	SANTANDER
CARCASÍ	SANTANDER
CEPITÁ	SANTANDER
CERRITO	SANTANDER
CONCEPCIÓN	SANTANDER
ENCISO	SANTANDER
GUACA	SANTANDER
MACARAVITA	SANTANDER
MÁLAGA	SANTANDER
MOLAGAVITA	SANTANDER
SAN ANDRÉS	SANTANDER
SAN JOSÉ DE MIRANDA	SANTANDER
SAN MIGUEL	SANTANDER
ARATOCA	SANTANDER
BARICHARA	SANTANDER
CABRERA	SANTANDER
CHARALÁ	SANTANDER
COROMORO	SANTANDER
CURITÍ	SANTANDER
ENCINO	SANTANDER
JORDÁN	SANTANDER
MOGOTES	SANTANDER
OCAMONTE	SANTANDER
ONZAGA	SANTANDER
PÁRAMO	SANTANDER
PINCHOTE	SANTANDER
SAN GIL	SANTANDER
SAN JOAQUÍN	SANTANDER
VALLE DE SAN JOSÉ	SANTANDER
VILLANUEVA	SANTANDER
BARRANCABERMEJA	SANTANDER
BETULIA	SANTANDER
EL CARMEN DE CHUCURÍ	SANTANDER
PUERTO WILCHES	SANTANDER
SABANA DE TORRES	SANTANDER
SAN VICENTE DE CHUCURÍ	SANTANDER
ZAPATOCA	SANTANDER
BUCARAMANGA	SANTANDER
CALIFORNIA	SANTANDER
CHARTA	SANTANDER
EL PLAYÓN	SANTANDER
FLORIDABLANCA	SANTANDER
GIRÓN	SANTANDER
LEBRÍJA	SANTANDER
LOS SANTOS	SANTANDER
MATANZA	SANTANDER
PIEDECUESTA	SANTANDER
RIONEGRO	SANTANDER
SANTA BÁRBARA	SANTANDER
SURATA	SANTANDER
TONA	SANTANDER
VETAS	SANTANDER
AGUADA	SANTANDER
ALBANIA	SANTANDER
BARBOSA	SANTANDER
BOLÍVAR	SANTANDER
CHIPATÁ	SANTANDER
CIMITARRA	SANTANDER
EL PEÑÓN	SANTANDER
FLORIÁN	SANTANDER
GUAVATÁ	SANTANDER
GuEPSA	SANTANDER
JESÚS MARÍA	SANTANDER
LA BELLEZA	SANTANDER
LA PAZ	SANTANDER
LANDÁZURI	SANTANDER
PUENTE NACIONAL	SANTANDER
PUERTO PARRA	SANTANDER
SAN BENITO	SANTANDER
SUCRE	SANTANDER
VÉLEZ	SANTANDER
GUARANDA	SUCRE
MAJAGUAL	SUCRE
SUCRE	SUCRE
CHALÁN	SUCRE
COLOSO	SUCRE
MORROA	SUCRE
OVEJAS	SUCRE
SINCELEJO	SUCRE
COVEÑAS	SUCRE
PALMITO	SUCRE
SAN ONOFRE	SUCRE
SANTIAGO DE TOLÚ	SUCRE
TOLÚ VIEJO	SUCRE
BUENAVISTA	SUCRE
COROZAL	SUCRE
EL ROBLE	SUCRE
GALERAS	SUCRE
LOS PALMITOS	SUCRE
SAMPUÉS	SUCRE
SAN JUAN BETULIA	SUCRE
SAN PEDRO	SUCRE
SINCÉ	SUCRE
CAIMITO	SUCRE
LA UNIÓN	SUCRE
SAN BENITO ABAD	SUCRE
SAN MARCOS	SUCRE
AMBALEMA	TOLIMA
ARMERO	TOLIMA
FALAN	TOLIMA
FRESNO	TOLIMA
HONDA	TOLIMA
MARIQUITA	TOLIMA
PALOCABILDO	TOLIMA
CARMEN DE APICALÁ	TOLIMA
CUNDAY	TOLIMA
ICONONZO	TOLIMA
MELGAR	TOLIMA
VILLARRICA	TOLIMA
ATACO	TOLIMA
CHAPARRAL	TOLIMA
COYAIMA	TOLIMA
NATAGAIMA	TOLIMA
ORTEGA	TOLIMA
PLANADAS	TOLIMA
RIOBLANCO	TOLIMA
RONCESVALLES	TOLIMA
SAN ANTONIO	TOLIMA
ALVARADO	TOLIMA
ANZOÁTEGUI	TOLIMA
CAJAMARCA	TOLIMA
COELLO	TOLIMA
ESPINAL	TOLIMA
FLANDES	TOLIMA
IBAGUe	TOLIMA
PIEDRAS	TOLIMA
ROVIRA	TOLIMA
SAN LUIS	TOLIMA
VALLE DE SAN JUAN	TOLIMA
ALPUJARRA	TOLIMA
DOLORES	TOLIMA
GUAMO	TOLIMA
PRADO	TOLIMA
PURIFICACIÓN	TOLIMA
SALDAÑA	TOLIMA
SUÁREZ	TOLIMA
CASABIANCA	TOLIMA
HERVEO	TOLIMA
LeRIDA	TOLIMA
LiBANO	TOLIMA
MURILLO	TOLIMA
SANTA ISABEL	TOLIMA
VENADILLO	TOLIMA
VILLAHERMOSA	TOLIMA
ANDALUCÍA	VALLE DEL CAUCA
BUGA	VALLE DEL CAUCA
BUGALAGRANDE	VALLE DEL CAUCA
CALIMA	VALLE DEL CAUCA
EL CERRITO	VALLE DEL CAUCA
GINEBRA	VALLE DEL CAUCA
GUACARÍ	VALLE DEL CAUCA
RESTREPO	VALLE DEL CAUCA
RIOFRIO	VALLE DEL CAUCA
SAN PEDRO	VALLE DEL CAUCA
TRUJILLO	VALLE DEL CAUCA
TULUÁ	VALLE DEL CAUCA
YOTOCO	VALLE DEL CAUCA
ALCALa	VALLE DEL CAUCA
ANSERMANUEVO	VALLE DEL CAUCA
ARGELIA	VALLE DEL CAUCA
BOLÍVAR	VALLE DEL CAUCA
CARTAGO	VALLE DEL CAUCA
EL ÁGUILA	VALLE DEL CAUCA
EL CAIRO	VALLE DEL CAUCA
EL DOVIO	VALLE DEL CAUCA
LA UNIÓN	VALLE DEL CAUCA
LA VICTORIA	VALLE DEL CAUCA
OBANDO	VALLE DEL CAUCA
ROLDANILLO	VALLE DEL CAUCA
TORO	VALLE DEL CAUCA
ULLOA	VALLE DEL CAUCA
VERSALLES	VALLE DEL CAUCA
ZARZAL	VALLE DEL CAUCA
BUENAVENTURA	VALLE DEL CAUCA
CAICEDONIA	VALLE DEL CAUCA
SEVILLA	VALLE DEL CAUCA
CALI	VALLE DEL CAUCA
CANDELARIA	VALLE DEL CAUCA
DAGUA	VALLE DEL CAUCA
FLORIDA	VALLE DEL CAUCA
JAMUNDÍ	VALLE DEL CAUCA
LA CUMBRE	VALLE DEL CAUCA
PALMIRA	VALLE DEL CAUCA
PRADERA	VALLE DEL CAUCA
VIJES	VALLE DEL CAUCA
YUMBO	VALLE DEL CAUCA
CARURU	VAUPES
MITÚ	VAUPES
PACOA	VAUPES
PAPUNAHUA	VAUPES
TARAIRA	VAUPES
YAVARATÉ	VAUPES
CUMARIBO	VICHADA
LA PRIMAVERA	VICHADA
PUERTO CARREÑO	VICHADA
SANTA ROSALÍA	VICHADA`;

const EMPLOYEES_DEFAULT = [
    { name: "JUVENAL GALINDO", id: "79714232" }, { name: "LAURA PELAEZ", id: "1013678677" }, { name: "YASMIN LICED REYES", id: "1054678232" },
    { name: "DAVID STIVEN PIÑEROS", id: "1030590289" }, { name: "JOSUE LEONARDO SAIZ", id: "1070599026" }, { name: "JUAN SEBASTIAN VIZCAINO", id: "1193118884" },
    { name: "FRANCISCO MEDINA", id: "80162252" }, { name: "JORGE DIAZ CHALA", id: "80004281" }, { name: "YBCEN PARRA", id: "5652802" },
    { name: "JHONATAN ORTIZ", id: "1074136693" }, { name: "CARMEN HERNANDEZ", id: "1065870011" }, { name: "DARWUIN CHAVES", id: "1010077664" },
    { name: "JUAN DAVID PEÑA", id: "1064314463" }, { name: "NESTOR TOVAR", id: "80161439" }, { name: "YECID ALBUTRIA", id: "11321256" },
    { name: "BLANCA RODRIGUEZ", id: "1022923612" }, { name: "JUAN CARRULLO", id: "6312092" }, { name: "DANIEL PINILLA", id: "1001345038" },
    { name: "LISANDRO COLPAS", id: "1016122144" }, { name: "JUAN MAHECHA", id: "1072751156" }, { name: "HAROLD TREJOS", id: "1026257510" },
    { name: "FERNANDO GUZMAN", id: "79840710" }, { name: "DIDIER CASTILLO", id: "1013595300" }, { name: "ALDAIR TERAN", id: "1003063351" },
    { name: "DANIEL BELTRAN", id: "1023362121" }, { name: "ANDRES VIATELA", id: "1006130245" }, { name: "JOHN GARCIA", id: "79997110" },
    { name: "YEFERSON SEPULVEDA", id: "1059119310" }
];

// ==========================================
// OBJETO PRINCIPAL DE LA APLICACIÓN
// ==========================================
// Almacena el estado global de la aplicación de validación
let app = {
    role: null,                  // Rol del usuario ('picking' o 'validator')
    user: null,                  // Usuario validador actual {name, id}
    picker: null,                // Nombre del alistador del pedido
    pickingTime: null,           // Tiempo de alistamiento
    orderId: null,               // Número del pedido en validación
    alistamientoId: null,        // ID del alistamiento activo en el backend
    validacionId: null,          // ID de la validación activa en el backend
    clientInfo: {                // Información del cliente
        name: '',
        address: '',
        city: '',
        dept: ''
    },
    startTime: null,             // Fecha/hora de inicio de validación
    endTime: null,               // Fecha/hora de fin de validación
    masterData: {},              // Base de datos de referencias y unidades de empaque
    cityDeptMap: {},             // Mapa de ciudades a departamentos
    orderData: [],               // Array de items del pedido
    fullExcel: null,             // Datos completos del Excel cargado
    corrections: [],             // Historial de correcciones autorizadas
    pendingDeleteRef: null,      // Referencia pendiente de corrección
    observations: "",            // Observaciones de la validación
    supervisorMode: null,        // 'correction' o 'closure'
    supervisorAuthorized: false  // Estado de sesión de supervisor (Single Sign-On)
};

/**
 * Inicialización del sistema cuando el DOM está listo
 * - Carga la lista de empleados desde localStorage
 * - Configura el foco en el campo de PIN
 * - Registra eventos globales
 * - Inicializa la base de datos geográfica
 */
document.addEventListener('DOMContentLoaded', () => {
    // Guard: si no hay sesión, redirigir al login
    if (!localStorage.getItem('bp_token')) {
        window.location.href = '/login.html';
        return;
    }

    // Auto-login con JWT: saltar PIN y pasar directo al menú de rol
    const user = api.getUser();
    if (user) {
        app.user = { id: user.cedula, name: user.nombre };
        resetView('menu');
    }

    initEvents();
    initCityDeptData();
});

/**
 * Configura los event listeners principales del sistema
 * - Enter en campo de escaneo para procesar referencias
 * - Eventos de teclado para navegación y acciones rápidas
 */
function initEvents() {
    document.getElementById('scan-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            processScan(e.target.value);
            e.target.value = '';
        }
    });
    document.addEventListener('click', (e) => {
        if (!document.getElementById('view-validate').classList.contains('hidden')) {
            if (!['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(e.target.tagName)) document.getElementById('scan-input').focus();
        }
    });
}

// --- PARSING CITIES ---
/**
 * Inicializa la base de datos geográfica en memoria
 * Parsea CITIES_RAW_DATA y crea el mapa ciudad => departamento
 */
function initCityDeptData() {
    const lines = CITIES_RAW_DATA.split('\n');
    lines.forEach(line => {
        if (line.trim()) {
            // Asumimos separación por TAB o espacios múltiples
            const parts = line.split(/\t+/);
            if (parts.length >= 2) {
                const city = parts[0].trim().toUpperCase();
                const dept = parts[1].trim().toUpperCase();
                app.cityDeptMap[city] = dept;
            }
        }
    });
    console.log(`Cargadas ${Object.keys(app.cityDeptMap).length} ciudades.`);
}

// NAV
function resetView(target) {
    document.querySelectorAll('[id^="view-"]').forEach(el => el.classList.add('hidden'));
    document.getElementById('view-' + target).classList.remove('hidden');
}

function logout() {
    api.logout();
}

function returnToValidationStart() {
    document.getElementById('view-label').classList.add('hidden');
    document.getElementById('view-upload').classList.remove('hidden');
    document.getElementById('input-order-id-val').value = '';
    document.getElementById('input-order-id-val').focus();
}

// ==========================================
// AUTENTICACIÓN Y SELECCIÓN DE ROL
// ==========================================

/**
 * Verifica el PIN de acceso ingresado
 * Si es correcto, muestra el menú de selección de rol
 * Si es incorrecto, muestra alerta y limpia el campo
 */
function checkPin() {
    if (document.getElementById('input-pin').value === PIN_CODE) resetView('menu');
    else {
        alert("PIN INCORRECTO");
        document.getElementById('input-pin').value = '';
    }
}

/**
 * Selecciona el rol del usuario (alistador o validador)
 * @param {string} role - 'picking' para alistamiento o cualquier otro para validación
 */
function selectRole(role) {
    app.role = role;
    document.getElementById('view-menu').classList.add('hidden');
    if (role === 'picking') document.getElementById('view-picking').classList.remove('hidden');
    else {
        document.getElementById('view-login-validator').classList.remove('hidden');
        document.getElementById('login-id').focus();
    }
}

/**
 * Maneja el evento Enter en el campo de login
 */
function handleLoginEnter(e) {
    if (e.key === 'Enter') attemptLogin();
}

/**
 * Intenta autenticar al usuario validador
 * Busca el ID en la lista de empleados y si existe, lo autentica
 * Luego muestra la pantalla de carga de Excel o intenta sincronizar datos
 */
async function attemptLogin() {
    // El usuario ya está autenticado via JWT desde login.html
    // Esta función ahora carga empleados desde el backend para el selector de alistador
    try {
        const empleados = await api.getEmpleados();
        // Poblar el selector de alistadores si existe en el HTML
        const selectAlistador = document.getElementById('select-picker');
        if (selectAlistador) {
            selectAlistador.innerHTML = '<option value="">-- Seleccionar --</option>';
            empleados.forEach(e => {
                const opt = document.createElement('option');
                opt.value = e.id;
                opt.textContent = e.nombre;
                selectAlistador.appendChild(opt);
            });
        }
    } catch (err) {
        console.warn("No se pudieron cargar empleados:", err.message);
    }

    const user = api.getUser();
    app.user = { id: user.cedula, name: user.nombre };

    document.getElementById('view-login-validator').classList.add('hidden');
    document.getElementById('view-upload').classList.remove('hidden');

    showFileStatus(app.fullExcel && app.fullExcel.length > 0);
}

// ==========================================
// SINCRONIZACIÓN DE DATOS MAESTROS
// TODO (futuro): reemplazar la carga manual de Excel por sincronización automática
// con Google Sheets publicado como CSV. La URL y la lógica de parseo ya estaban
// implementadas en fetchMasterData() — se desactivó porque los proxies CORS
// públicos (allorigins.win, corsproxy.io) son inestables en producción.
// Alternativa recomendada: crear un endpoint en el backend que haga el fetch
// server-side y exponga los datos como /api/referencias, eliminando la dependencia
// de proxies externos.
//
// URL original de Sheets:
// https://docs.google.com/spreadsheets/d/e/2PACX-1vSPQdfoNhLGDrjllSqgR_4lQxH0GmxQ02XHG9txUynTDQQXG6Vg8chO95cZQVlge0HctFCvgTIciBPS/pub?gid=1080426998&single=true&output=csv
// ==========================================

/**
 * Obtiene los datos maestros de productos desde Google Sheets
 * Utiliza múltiples proxies CORS para mayor confiabilidad
 * Parsea el CSV y extrae las unidades de empaque de cada referencia
 * Los datos se almacenan en app.masterData
 * 
 * Estrategia de conexión:
 * 1. Intenta conectar con el primer proxy
 * 2. Si falla, intenta con el segundo proxy
 * 3. Si todos fallan, muestra error al usuario
 */
async function fetchMasterData() {
    const spinner = document.getElementById('sync-spinner');
    const syncText = document.getElementById('sync-text');

    // Estrategia: Intentar Proxy 1, si falla, Proxy 2
    const proxies = [
        "https://api.allorigins.win/raw?url=",
        "https://corsproxy.io/?"
    ];

    let csvText = null;

    for (const proxyBase of proxies) {
        try {
            const target = proxyBase + encodeURIComponent(GOOGLE_SHEET_URL);
            console.log("Intentando conectar vía:", proxyBase);
            const response = await fetch(target);
            if (response.ok) {
                csvText = await response.text();
                break; // Éxito, salir del loop
            }
        } catch (e) {
            console.warn("Fallo proxy:", proxyBase, e);
        }
    }

    if (csvText) {
        Papa.parse(csvText, {
            header: true,
            complete: (res) => {
                res.data.forEach(row => {
                    const vals = Object.values(row);
                    const keys = Object.keys(row);

                    let refVal = row['REFERENCIA'] || row['Referencia'];
                    if (!refVal) {
                        const keyRef = keys.find(k => k.toUpperCase().includes('REFERENCIA'));
                        if (keyRef) refVal = row[keyRef];
                        else refVal = vals[0];
                    }

                    let unitVal = row['UNIDAD DE EMPAQUE'] || row['Unidad de Empaque'];
                    if (!unitVal) {
                        const keyUnit = keys.find(k => k.toUpperCase().includes('UNIDAD') || k.toUpperCase().includes('EMPAQUE'));
                        if (keyUnit) unitVal = row[keyUnit];
                        else unitVal = vals[1];
                    }

                    const ref = String(refVal || "").trim();
                    const unitStr = String(unitVal || "1");

                    let multiplier = 1;
                    const match = unitStr.match(/(\d+)/);
                    if (match) multiplier = parseInt(match[0]);

                    if (ref) app.masterData[ref] = {
                        unit: multiplier,
                        unitLabel: unitStr
                    };
                });

                // Feedback visual de éxito
                spinner.classList.remove('animate-spin', 'border-blue-800');
                spinner.classList.add('bg-green-500', 'border-none');
                syncText.textContent = "Base de datos sincronizada correctamente.";
                syncText.classList.remove('text-blue-800');
                syncText.classList.add('text-green-700');
            },
            error: (err) => {
                handleNetworkError(err, spinner, syncText);
            }
        });
    } else {
        handleNetworkError("No se pudo conectar con ningún proxy.", spinner, syncText);
    }
}

/**
 * Maneja errores de conexión al intentar sincronizar datos
 * Actualiza la interfaz para mostrar el estado de error
 * @param {Error|string} err - Error de conexión
 * @param {HTMLElement} spinner - Elemento del spinner de carga
 * @param {HTMLElement} syncText - Elemento de texto de estado
 */
function handleNetworkError(err, spinner, syncText) {
    console.error("Error Fatal CORS/Red:", err);
    spinner.classList.remove('animate-spin');
    spinner.classList.add('bg-red-500', 'border-none');
    syncText.textContent = "Error de conexión. Intente recargar.";
    syncText.classList.add('text-red-700');
    alert("No se pudo cargar la base de datos de Google Sheets. Verifique su conexión a internet.");
}

/**
 * Actualiza la visibilidad de los paneles de carga y estado del archivo
 * @param {boolean} hasData - Si hay datos de Excel cargados
 */
function showFileStatus(hasData) {
    document.getElementById('file-status-panel').classList.toggle('hidden', !hasData);
    document.getElementById('upload-zone').classList.toggle('hidden', hasData);
    document.getElementById('validation-start-panel').classList.toggle('hidden', !hasData);
    if (hasData) setTimeout(() => document.getElementById('input-order-id-val').focus(), 100);
}

/**
 * Wrapper con timeout para iniciar la carga del Excel
 * @param {HTMLInputElement} input - Input de tipo file
 */
function initExcelUpload(input) {
    setTimeout(() => handleExcelUpload(input), 100);
}

/**
 * Procesa y carga el archivo Excel seleccionado
 * Lee la hoja DATA_DIARIA y extrae todos los pedidos
 * Ya no lee la tabla de municipios del Excel, usa la base interna
 * @param {HTMLInputElement} input - Input de tipo file
 */
function handleExcelUpload(input) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const wb = XLSX.read(e.target.result, {
                type: 'binary'
            });
            let sheetName = wb.SheetNames.find(n => n.includes("DATA_DIARA") || n.includes("DATA_DIARIA")) || wb.SheetNames[0];
            app.fullExcel = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);

            // YA NO LEEMOS TABLA_MUNICIPIOS DEL EXCEL, USAMOS LA INTERNA

            document.getElementById('current-file-name').textContent = input.files[0].name;
            showFileStatus(true);
        } catch (err) {
            alert("Error archivo");
            location.reload();
        }
    };
    reader.readAsBinaryString(input.files[0]);
}

/**
 * Permite reiniciar y cargar un nuevo archivo Excel
 */
function resetExcelData() {
    if (confirm("¿Cargar nuevo archivo?")) {
        app.fullExcel = null;
        showFileStatus(false);
    }
}

// ==========================================
// INICIO Y CONFIGURACIÓN DE VALIDACIÓN
// ==========================================

/**
 * Verifica el alistador del pedido y comienza la validación
 * Busca en el historial de alistamiento quién alistó el pedido
 * Si no encuentra registro, solicita selección manual del alistador
 */
async function checkPickerAndStart() {
    const orderId = document.getElementById('input-order-id-val').value.trim().toUpperCase();
    if (!orderId) return alert("DIGITE PEDIDO");

    // Buscar alistador en historial local
    const history = JSON.parse(localStorage.getItem('brakepak_picking_history') || "[]");
    const pickRecord = [...history].reverse().find(r => r.order === orderId);

    if (pickRecord) {
        app.picker = pickRecord.picker;
        startValidation(orderId);
    } else {
        // Mostrar selección manual usando la API
        const select = document.getElementById('manual-picker-select');
        select.innerHTML = '<option value="">-- SELECCIONE --</option>';
        try {
            const empleados = await api.getEmpleados();
            empleados.forEach(e => {
                select.innerHTML += `<option value="${e.nombre}">${e.nombre}</option>`;
            });
        } catch (err) {
            select.innerHTML += '<option disabled>Error cargando empleados</option>';
        }
        app.tempOrderId = orderId;
        document.getElementById('modal-picker-select').classList.remove('hidden');
        document.getElementById('modal-picker-select').classList.add('flex');
    }
}

/**
 * Confirma la selección manual del alistador
 * Se usa cuando no hay registro automático en el historial
 */
function confirmManualPicker() {
    const val = document.getElementById('manual-picker-select').value;
    if (!val) return alert("Seleccione un funcionario");
    app.picker = val;
    document.getElementById('modal-picker-select').classList.add('hidden');
    document.getElementById('modal-picker-select').classList.remove('flex');
    startValidation(app.tempOrderId);
}

/**
 * Inicia el proceso de validación de un pedido
 * - Carga los datos del pedido desde el Excel
 * - Extrae información del cliente (nombre, dirección, ciudad, departamento)
 * - Crea el array de items a validar con sus unidades de empaque
 * - Inicializa la interfaz de validación
 * @param {string} orderId - Número del pedido a validar
 */
async function startValidation(orderId) {
    app.orderId = orderId;
    app.corrections = [];
    app.observations = "";
    app.supervisorAuthorized = false;
    app.validacionId = null;

    document.getElementById('input-observations').value = "";
    app.startTime = new Date();

    const row0 = app.fullExcel[0];
    const keys = Object.keys(row0);
    const kOrder = keys.find(k => k.match(/pedido/i)) || keys[0];
    const kRef = keys.find(k => k.match(/referencia|material/i)) || keys[1];
    const kDesc = keys.find(k => k.match(/descrip/i)) || keys[2];
    const kQty = keys.find(k => k.match(/cant/i)) || keys[3];
    const kClient = keys.find(k => k.toUpperCase().includes("DESTINATARIO") || k.match(/cliente|nombre/i)) || keys[2];
    const kAddr = keys.find(k => k.match(/direcc/i));

    // FORCE COLUMN E (Index 4) for CITY if regex fails or generic
    const kCity = keys.find(k => k.match(/ciudad|municipio/i)) || keys[4];

    const rows = app.fullExcel.filter(r => String(r[kOrder]).trim() == orderId);
    if (rows.length === 0) return alert("Pedido no encontrado en Excel");

    const r = rows[0];
    app.clientInfo.name = kClient ? r[kClient] : "---";
    app.clientInfo.address = kAddr ? r[kAddr] : "";

    // EXTRAER CIUDAD (Column E / Index 4 logic enforced)
    let rawCity = "";
    if (r[kCity]) {
        rawCity = String(r[kCity]).toUpperCase().trim();
    } else {
        // Fallback hardcoded to values index 4 if object key is missing
        const vals = Object.values(r);
        if (vals.length > 4) rawCity = String(vals[4]).toUpperCase().trim();
    }

    app.clientInfo.city = rawCity;
    // BUSQUEDA EN MAPA INTERNO EXCLUSIVAMENTE
    app.clientInfo.dept = app.cityDeptMap[rawCity] || "---";

    app.orderData = rows.map(r => {
        const ref = String(r[kRef]).trim();
        const master = app.masterData[ref] || {
            unit: 1,
            unitLabel: "1"
        }; // Default 1
        return {
            ref: ref,
            desc: r[kDesc] || "...",
            unit: master.unit, // Valor numérico para multiplicar
            unitLabel: master.unitLabel, // Texto para mostrar en la columna "UND EMPAQUE"
            expected: parseInt(r[kQty]) || 0,
            scanned: 0,
            status: 'pending'
        };
    });

    // Registrar validación en el backend
    try {
        const result = await api.iniciarValidacion(orderId, app.startTime.toISOString());
        app.validacionId = result.id;
    } catch (e) {
        console.warn("No se pudo registrar validación en backend:", e.message);
    }

    document.getElementById('view-upload').classList.add('hidden');
    document.getElementById('view-validate').classList.remove('hidden');

    document.getElementById('info-order-id').textContent = app.orderId;
    document.getElementById('info-client').textContent = app.clientInfo.name;
    document.getElementById('info-picker').textContent = app.picker;
    document.getElementById('info-start-time').textContent = app.startTime.toLocaleTimeString();

    renderTable();
    document.getElementById('scan-input').focus();
}

// ==========================================
// LÓGICA DE ESCANEO Y VALIDACIÓN
// ==========================================

/**
 * Procesa el código escaneado durante la validación
 * - Si el item existe en el pedido, incrementa su contador por la unidad de empaque
 * - Si el item no existe, lo marca como "NO SOLICITADO" (error)
 * - Genera feedback visual y auditivo según el resultado
 * - Actualiza la tabla de validación
 * @param {string} code - Código de referencia escaneado
 */
function processScan(code) {
    code = code.trim();
    if (!code) return;
    const item = app.orderData.find(i => i.ref === code || i.ref === code.toUpperCase());
    const logDiv = document.getElementById('scan-log');

    if (item) {
        const qty = item.unit; // Multiplica por unidad de empaque guardada
        item.scanned += qty;
        logDiv.innerHTML = `<div class="text-green-700 border-b py-1 font-bold"><i class="fa-solid fa-check"></i> ${code} (+${qty})</div>` + logDiv.innerHTML;
        playTone(item.scanned > item.expected ? 200 : 600, item.scanned > item.expected ? 'sawtooth' : 'sine');
    } else {
        let extra = app.orderData.find(i => i.ref === code && i.isExtra);
        if (extra) extra.scanned++;
        else app.orderData.push({
            ref: code,
            desc: "NO SOLICITADO",
            unit: 1,
            unitLabel: "1",
            expected: 0,
            scanned: 1,
            isExtra: true
        });
        playTone(100, 'square');
        logDiv.innerHTML = `<div class="text-red-600 font-bold border-b py-1"><i class="fa-solid fa-ban"></i> ${code} (ERROR)</div>` + logDiv.innerHTML;
    }
    renderTable();
}

/**
 * Renderiza la tabla de validación con todos los items del pedido
 * Muestra:
 * - Referencia y descripción del producto
 * - Unidad de empaque
 * - Cantidad esperada vs escaneada
 * - Estado visual (correcto, faltante, sobrante, no pedido)
 * - Botón de corrección (requiere supervisor)
 * 
 * Calcula:
 * - Total de errores y faltantes
 * - Porcentaje de progreso de la validación
 */
function renderTable() {
    const tbody = document.getElementById('order-table-body');
    tbody.innerHTML = '';
    let missing = 0,
        errors = 0,
        totalExp = 0,
        totalScan = 0;

    app.orderData.forEach(item => {
        if (!item.isExtra) totalExp += item.expected;
        totalScan += item.scanned;
        const diff = item.scanned - item.expected;
        let statusHTML = '',
            rowClass = 'bg-white border-b hover:bg-slate-50';

        if (item.isExtra) {
            rowClass = 'bg-red-50 border-red-100';
            statusHTML = '<span class="text-brand-red font-bold text-[10px]">NO PEDIDO</span>';
            errors++;
        } else if (item.scanned === item.expected) {
            rowClass = 'bg-green-50 border-green-100';
            statusHTML = '<i class="fa-solid fa-check text-green-600 text-lg"></i>';
        } else if (item.scanned > item.expected) {
            rowClass = 'bg-yellow-50 border-yellow-100';
            statusHTML = `<span class="text-yellow-700 font-bold text-[10px]">+${diff}</span>`;
            errors++;
        } else {
            statusHTML = `<span class="text-slate-400 font-bold text-[10px]">-${Math.abs(diff)}</span>`;
            missing++;
        }

        const deleteBtn = (item.scanned > 0 || item.isExtra) ? `<button onclick="openSupervisor('correction', '${item.ref}')" class="text-slate-300 hover:text-brand-red ml-2"><i class="fa-solid fa-eraser"></i></button>` : '';

        tbody.innerHTML += `
            <div class="grid grid-cols-12 ${rowClass} text-xs py-3 px-2 items-center">
                <div class="col-span-4 font-bold text-slate-700 truncate text-left pl-2 text-sm">${item.ref} <br> <span class="text-[9px] font-normal text-slate-400 uppercase">${item.desc.substring(0,20)}</span></div>
                <div class="col-span-3 text-center text-slate-800 font-black text-base bg-slate-100 mx-2 rounded py-1">${item.unitLabel}</div>
                <div class="col-span-2 text-center font-mono text-slate-500 text-base">${item.expected}</div>
                <div class="col-span-2 text-center font-black text-xl ${item.scanned > item.expected ? 'text-brand-red' : (item.scanned==item.expected ? 'text-green-600' : 'text-slate-800')}">${item.scanned} ${deleteBtn}</div>
                <div class="col-span-1 text-center">${statusHTML}</div>
            </div>`;
    });
    document.getElementById('count-error').textContent = errors + missing;
    document.getElementById('progress-text').textContent = (totalExp > 0 ? Math.round(((totalScan - (totalScan > totalExp ? totalScan - totalExp : 0)) / totalExp) * 100) : 0) + "%";
}

// ==========================================
// FINALIZACIÓN DE VALIDACIÓN
// ==========================================

/**
 * Intenta finalizar la validación
 * Si hay errores, requiere autorización de supervisor
 * Si no hay errores, finaliza directamente
 */
function tryFinishValidation() {
    const errors = parseInt(document.getElementById('count-error').textContent);
    app.observations = document.getElementById('input-observations').value.trim().toUpperCase();

    if (errors > 0) {
        openSupervisor('closure', null);
    } else {
        finishValidation(false);
    }
}

/**
 * Finaliza el proceso de validación y genera la etiqueta de constancia
 * @param {boolean} hasNews - Si la validación se cerró con novedades
 */
async function finishValidation(hasNews) {
    app.endTime = new Date();

    // Cerrar validación en el backend
    if (app.validacionId) {
        const totalUnidades = app.orderData.reduce((s, i) => s + i.scanned, 0);
        try {
            await api.cerrarValidacion(app.validacionId, {
                hora_fin: app.endTime.toISOString(),
                total_unidades: totalUnidades,
                estado: hasNews ? "CON_NOVEDADES" : "OK",
                observaciones: app.observations || null,
                cerrado_con_novedades: hasNews,
            });
        } catch (e) {
            console.warn("No se pudo cerrar validación en backend:", e.message);
        }
    }

    document.getElementById('view-validate').classList.add('hidden');
    document.getElementById('view-label').classList.remove('hidden');

    const labelContent = generateLabelHTML(hasNews);
    document.getElementById('label-copy-1').innerHTML = labelContent;
    document.getElementById('label-copy-2').innerHTML = labelContent;
}

/**
 * Genera el HTML de la etiqueta de constancia de validación
 * Incluye:
 * - Información del pedido y cliente
 * - Datos del alistador y validador
 * - Timestamps de inicio y fin
 * - Estado de la validación (OK o con novedades)
 * - Observaciones (si las hay)
 * - Historial de correcciones autorizadas
 * @param {boolean} hasNews - Si hay novedades en la validación
 * @returns {string} HTML completo de la etiqueta
 */
function generateLabelHTML(hasNews) {
    const total = app.orderData.reduce((s, i) => s + i.scanned, 0);
    const status = hasNews ? "CERRADO CON NOVEDADES DE ALISTAMIENTO" : "PERFECTO - OK";
    const statusClass = hasNews ? "text-brand-red" : "text-green-700";

    let correctionsHTML = '';
    if (hasNews && app.corrections.length > 0) {
        correctionsHTML = `<div class="p-4 bg-white border-t-2 border-black text-xs"><h4 class="font-bold uppercase">Historial Novedades:</h4><ul class="list-disc pl-4 font-mono">`;
        app.corrections.forEach(c => correctionsHTML += `<li>${c.log}</li>`);
        correctionsHTML += `</ul></div>`;
    }

    let obsHTML = app.observations ? `<div class="p-4 bg-white border-t-2 border-black text-xs obs-box"><h4 class="font-bold uppercase">Observaciones:</h4><p class="font-mono">${app.observations}</p></div>` : '';

    return `
        <div class="label-header"><h2 class="font-black text-2xl uppercase">Constancia de Validación</h2><div class="text-3xl font-gotham tracking-tighter">L<i class="fa-solid fa-arrows-spin text-black mx-1"></i>GIMAT</div></div>
        <div class="label-grid text-sm text-slate-900">
            <div class="label-row"><div class="label-key">N° PEDIDO</div><div class="label-val py-6 justify-center"><span class="big-order">${app.orderId}</span></div></div>
            <div class="label-row"><div class="label-key">CLIENTE</div><div class="label-val text-xl font-bold uppercase">${app.clientInfo.name}</div></div>
            <div class="label-row"><div class="label-key">ALISTADO POR</div><div class="label-val uppercase font-bold">${app.picker}</div></div>
            <div class="label-row"><div class="label-key">VALIDADO POR</div><div class="label-val uppercase font-bold">${app.user.name}</div></div>
            <div class="label-row"><div class="label-key">F/H INI VALIDACIÓN</div><div class="label-val font-mono text-xs">${app.startTime.toLocaleString()}</div></div>
            <div class="label-row"><div class="label-key">F/H FIN VALIDACIÓN</div><div class="label-val font-mono font-bold text-xs">${app.endTime.toLocaleString()}</div></div>
            <div class="label-row"><div class="label-key">TOTAL UNIDADES</div><div class="label-val text-2xl font-black">${total}</div></div>
            <div class="label-row"><div class="label-key">DIRECCIÓN</div><div class="label-val uppercase text-xs">${app.clientInfo.address}</div></div>
            <div class="label-row"><div class="label-key">CIUDAD</div><div class="label-val uppercase font-bold">${app.clientInfo.city}</div></div>
            <div class="label-row"><div class="label-key">DEPARTAMENTO</div><div class="label-val uppercase font-bold">${app.clientInfo.dept}</div></div>
            <div class="label-row"><div class="label-key">ESTADO</div><div class="label-val font-black uppercase text-lg ${statusClass}" id="lbl-status">${status}</div></div>
        </div>
        ${obsHTML}
        ${correctionsHTML}
    `;
}

// ==========================================
// SISTEMA DE AUTORIZACIÓN DE SUPERVISOR
// ==========================================

/**
 * Abre el modal de supervisor para autorizar una acción
 * Soporta Single Sign-On: si ya hay una sesión activa, no pide código nuevamente
 * @param {string} mode - 'closure' para cierre con novedades, 'correction' para corrección
 * @param {string} ref - Referencia del item a corregir (solo para modo 'correction')
 */
function openSupervisor(mode, ref) {
    app.supervisorMode = mode;
    app.pendingDeleteRef = ref;
    document.getElementById('modal-supervisor').classList.remove('hidden');
    document.getElementById('modal-supervisor').classList.add('flex');
    document.getElementById('modal-super-title').textContent = mode === 'closure' ? "AUTORIZAR CIERRE CON NOVEDADES" : "AUTORIZAR CORRECCIÓN";

    // SINGLE SIGN-ON LOGIC
    if (app.supervisorAuthorized) {
        document.getElementById('supervisor-auth-section').classList.add('hidden');
        document.getElementById('modal-super-msg').textContent = "Sesión autorizada. Seleccione la causa:";
        document.getElementById('supervisor-code').value = "SESSION_ACTIVE"; // Dummy value to pass empty check if needed, logic handled in check function
    } else {
        document.getElementById('supervisor-auth-section').classList.remove('hidden');
        document.getElementById('modal-super-msg').textContent = "Se requiere credencial para continuar";
        document.getElementById('supervisor-code').value = "";
        setTimeout(() => document.getElementById('supervisor-code').focus(), 100);
    }

    document.getElementById('supervisor-reason').value = "";
}

/**
 * Cierra el modal de autorización de supervisor
 */
function closeSupervisorModal() {
    document.getElementById('modal-supervisor').classList.add('hidden');
    document.getElementById('modal-supervisor').classList.remove('flex');
    if (!app.supervisorAuthorized) document.getElementById('supervisor-code').value = '';
}

/**
 * Verifica el código de supervisor y procesa la acción
 * Si ya hay sesión activa (Single Sign-On), procede directamente
 * Si no, valida el código ingresado y activa la sesión si es correcto
 */
function checkSupervisorCode() {
    const reason = document.getElementById('supervisor-reason').value;

    if (!reason) return alert("Seleccione la causa");

    // Si ya está autorizado, procedemos directamente
    if (app.supervisorAuthorized) {
        processSupervisorAction(reason, "SESIÓN ACTIVA");
        return;
    }

    // Si no, validamos código
    const code = document.getElementById('supervisor-code').value;
    const supervisorName = SUPERVISORS[code];

    if (supervisorName) {
        app.supervisorAuthorized = true; // ACTIVAR SESIÓN
        processSupervisorAction(reason, supervisorName);
    } else {
        alert("Código Incorrecto");
    }
}

/**
 * Procesa la acción autorizada por el supervisor
 * - Si es 'correction': reduce el contador del item y registra la corrección
 * - Si es 'closure': registra el cierre forzado y finaliza la validación
 * @param {string} reason - Razón/causa seleccionada para la acción
 * @param {string} supervisorName - Nombre del supervisor que autorizó
 */
function processSupervisorAction(reason, supervisorName) {
    if (app.supervisorMode === 'correction') {
        const item = app.orderData.find(i => i.ref === app.pendingDeleteRef);
        const sub = item.unit || 1;
        if (item.scanned > 0) item.scanned -= sub;
        app.corrections.push({
            log: `${app.pendingDeleteRef}: Corrección (-${sub}) - ${reason}`
        });
        closeSupervisorModal();
        renderTable();
    } else if (app.supervisorMode === 'closure') {
        app.corrections.push({
            log: `CIERRE FORZADO CON DIFERENCIAS - ${reason}`
        });
        closeSupervisorModal();
        finishValidation(true);
    }
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

/**
 * Genera un tono de audio simple para feedback auditivo
 * @param {number} f - Frecuencia del tono en Hz
 * @param {string} t - Tipo de onda ('sine', 'sawtooth', 'square')
 */
function playTone(f, t) {
    try {
        const c = new(window.AudioContext || window.webkitAudioContext);
        const o = c.createOscillator();
        const g = c.createGain();
        o.type = t;
        o.frequency.value = f;
        o.connect(g);
        g.connect(c.destination);
        o.start();
        o.stop(c.currentTime + 0.15);
    } catch (e) {}
}

/**
 * Prepara y envía un reporte de validación por email
 * Genera un resumen completo con todos los datos de la validación
 * @param {string} service - 'gmail' para abrir Gmail web, otro para cliente de correo local
 */
function sendReportEmail(service) {
    const subject = `Reporte Fin Validacion de pedido - ${app.orderId}`;
    const status = document.getElementById('lbl-status') ? document.getElementById('lbl-status').textContent : "";
    const total = app.orderData.reduce((s, i) => s + i.scanned, 0);

    let body = `REPORTE DE VALIDACIÓN - LOGIMAT\n\n`;
    body += `PEDIDO: ${app.orderId}\nCLIENTE: ${app.clientInfo.name}\n`;
    body += `ALISTÓ: ${app.picker}\nVALIDÓ: ${app.user.name}\n`;
    body += `F/H INI VALIDACIÓN: ${app.startTime.toLocaleString()}\nF/H FIN VALIDACIÓN: ${app.endTime.toLocaleString()}\n`;
    body += `TOTAL UNIDADES: ${total}\nESTADO: ${status}\n`;

    if (app.observations) body += `\nOBSERVACIONES:\n${app.observations}\n`;
    if (app.corrections.length > 0) {
        body += `\nNOVEDADES/CORRECCIONES:\n`;
        app.corrections.forEach(c => body += `- ${c.log}\n`);
    }

    if (service === 'gmail') {
        const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${REPORT_EMAIL}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(url, '_blank');
    } else {
        window.location.href = `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
}

// ==========================================
// MÓDULO DE TEMPORIZADOR DE ALISTAMIENTO
// ==========================================

/**
 * Inicia el temporizador de alistamiento de un pedido
 * Registra quién está alistando y a qué hora comenzó
 */
async function startPickingTimer() {
    const id = document.getElementById('picker-id-input').value.trim();
    const order = document.getElementById('picking-order-input').value.trim().toUpperCase();
    if (!id || !order) return alert("Datos incompletos");

    let empName = "ID:" + id;
    try {
        const empleados = await api.getEmpleados();
        const emp = empleados.find(e => String(e.cedula) === String(id));
        if (emp) empName = emp.nombre;
    } catch (e) { /* sin conexión, usar ID */ }

    app.user = { name: empName, id };
    app.orderId = order;
    app.pickingStartTime = new Date();

    // Registrar alistamiento en el backend
    try {
        const result = await api.iniciarAlistamiento(order, app.pickingStartTime.toISOString());
        app.alistamientoId = result.id;
    } catch (e) {
        console.warn("No se pudo registrar alistamiento en backend:", e.message);
    }

    document.getElementById('picking-step-1').classList.add('hidden');
    document.getElementById('picking-step-2').classList.remove('hidden');
    document.getElementById('display-picking-order').textContent = order;
    document.getElementById('display-picker-name').textContent = app.user.name;
    document.getElementById('picking-start-time').textContent = app.pickingStartTime.toLocaleTimeString();
}

/**
 * Cancela el proceso de alistamiento actual
 * Limpia todos los datos sin guardar
 */
function cancelPicking() {
    if (!confirm("¿Cancelar el alistamiento actual? Se perderán los datos de inicio.")) return;
    app.user = null;
    app.orderId = null;
    app.pickingStartTime = null;
    document.getElementById('picking-order-input').value = '';
    document.getElementById('picking-step-2').classList.add('hidden');
    document.getElementById('picking-step-1').classList.remove('hidden');
}

/**
 * Finaliza el temporizador de alistamiento
 * Guarda el registro en el historial para futuras validaciones
 */
async function endPickingTimer() {
    if (!confirm("¿Finalizar alistamiento?")) return;
    const horaFin = new Date();

    // Cerrar en backend
    if (app.alistamientoId) {
        try {
            await api.cerrarAlistamiento(app.alistamientoId, horaFin.toISOString());
        } catch (e) {
            console.warn("No se pudo cerrar alistamiento en backend:", e.message);
        }
    }

    // Guardar historial local para que el validador pueda encontrar al alistador
    let history = JSON.parse(localStorage.getItem('brakepak_picking_history') || "[]");
    history.push({
        order: app.orderId,
        picker: app.user.name,
        start: app.pickingStartTime.toISOString(),
        end: horaFin.toISOString()
    });
    localStorage.setItem('brakepak_picking_history', JSON.stringify(history));

    app.alistamientoId = null;
    alert("✅ Alistamiento guardado");
    resetView('menu');
}