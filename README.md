# Funda

*Opdracht*: Bestudeer 12 features die het web kunnen breken en bedenk/verricht oplossingen die dit zouden op kunnen vangen. Hieronder Mijn bevindingen voor het vak Browser Technlogies.

## Progressive Enhancement

### 1. Afbeeldingen

**Probleem**
Funda’s is een grote site met veel content. En nog meer plaatjes. Gelukkig gebruikt optimaliseert Funda zelf alle afbeeldingen al in verschillende resoluties en sizes (2x etc.). Deze staan ook in de API die we hebben gekregen om te gebruik voor onze app. Verder is het belangrijk om alt titles te hebben op je <img> tags, als vervanging voor als het plaatje niet laadt.

![test](12features/Afbeeldingen/img_srcset.png)

*Oplossing*
Een oplossing hiervoor is het picture element met srcset gebruiken en de plaatjes responsive aanbieden in verschillende formaten. Verder een alt tags toevoegen op alle images die je hebt met een juiste beschrijving. Je kunt deze ook nog stylen met door met psuedo classes een alternatief te geven en het plaatje aan te bieden via een andere link die het wel doet.

![test](12features/Afbeeldingen/img_alt.png)

*Links:* http://bitsofco.de/styling-broken-images/

### 2. Custom Fonts (nvt)

### 3. Javascript (volledig)

*Probleem*
Zonder javascript werkt de Funda app niet, omdat de core draait op javascript. Het is natuurlijk het mooist om een oplossing te bieden voor mensen die geen javascript aan hebben. Dit ook omdat websites die gemaakt zijn voor organisaties of instanties zoals de gemeente of de overheid verplichte eisen hebben, omdat je de wet kan overtreden vanwege discriminatie.

![test](12features/Javascript_volledig/noscript.png)

*Oplossing*
Een oplossing hiervoor is de applicatie ombouwen en content niet genereren door middel van javascript, maar statische html pagina’s. Een andere oplossing is te kijken naar feature detection met Modernizr. Zo kun je fallbacks maken voor bijvoorbeeld history states. Mijn tijdelijke oplossing hiervoor is een <noscript> toevoegen aan mijn Funda app, waarin ik de eindgebruiker aanraad om Javascript aan te zetten bij gebruik. Dit is niet de oplossing waar je naartoe wil, maar zo los ik het momenteel op.

*Links:* https://css-tricks.com/rethinking-dynamic-page-replacing-content/





