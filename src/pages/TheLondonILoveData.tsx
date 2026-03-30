import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Card {
  id: string;
  title: string;
  body: React.ReactNode;
  closingLine?: string;
}

export interface Section {
  id: string;
  slug: string;
  label: string;
  shortLabel: string;
  subtitle: string;
  cards: Card[];
}

// ─── Measures Diagram ────────────────────────────────────────────────────────

const MEASURES = [
  { id: 'half-pint', category: 'Beer', label: '½ Pint', volume: '284ml', heightPct: 50, detail: 'The half pint — a perfectly reasonable choice. No one will judge you, and the beer stays colder.' },
  { id: 'pint', category: 'Beer', label: '1 Pint', volume: '568ml', heightPct: 100, detail: 'The standard. One pint of bitter, lager, stout or real ale. The heart of every round.' },
  { id: 'wine-125', category: 'Wine', label: '125ml', volume: '125ml', heightPct: 50, detail: "A small glass. About one unit of alcohol. A good option if you're pacing yourself." },
  { id: 'wine-175', category: 'Wine', label: '175ml', volume: '175ml', heightPct: 70, detail: 'A standard glass. The default when you just say "a glass of wine, please."' },
  { id: 'wine-250', category: 'Wine', label: '250ml', volume: '250ml', heightPct: 100, detail: "A large glass — roughly a third of a bottle. Worth knowing what you're ordering." },
  { id: 'spirit-25', category: 'Spirits', label: '25ml', volume: '25ml', heightPct: 50, detail: 'A single measure. Standard in most pubs. One shot of gin, whisky, vodka etc.' },
  { id: 'spirit-50', category: 'Spirits', label: '50ml', volume: '50ml', heightPct: 100, detail: 'A double measure. Worth asking — some pubs default to doubles, some to singles.' },
];

export function MeasuresDiagram() {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedMeasure = MEASURES.find((m) => m.id === selected);
  const categories = ['Beer', 'Wine', 'Spirits'] as const;

  return (
    <div className="mt-8 rounded-xl border border-[var(--sg-border)] bg-[var(--sg-offwhite)] p-6">
      <p className="text-xs uppercase tracking-[0.15em] text-[var(--sg-thames)] font-semibold mb-5">
        Measures — tap to learn more
      </p>
      <div className="flex gap-8 justify-center flex-wrap">
        {categories.map((cat) => {
          const measures = MEASURES.filter((m) => m.category === cat);
          return (
            <div key={cat} className="flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-[var(--sg-navy)]/50 uppercase tracking-wider mb-1">{cat}</span>
              <div className="flex items-end gap-2">
                {measures.map((m) => (
                  <button key={m.id} onClick={() => setSelected(selected === m.id ? null : m.id)}
                    className="flex flex-col items-center gap-1 group transition-all duration-200 cursor-pointer">
                    <div className="relative w-10 flex flex-col items-center">
                      <div className={`w-9 rounded-b-lg border-2 transition-all duration-200 flex items-end justify-center
                          ${selected === m.id ? 'border-[var(--sg-crimson)] bg-[var(--sg-crimson)]/10' : 'border-[var(--sg-border)] group-hover:border-[var(--sg-thames)] bg-white'}`}
                        style={{ height: `${m.heightPct * 0.6 + 20}px` }}>
                        <div className={`w-full rounded-b-md transition-all duration-200
                            ${selected === m.id ? 'bg-[var(--sg-crimson)]/30' : 'bg-[var(--sg-thames)]/15 group-hover:bg-[var(--sg-thames)]/25'}`}
                          style={{ height: `${m.heightPct * 0.5 + 12}px` }} />
                      </div>
                    </div>
                    <span className={`text-xs font-semibold transition-colors ${selected === m.id ? 'text-[var(--sg-crimson)]' : 'text-[var(--sg-navy)]/60 group-hover:text-[var(--sg-navy)]'}`}>{m.label}</span>
                    <span className="text-[10px] text-[var(--sg-navy)]/40">{m.volume}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <AnimatePresence>
        {selectedMeasure && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="mt-5 p-4 rounded-xl bg-white border border-[var(--sg-border)]">
              <p className="text-xs font-semibold text-[var(--sg-thames)] mb-1">
                {selectedMeasure.category} · {selectedMeasure.label} · {selectedMeasure.volume}
              </p>
              <p className="text-sm text-[var(--sg-navy)]/70 leading-relaxed">{selectedMeasure.detail}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mt-5 pt-5 border-t border-[var(--sg-border)] space-y-2">
        <p className="text-xs text-[var(--sg-navy)]/50 leading-relaxed">Pubs use government-stamped measuring vessels — the line on your glass marks the exact legal measure.</p>
        <p className="text-xs text-[var(--sg-navy)]/50 leading-relaxed">Tap water and soda water are free — just ask at the bar.</p>
      </div>
    </div>
  );
}

// ─── Content Card ─────────────────────────────────────────────────────────────

export function ContentCard({ card }: { card: Card }) {
  return (
    <div id={card.id} className="im-card p-6 md:p-8">
      <h2 className="font-display text-lg md:text-xl font-bold text-[var(--sg-crimson)] leading-snug mb-4">
        {card.title}
      </h2>
      <div className="w-10 h-px bg-[var(--sg-border)] mb-5" />
      <div className="text-[var(--sg-navy)]/70 leading-relaxed text-sm md:text-base space-y-4">
        {card.body}
      </div>
      {card.closingLine && (
        <p className="mt-6 italic text-[var(--sg-navy)] font-medium text-sm md:text-base leading-relaxed">
          {card.closingLine}
        </p>
      )}
    </div>
  );
}


// ─── Sections Data ────────────────────────────────────────────────────────────

export const SECTIONS: Section[] = [
  {
    id: 'welcome',
    slug: 'welcome',
    label: 'London — Where it begins',
    shortLabel: 'Where it begins',
    subtitle: 'For first-time visitors',
    cards: [
      {
        id: 'intro',
        title: 'Intro',
        body: (
          <div className="space-y-4">
            <p>London can feel big at first.</p>
            <p>But once you begin to see how it's shaped — by the Thames, by history, by power, and by the rhythm of its neighbourhoods — it becomes clearer. Less overwhelming. More connected.</p>
            <p>That's when exploring it stops feeling like work and starts feeling like discovery.</p>
          </div>
        ),
      },
      {
        id: 'uk-explainer',
        title: 'What is the UK? What is Great Britain? And What is England?',
        body: (
          <div className="space-y-4">
            <p>These three names are used interchangeably almost everywhere — and almost everywhere incorrectly. Here is what they actually mean.</p>
            <p><strong className="text-[var(--sg-navy)]">England</strong> is a country. It is the largest of four countries that together form a single sovereign state. Its capital is London. It shares the island of Great Britain with Scotland to the north and Wales to the west.</p>
            <p><strong className="text-[var(--sg-navy)]">Great Britain</strong> is a geographical term — the name of the island on which England, Scotland and Wales sit. It is not a country and not a government. It is simply the island. The word "Great" was added to distinguish it from Brittany in France, and — depending on who you believe — because King James I wanted to make clear he ruled the entire island, not just the part the Romans had once occupied.</p>
            <p><strong className="text-[var(--sg-navy)]">The United Kingdom</strong> — in full, the United Kingdom of Great Britain and Northern Ireland — is the sovereign state. It consists of four countries: England, Scotland, Wales and Northern Ireland. One government, one passport, one Olympic team. England and Scotland united in 1707, Ireland joined in 1801, and most of Ireland left in 1922, leaving Northern Ireland as part of the UK to this day.</p>
            <p>So: England is a country within Great Britain, which is an island within the United Kingdom, which is the actual country. And London is the capital of both England and the United Kingdom — the only city in the world that holds that dual role within a country that is itself made up of countries.</p>
            <p>When people say "Britain" or "British" they usually mean the UK as a whole. When people say "England" they often mean the whole UK — which the Scots, Welsh and Northern Irish will politely, or not so politely, correct.</p>
            <p>One more layer: the Republic of Ireland is a completely separate, independent country. Calling an Irish person British is one of the more reliable ways to cause offence.</p>
          </div>
        ),
        closingLine: 'You are in London — which is in England — which is in Great Britain — which is in the United Kingdom. Welcome.',
      },
      {
        id: 'diverse-city',
        title: 'A City Diverse Since its First Day',
        body: (
          <div className="space-y-4">
            <p>London's diversity is not a modern development. It is the city's original condition.</p>
            <p>Londinium was an ethnically diverse city with inhabitants from across the Roman Empire, including those with backgrounds in continental Europe, the Middle East, and North Africa. Genetic analysis of skeletons found in Roman cemeteries has confirmed people of Black African ancestry were born in London throughout the Roman period — not as an exception, but as a normal feature of city life. Tombstones reveal that Londinium's inhabitants included a merchant from Antioch in modern-day Turkey, another man born in Athens, and a French citizen described as a seafarer.</p>
            <p>That pattern never really stopped. The Saxons came. The Vikings came. The Normans came. The Huguenots fled France and settled in Spitalfields in the 1680s, bringing the silk-weaving industry that shaped East London for generations. The Windrush generation came from the Caribbean after World War Two, invited to help rebuild a broken city. Communities from South Asia, West Africa, East Asia, the Middle East and every corner of the world followed.</p>
            <p>Over 300 languages are spoken in London today, making it the most linguistically diverse city in the world.</p>
          </div>
        ),
        closingLine: 'The city has always been this way. It was built that way.',
      },
      {
        id: 'forest',
        title: 'London is Technically a Forest',
        body: (
          <div className="space-y-4">
            <p>The city is home to more than 3,000 parks and green spaces — eight Royal Parks, hundreds of public gardens, commons and tree-lined squares spread across it.</p>
            <p>Under a United Nations definition, land with more than 10% tree canopy and trees over five metres tall qualifies as forest. London's canopy cover sits at around 21%. It comfortably qualifies.</p>
          </div>
        ),
        closingLine: 'Once you know, you start noticing the trees everywhere.',
      },
    ],
  },
  {
    id: 'the-city',
    slug: 'the-city',
    label: 'The City — River. Rhythm. History.',
    shortLabel: 'River. Rhythm. History.',
    subtitle: 'The shape of London',
    cards: [
      {
        id: 'thames',
        title: 'The Thames Shapes Everything',
        body: (
          <div className="space-y-4">
            <p>The Thames is tidal through central London. Saltwater reaches as far as Battersea.</p>
            <p>Twice a day, the river rises and falls by up to 7 metres — governed by the moon. The riverbed that appears at low tide is London's largest natural space, and most people walking across a bridge never think about it.</p>
            <p>Before modern sanitation, the Thames was something else entirely. In the summer of 1858 — an event known as the Great Stink — the heat baked centuries of raw sewage on the riverbanks into a smell so overwhelming that MPs fled the Houses of Parliament and debated abandoning Westminster altogether. The curtains were soaked in lime to try to mask it. It didn't help.</p>
            <p>London's prevailing winds blow from the southwest. The affluent knew it — and moved accordingly. West London stayed cleaner, fresher and more desirable. The East End bore the brunt. That geography of wealth and wind still echoes in the city today.</p>
            <p>The crisis eventually forced action. Engineer Joseph Bazalgette built over 80 miles of new sewers, many of which still serve London now.</p>
          </div>
        ),
        closingLine: "The river is still the best way to understand the city's shape — and its past.",
      },
      {
        id: 'meridian',
        title: 'The Greenwich Meridian',
        body: (
          <div className="space-y-4">
            <p>In Greenwich, 0° longitude divides east from west.</p>
            <p>Greenwich Mean Time became the global reference point for time zones — meaning every clock in the world is set relative to a quiet hill in south-east London.</p>
            <p>Standing there means standing at the line that organises the world.</p>
          </div>
        ),
        closingLine: 'Few cities can say that. London can.',
      },
      {
        id: 'layers',
        title: 'Layers of History',
        body: (
          <div className="space-y-4">
            <p>Celtic settlements stood along the Thames long before the city had a name.</p>
            <p>The Romans founded Londinium, built the first bridge across the river, and laid the origins of what would become London Bridge. Vikings raided it. The Normans built the Tower. Tudor London expanded through trade and theatre. Industrial growth reshaped the skyline. Modern engineering gave us Tower Bridge and the global financial districts that surround it today.</p>
          </div>
        ),
        closingLine: "Walking through London means moving through centuries — often within a single postcode. That's what makes it worth looking up.",
      },
      {
        id: 'plague-fire',
        title: 'Plague, Fire and Resilience',
        body: (
          <div className="space-y-4">
            <p>London has been tested more than almost any city in the world — and rebuilt every time.</p>
            <p>The Great Plague of 1665 killed an estimated 100,000 people — roughly a quarter of the city's population. At its peak, over 7,000 Londoners were dying in a single week.</p>
            <p>Then, one year later, came the fire.</p>
            <p>On 2 September 1666, a bakery on Pudding Lane caught alight. Fanned by a strong east wind, the fire burned for four days. 87 churches, 52 company halls and more than 13,000 houses were destroyed. 85% of the City was gone.</p>
            <p>Plague one year. Fire the next. Most cities would have been abandoned.</p>
            <p>London was rebuilt. Christopher Wren designed a new St Paul's Cathedral — still standing — and 51 new churches around it. The Monument stands exactly 202 feet tall, positioned exactly 202 feet from where the fire began. A city marking its own wound — and its recovery.</p>
          </div>
        ),
        closingLine: 'London does not just survive. It rebuilds, and carries on.',
      },
      {
        id: 'airports',
        title: "London's Five Airports",
        body: (
          <div className="space-y-4">
            <p>London is served by five major commercial airports.</p>
            <div className="space-y-3 mt-2">
              {[
                { code: 'LHR', name: 'Heathrow', desc: "West London. The largest. Europe's busiest. Direct Tube and Elizabeth line into central London." },
                { code: 'LGW', name: 'Gatwick', desc: 'South of London, around 30 miles out. Fast trains to Victoria and London Bridge.' },
                { code: 'STN', name: 'Stansted', desc: 'Northeast, around 40 miles out. Low-cost carriers. Stansted Express to Liverpool Street.' },
                { code: 'LTN', name: 'Luton', desc: 'North of London, around 35 miles out. Budget airlines and leisure routes.' },
                { code: 'LCY', name: 'London City', desc: 'Inside the city, in the Docklands. Closest to central London. Elizabeth line and DLR.' },
              ].map((a) => (
                <div key={a.code} className="flex gap-3">
                  <span className="shrink-0 w-10 h-6 rounded bg-[var(--sg-navy)] text-white text-[10px] font-bold flex items-center justify-center tracking-wide">{a.code}</span>
                  <p className="text-sm leading-relaxed"><strong className="text-[var(--sg-navy)]">{a.name}</strong> — {a.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ),
        closingLine: "Check the map to see which airport sits closest to where you're staying.",
      },
      {
        id: 'weather',
        title: "London's Weather",
        body: (
          <div className="space-y-4">
            <p>London averages around 1,500 hours of sunshine per year. Its reputation for constant rain is considerably stronger than the statistics deserve.</p>
            <p>London has been known to offer all four seasons before lunch. Hail at 9am. Sunshine by noon. A coat you didn't need and an umbrella you did — sometimes on the same walk. And on a good day, maybe a t-shirt.</p>
          </div>
        ),
        closingLine: "Be prepared for everything. You probably won't need all of it — but you might.",
      },
      {
        id: 'left-side',
        title: 'Blame the Swords',
        body: (
          <div className="space-y-4">
            <p>One of the first things visitors notice in London — usually at a pedestrian crossing, looking the wrong way. The cars come from the right. The instinct is wrong. It takes a day or two to rewire.</p>
            <p>So why?</p>
            <p>It goes back to medieval England and the very practical matter of staying alive. Most people are right-handed, so if a stranger passed by on the right of you on horseback, your right hand would be free to use your sword if required. Keeping to the left meant your sword arm faced whoever was coming the other way.</p>
            <p>The Romans appear to have done the same. Britain absorbed the habit and never let it go.</p>
            <p>Traffic congestion in 18th century London led to a law requiring all traffic on London Bridge to keep to the left. It was made law across Britain in 1835 and carried throughout the British Empire — which is why Australia, India, New Zealand, South Africa, Japan and around 35% of the world still drive on the left today.</p>
            <p>The rest of the world drifted right largely thanks to Napoleon. The nations he conquered switched. Britain — never conquered — stayed left.</p>
            <p>Sweden bravely made the switch overnight in 1967. Britain looked at that and decided against it.</p>
          </div>
        ),
        closingLine: "When you step off the kerb — look right first. Then left. Then right again. The sword-fighting logic doesn't apply anymore, but the traffic very much does.",
      },
    ],
  },
  {
    id: 'power-politics',
    slug: 'power-politics',
    label: 'Power & Politics — Crown. Parliament. Power.',
    shortLabel: 'Crown. Parliament. Power.',
    subtitle: 'How Britain is governed',
    cards: [
      {
        id: 'monarchy',
        title: 'The Monarchy and London',
        body: (
          <div className="space-y-4">
            <p>Buckingham Palace is the monarch's official London residence. Westminster Abbey has hosted every coronation since 1066. The Tower of London houses the Crown Jewels.</p>
            <p>The monarchy plays a ceremonial and constitutional role. Political power sits with Parliament.</p>
            <p>A common myth is that the Royal Family is funded directly by taxpayers. Official duties are supported through the Sovereign Grant — funded from Crown Estate profits that go first to the Treasury, with a percentage returned to support official functions.</p>
          </div>
        ),
        closingLine: "Beyond debate, the monarchy remains one of London's most recognised symbols in the world.",
      },
      {
        id: 'parliament',
        title: 'Parliament: Commons and Lords',
        body: (
          <div className="space-y-4">
            <p>The House of Commons is elected. The House of Lords is appointed.</p>
            <p>Most political debate takes place in the Commons. The Lords reviews and scrutinises proposed laws. Both sit in the Palace of Westminster, beside the Thames — which feels appropriate for a city shaped by the river.</p>
          </div>
        ),
      },
      {
        id: 'city-of-london',
        title: 'The City of London',
        body: (
          <div className="space-y-4">
            <p>The Square Mile operates differently from the rest of London. It has its own Lord Mayor, its own police force, and one of the oldest continuous local authorities in the world.</p>
            <p>Fragments of the original Roman wall still stand today — tucked between office buildings. Look for them as you move through this brilliant city that never ceases to amaze.</p>
          </div>
        ),
        closingLine: 'The streets you walk through today follow the same ground as Roman Londinium.',
      },
      {
        id: 'henry-viii',
        title: 'Henry VIII and the Church of England',
        body: (
          <div className="space-y-4">
            <p>Before Henry VIII, the Catholic Church owned around a quarter to a third of all cultivated land in the country.</p>
            <p>Henry had a problem. He wanted to divorce his wife, Catherine of Aragon, who had not given him a male heir. The Pope refused. Henry responded by removing the Pope's authority over England entirely.</p>
            <p>In 1534, the Act of Supremacy declared Henry the Supreme Head of the Church of England. Then came the Dissolution of the Monasteries — between 1536 and 1540, over 800 religious houses were closed, their land seized, their treasures confiscated. The land was sold off to nobles loyal to the Crown, reshaping the ownership of England in a matter of years.</p>
          </div>
        ),
        closingLine: 'It began with a divorce. It ended with a new church, a new religious order, and a country whose landscape — physical and spiritual — was changed permanently.',
      },
      {
        id: 'empire',
        title: 'The British Empire and the Commonwealth',
        body: (
          <div className="space-y-4">
            <p>At its peak in 1920, the British Empire covered 35.5 million square kilometres — around a quarter of the Earth's total land area — and governed 412 million people, roughly 23% of the world's population. It was the largest empire in history.</p>
            <p>The Empire brought language, law, infrastructure and institutions to the places it reached. It also brought conquest, forced displacement, the slave trade, and the extraction of enormous wealth from colonised peoples. Both things are true.</p>
            <p>By the mid-20th century, the Empire had largely dissolved as nations gained independence. What remained was transformed into the Commonwealth — a voluntary association of 56 independent countries with a population of around 2.7 billion people.</p>
            <p>15 countries recognise King Charles III as their head of state. These countries are not part of the UK. They are fully independent sovereign nations. Barbados became a republic in 2021.</p>
          </div>
        ),
        closingLine: "When you walk through London's neighbourhoods — Brixton, Tooting, Hackney, Southall — you are walking through the Commonwealth. It came here. It stayed. It shaped the city.",
      },
      {
        id: 'council-housing',
        title: 'Council Housing — What Is It and Why Is It Everywhere?',
        body: (
          <div className="space-y-4">
            <p>Walk through almost any London neighbourhood — wealthy or otherwise — and you will see it. Blocks of flats with uniform windows. Brick estates set back from the road. This is council housing, and it is one of the most visible — and least understood — features of the city.</p>
            <p>Council housing was born out of crisis. The first council housing in London was built in Bethnal Green in 1896.</p>
            <p>In 1979, 42% of Britons lived in council homes. Estates were built across London, in wealthy boroughs and less wealthy ones alike — which is why you still find council blocks in Kensington and Chelsea, not just in Tower Hamlets or Lewisham.</p>
            <p>By 2016, only 8% of Britons lived in council homes, down from 42% in 1979.</p>
          </div>
        ),
        closingLine: 'Next time you walk past an estate — whatever the neighbourhood — you are looking at one of the most ambitious social experiments in British history.',
      },
      {
        id: 'thatcher',
        title: 'Margaret Thatcher — The Iron Lady',
        body: (
          <div className="space-y-4">
            <p>Margaret Thatcher became Britain's first female Prime Minister in 1979. She won three consecutive general elections and served for eleven years, longer than any Prime Minister of the twentieth century.</p>
            <p>The nickname came from a Soviet Army newspaper in 1976. Thatcher embraced it immediately. What was meant as a slight became her defining identity.</p>
            <p>Her most consequential policy for ordinary Londoners was the Right to Buy scheme — giving council house tenants the legal right to purchase their homes at a significant discount. By 1987, more than one million council houses had been sold. For many working-class families in London, it was the first time home ownership had ever felt possible.</p>
          </div>
        ),
        closingLine: "The Iron Lady's London is still the London you walk through today.",
      },
      {
        id: 'churchill',
        title: "Winston Churchill — London's Finest Hour",
        body: (
          <div className="space-y-4">
            <p>When Britain stood almost alone against Nazi Germany in 1940, it was Winston Churchill's words that held the country together.</p>
            <p>He became Prime Minister at sixty-five, at the exact moment history required him. He refused to consider surrender. The Blitz killed over 30,000 Londoners. Churchill visited bombed streets, walked through rubble, and was seen weeping in the East End.</p>
            <p>His statue stands in Parliament Square, facing the Houses of Parliament he spent a lifetime serving.</p>
            <blockquote className="border-l-2 border-[var(--sg-crimson)] pl-5 my-4 italic text-[var(--sg-navy)] font-medium">
              "We shall fight on the beaches… we shall never surrender."
            </blockquote>
          </div>
        ),
      },
      {
        id: 'queen-elizabeth',
        title: 'Queen Elizabeth II — A Life of Service',
        body: (
          <div className="space-y-4">
            <p>Born in Mayfair in 1926. When World War Two broke out she was thirteen. The Royal Family refused to leave London despite the Blitz.</p>
            <blockquote className="border-l-2 border-[var(--sg-thames)] pl-5 my-4 italic text-[var(--sg-navy)]/70">
              "I am glad we have been bombed. Now we can look the East End in the eye."
            </blockquote>
            <p>At eighteen, Princess Elizabeth joined the Women's Auxiliary Territorial Service — the only female member of the Royal Family to enter the armed forces. She trained as a mechanic and military driver. On VE Day she slipped out of Buckingham Palace and joined the celebrating crowds in the streets of London, anonymous among the people she would one day serve as Queen.</p>
            <p>She became Queen in 1952 at twenty-five. She reigned for seventy years — the longest in British history.</p>
          </div>
        ),
        closingLine: 'Her monument is everywhere you look.',
      },
    ],
  },
  {
    id: 'culture-daily-life',
    slug: 'culture-daily-life',
    label: 'Culture & Daily Life — Pubs. Roasts. Black cabs.',
    shortLabel: 'Pubs. Roasts. Black cabs.',
    subtitle: 'How London lives',
    cards: [
      {
        id: 'pubs',
        title: 'Pubs and Brewing Heritage',
        body: (
          <div className="space-y-4">
            <p>London has around 3,500 pubs. The UK has roughly 45,000. Few institutions have shaped British social life more completely — or for longer.</p>
            <p>The pub's ancestors were Roman. When the legions arrived in Britain, they set up drinking houses along their roads. The tradition never really left.</p>
            <p>The signs hanging outside came from necessity. In an age when most people could not read, a painted image told you which establishment you were walking into — a red lion, a white horse, a crown, a bell. A law passed in 1393 made the signs compulsory. The signs are still there today.</p>
            <p>Many of London's oldest pubs began as coaching inns — the motorway service stations of their era. Before railways, travelling between cities meant days on the road by horse-drawn carriage. Inns provided food, drink, a bed for the night and stabling for the horses. Look closely at many old London pubs and you will still find the covered archway wide enough for a carriage to pass through, the cobbled courtyard behind, the stable buildings now converted into something else. The journey is long gone. The architecture remains.</p>
            <p>A pub owned by a brewery and obliged to sell only that brewery's beer became known as a <em>tied house</em>. By the end of the 19th century, over 90% of pubs in England were tied. An independent pub — free to serve whatever beer it chose — became known as a <em>free house</em>. If you see those words above a pub door, the beer selection will be more interesting.</p>
            <p>The most important pub rule is rounds. If you are out with a group, one person buys drinks for everyone. Then the next person does. And so on. It is not a system — it is a social contract.</p>
            <p>Visitors to a British pub often find a table, sit down, and wait — and nothing happens. This is not poor service. It is simply how pubs work. Unlike restaurants, there are no waiters coming to you. The bar is where everything happens.</p>
            <p>Many pubs introduced QR code ordering during the pandemic. If there's a QR code on your table, use it. If not, head to the bar.</p>
            <p>If you are unsure what to order, just ask. In most cases, bar staff are happy to let you try a small taste of a beer or wine before you commit. Completely normal. Completely free.</p>
            <p>Most traditional pubs do not have televisions at all — and many consider this a feature. For those that do show sport, a commercial licence costs around £1,200 a month, and since 1960 a rule has prohibited live broadcasts between 2:45pm and 5:15pm on Saturdays to protect lower league clubs. Sunday matches broadcast freely.</p>
            <MeasuresDiagram />
          </div>
        ),
        closingLine: 'Pubs are not just where Londoners drink. They are where the city thinks, argues, celebrates, grieves, and occasionally solves its problems.',
      },
      {
        id: 'sunday-roast',
        title: 'The Sunday Roast',
        body: (
          <div className="space-y-4">
            <p>The Sunday roast is not just a meal. It is one of the oldest social rituals in British life — and one of the best things you can do on a Sunday in London.</p>
            <p>The tradition traces back to the reign of Henry VII in 1485. His royal guards were rewarded with roast beef after church on Sundays — which is how they earned the nickname "Beefeaters," a name the Tower of London's ceremonial guards still carry today.</p>
            <p>In the late 1700s, families would place a cut of meat into the oven as they got ready for church. When they returned, the dinner was all but ready. Poorer families would drop their joint at the local bakery on the way to church, collecting it cooked on the way home.</p>
            <p>The traditional roast: roasted meat — beef, lamb, pork or chicken — with roast potatoes, vegetables, stuffing and gravy. Horseradish with beef, mint sauce with lamb, apple sauce with pork, cranberry with chicken. The Yorkshire pudding began as a way to stretch a meal — cooked beneath the roasting meat to catch the drippings, served as a starter with gravy to fill people up before the main course.</p>
            <p>In a poll of Britons, the Sunday roast ranked in the top three things people love about Britain — alongside fish and chips and the NHS. That is the company it keeps.</p>
          </div>
        ),
        closingLine: 'If you are in London on a Sunday, find a good pub and order one. It is one of those meals that makes complete sense the moment you eat it.',
      },
      {
        id: 'tube',
        title: 'TfL and the Tube',
        body: (
          <div className="space-y-4">
            <p>The London Underground opened its first section in 1863 — making it the oldest metro system in the world.</p>
            <p>Today it runs 11 lines, covers 402 kilometres, and serves 272 stations. Up to 5 million journeys are made on it every single day.</p>
            <p>TfL — Transport for London — manages not just the Tube but the buses, the Overground, the DLR, the Elizabeth line, and the roads. One of the most complex urban transport networks on the planet.</p>
          </div>
        ),
        closingLine: 'Tap in. The city opens up.',
      },
      {
        id: 'black-cabs',
        title: 'Black Cabs and The Knowledge',
        body: (
          <div className="space-y-4">
            <p>To become a licensed black cab driver, candidates must memorise around 25,000 streets within a six-mile radius of Charing Cross. It takes most candidates between two and four years.</p>
            <p>Black cabs are not just transport. They are one of London's quiet acts of expertise.</p>
          </div>
        ),
        closingLine: 'Every journey is driven by someone who knows the city better than almost anyone.',
      },
      {
        id: 'inventions',
        title: "Britain's Inventions",
        body: (
          <div className="space-y-4">
            <p>For a relatively small island, Britain's contribution to human progress is extraordinary.</p>
            <p>The steam engine. The railway. The jet engine. The telephone. The television — the world's first public high-definition broadcasts were made from Alexandra Palace in North London. Penicillin, discovered accidentally by Alexander Fleming in 1928. The foundations of modern computing from Alan Turing. The structure of DNA. The world's first cash machine — installed by Barclays Bank in Enfield, north London, in 1967.</p>
            <p>And then, in 1989, a British scientist named Tim Berners-Lee invented the World Wide Web. He gave it to the world for free.</p>
            <p>The Underground you take across the city. The television in your hotel room. The antibiotic your doctor might prescribe. The website you used to find Charlies XP. All of it, in some way, traces back to this island.</p>
          </div>
        ),
        closingLine: 'London has always been a place where ideas take hold. Some of them changed everything.',
      },
      {
        id: 'celebrities',
        title: 'Leave Them to Their Lunch',
        body: (
          <div className="space-y-4">
            <p>London is one of the favourite cities of the most famous people in the world. Not because it has the best hotels or the most glamorous restaurants — though it has both. But because of something far more valuable: an unwritten rule that everyone in the city seems to understand instinctively.</p>
            <p className="font-semibold text-[var(--sg-navy)]">Let them be.</p>
            <p>No photographs without permission. No interruptions mid-meal. No scenes in the street. If you spot someone famous in London — and if you spend enough time here, you will — the done thing is to notice quietly, mention it to whoever you're with once you're out of earshot, and get on with your day. It is not indifference. It is a form of respect that Londoners extend to everyone, famous or not.</p>
            <p>The result is that celebrities can actually live here. They can go to restaurants, walk in the parks, take their children to school, browse a market on a Saturday morning.</p>
            <p>Over the years, wandering this city the way Charlie does, the encounters accumulate. Gordon Ramsay at a restaurant table. Elizabeth Hurley on a street in Mayfair. JK Rowling in a quiet corner. Sharon Stone. Gary Neville. Prince Harry. Zinedine Zidane. Each time, London did what London always does.</p>
            <p className="font-medium text-[var(--sg-navy)]">Nobody made a fuss.</p>
            <p>The unwritten rule is not enforced. It is not taught. It is simply understood. And somehow, everyone seems to know it the moment they arrive.</p>
          </div>
        ),
        closingLine: 'If you do spot someone — enjoy the moment. Then leave them to their lunch.',
      },
    ],
  },
];
