export type NodeKind = 'lesson' | 'checkpoint';
export type NodeStatus = 'completed' | 'active' | 'locked';
export type SandboxType = 'etf' | 'ike' | 'bonds';

export interface QuizOption {
  readonly id: string;
  readonly text: string;
  readonly isCorrect: boolean;
  readonly feedback: string;
}

export interface QuizQuestion {
  readonly id: string;
  readonly prompt: string;
  readonly options: readonly [QuizOption, QuizOption, QuizOption];
}

export interface TheoryBlock {
  readonly heading: string;
  readonly body: string;
}

export interface LearningNode {
  readonly id: string;
  readonly code: string;
  readonly kind: NodeKind;
  readonly title: string;
  readonly durationLabel: string;
  readonly theoryBlocks: readonly [TheoryBlock, TheoryBlock];
  readonly questions: readonly [QuizQuestion, QuizQuestion];
}

export interface TopicDefinition {
  readonly id: string;
  readonly seriesNumber: string;
  readonly title: string;
  readonly metaLabel: string;
  readonly sandboxType: SandboxType;
  readonly sandboxTitle: string;
  readonly sandboxShortLabel: string;
  readonly sandboxDescription: string;
  readonly bandClassName: string;
  readonly pipeColor: string;
  readonly activeRingColor: string;
  readonly nodes: readonly LearningNode[];
}

export const TOPICS: readonly TopicDefinition[] = [
  {
    id: 'etf',
    seriesNumber: '100',
    title: 'ETF',
    metaLabel: 'Moduły 101–104 · Sandbox: Portfel ETF',
    sandboxType: 'etf',
    sandboxTitle: 'Portfel ETF — symulator',
    sandboxShortLabel: 'Portfel ETF',
    sandboxDescription: 'Wpłaty miesięczne, horyzont i trzy stopy zwrotu.',
    bandClassName: 'bg-[#07090a]',
    pipeColor: '#efb100',
    activeRingColor: '#ffd22e',
    nodes: [
      {
        id: 'etf-1',
        code: '101',
        kind: 'lesson',
        title: 'Indeks w jednym zleceniu',
        durationLabel: '2 min',
        theoryBlocks: [
          {
            heading: 'Koszyk spółek zamiast jednej firmy',
            body: 'Jeden ETF na S&P 500 lub MSCI World kupuje udział w kilkuset firmach naraz. Upadek jednej spółki z koszyka ma minimalny wpływ na całość.',
          },
          {
            heading: 'Notowania jak akcje',
            body: 'Jednostkę ETF kupujesz i sprzedajesz na giełdzie w godzinach sesji przez zwykły rachunek maklerski albo IKE.',
          },
        ],
        questions: [
          {
            id: 'etf-1-q1',
            prompt: 'Co kupujesz, biorąc 1 jednostkę ETF na S&P 500?',
            options: [
              {
                id: 'a',
                text: 'Udział w ok. 500 spółkach z indeksu',
                isCorrect: true,
                feedback: 'Jedna transakcja daje ekspozycję na cały indeks.',
              },
              {
                id: 'b',
                text: 'Obligację skarbową USA',
                isCorrect: false,
                feedback: 'S&P 500 to indeks akcji spółek notowanych w USA.',
              },
              {
                id: 'c',
                text: 'Lokatę ze stałym zyskiem',
                isCorrect: false,
                feedback: 'Kurs ETF zmienia się codziennie razem z rynkiem.',
              },
            ],
          },
          {
            id: 'etf-1-q2',
            prompt: 'Gdzie kupuje się jednostki ETF?',
            options: [
              {
                id: 'a',
                text: 'Na giełdzie przez rachunek maklerski',
                isCorrect: true,
                feedback: 'ETF jest notowany na giełdzie tak samo jak pojedyncze akcje.',
              },
              {
                id: 'b',
                text: 'Tylko w oddziale banku na papierowym wniosku',
                isCorrect: false,
                feedback: 'Zakup odbywa się elektronicznie na giełdzie.',
              },
              {
                id: 'c',
                text: 'Wyłącznie w urzędzie skarbowym',
                isCorrect: false,
                feedback: 'Urząd skarbowy nie pośredniczy w zakupie funduszy.',
              },
            ],
          },
        ],
      },
      {
        id: 'etf-2',
        code: '102',
        kind: 'lesson',
        title: 'Koszt roczny TER',
        durationLabel: '3 min',
        theoryBlocks: [
          {
            heading: '0,07%–0,22% vs 1,5%–2,0%',
            body: 'Szerokie ETF-y pobierają zwykle poniżej 0,25% rocznie. Klasyczne fundusze aktywne często kosztują 1,5%–2,0% każdego roku.',
          },
          {
            heading: 'Jak pobierana jest opłata',
            body: 'TER schodzi automatycznie w codziennej wycenie funduszu — nie dostajesz faktury ani osobnego przelewu do zapłaty.',
          },
        ],
        questions: [
          {
            id: 'etf-2-q1',
            prompt: 'W jaki sposób płacisz roczny koszt TER?',
            options: [
              {
                id: 'a',
                text: 'Jest na bieżąco odliczany w wycenie jednostki ETF',
                isCorrect: true,
                feedback: 'Opłata jest uwzględniona w cenie jednostki bez osobnych przelewów.',
              },
              {
                id: 'b',
                text: 'Przychodzi osobna faktura co kwartał',
                isCorrect: false,
                feedback: 'Emitent nie wysyła osobnych faktur za zarządzanie.',
              },
              {
                id: 'c',
                text: 'Tylko jednorazowo w chwili sprzedaży',
                isCorrect: false,
                feedback: 'TER nalicza się proporcjonalnie w wycenie każdego dnia.',
              },
            ],
          },
          {
            id: 'etf-2-q2',
            prompt: 'Który koszt TER jest korzystniejszy przy identycznym indeksie?',
            options: [
              {
                id: 'a',
                text: '0,12% rocznie',
                isCorrect: true,
                feedback: 'Niższy TER oznacza, że większa część zwrotu z rynku zostaje w portfelu.',
              },
              {
                id: 'b',
                text: '1,80% rocznie',
                isCorrect: false,
                feedback: 'Wysoka opłata co roku pomniejsza kapitał i ogranicza procent składany.',
              },
              {
                id: 'c',
                text: 'TER nie ma znaczenia na przestrzeni 20 lat',
                isCorrect: false,
                feedback: 'Różnica 1,5 punktu procentowego po 20 latach daje kilkanaście procent różnicy.',
              },
            ],
          },
        ],
      },
      {
        id: 'etf-3',
        code: '103',
        kind: 'lesson',
        title: 'Acc vs Dist',
        durationLabel: '3 min',
        theoryBlocks: [
          {
            heading: 'Acc — reinwestycja w środku',
            body: 'ETF akumulujący (Acc) automatycznie dokupuje akcje za otrzymane dywidendy. Na zwykłym koncie nie płacisz wtedy podatku po każdej wypłacie.',
          },
          {
            heading: 'Dist — gotówka na rachunek',
            body: 'ETF dystrybuujący (Dist) przelewa dywidendy na Twoje konto. W Polsce rodzi to obowiązek rozliczenia 19% podatku co rok.',
          },
        ],
        questions: [
          {
            id: 'etf-3-q1',
            prompt: 'Co robi ETF typu Acc z wypłacaną przez spółki dywidendą?',
            options: [
              {
                id: 'a',
                text: 'Reinwestuje ją automatycznie wewnątrz funduszu',
                isCorrect: true,
                feedback: 'Wartość jednostki rośnie o dywidendę bez przelewu na rachunek.',
              },
              {
                id: 'b',
                text: 'Przelewa gotówkę na konto bankowe',
                isCorrect: false,
                feedback: 'Gotówkę na rachunek wypłaca wyłącznie wariant Dist.',
              },
              {
                id: 'c',
                text: 'Zatrzymuje ją jako prowizję dla maklera',
                isCorrect: false,
                feedback: 'Dywidenda pracuje dla posiadaczy jednostek funduszu.',
              },
            ],
          },
          {
            id: 'etf-3-q2',
            prompt: 'Który wariant wymaga mniej formalności podatkowych na zwykłym koncie maklerskim?',
            options: [
              {
                id: 'a',
                text: 'Acc',
                isCorrect: true,
                feedback: 'Brak wypłat dywidend na konto oznacza brak corocznego podatku od tych wypłat.',
              },
              {
                id: 'b',
                text: 'Dist',
                isCorrect: false,
                feedback: 'Wypłaty z Dist trzeba wykazać i opodatkować w rocznym zeznaniu PIT.',
              },
              {
                id: 'c',
                text: 'Oba generują dokładnie ten sam PIT co kwartał',
                isCorrect: false,
                feedback: 'Wariant Acc nie tworzy zdarzenia podatkowego aż do sprzedaży jednostek.',
              },
            ],
          },
        ],
      },
      {
        id: 'etf-4',
        code: '104',
        kind: 'checkpoint',
        title: 'Test końcowy: ETF',
        durationLabel: '2 min',
        theoryBlocks: [
          {
            heading: 'Podsumowanie działu 100',
            body: 'Szeroki indeks daje dywersyfikację, niski TER chroni wynik przed kosztami, a wariant Acc upraszcza podatki.',
          },
          {
            heading: 'Co odblokujesz po zaliczeniu',
            body: 'Po teście linia połączy się z modułem 201 (IKE / IKZE) i uruchomi interaktywny symulator Portfel ETF.',
          },
        ],
        questions: [
          {
            id: 'etf-4-q1',
            prompt: 'Który wybór najlepiej sprawdza się do długoterminowego budowania kapitału?',
            options: [
              {
                id: 'a',
                text: 'Szeroki ETF Acc z TER ~0,20%',
                isCorrect: true,
                feedback: 'Niski koszt roczny i automatyczna reinwestycja maksymalizują wynik.',
              },
              {
                id: 'b',
                text: 'Fundusz aktywny z opłatą 2,0%',
                isCorrect: false,
                feedback: 'Opłata 2% rocznie istotnie obniża stopę zwrotu.',
              },
              {
                id: 'c',
                text: 'Jedna spółka bez dywersyfikacji',
                isCorrect: false,
                feedback: 'Pojedyncza firma niesie ryzyko specyficzne, którego nie ma w szerokim indeksie.',
              },
            ],
          },
          {
            id: 'etf-4-q2',
            prompt: 'Czy niższa cena pojedynczej jednostki ETF oznacza, że fundusz ma niższe opłaty TER?',
            options: [
              {
                id: 'a',
                text: 'Nie — cena sztuki nie określa poziomu opłat TER',
                isCorrect: true,
                feedback: 'Moduł 104 zaliczony. Symulator Portfel ETF jest odblokowany.',
              },
              {
                id: 'b',
                text: 'Tak — tańsza jednostka zawsze ma TER 0%',
                isCorrect: false,
                feedback: 'Cena jednostki zależy od podziału udziału, nie od kosztów zarządzania.',
              },
              {
                id: 'c',
                text: 'Tak — TER równa się cenie jednej sztuki',
                isCorrect: false,
                feedback: 'TER to roczna stawka procentowa podawana niezależnie od kursu.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ike',
    seriesNumber: '200',
    title: 'IKE / IKZE',
    metaLabel: 'Moduły 201–204 · Sandbox: Tarcza podatkowa',
    sandboxType: 'ike',
    sandboxTitle: 'Tarcza podatkowa — IKE vs zwykłe konto',
    sandboxShortLabel: 'Tarcza podatkowa',
    sandboxDescription: 'Porównanie kapitału z 19% podatkiem Belki i bez niego.',
    bandClassName: 'bg-[#151a1c]',
    pipeColor: '#fe9900',
    activeRingColor: '#ffd22e',
    nodes: [
      {
        id: 'ike-1',
        code: '201',
        kind: 'lesson',
        title: 'IKE: 0% podatku Belki',
        durationLabel: '2 min',
        theoryBlocks: [
          {
            heading: 'Zwolnienie po 60. roku życia',
            body: 'Po ukończeniu 60 lat (lub 55 przy uprawnieniach emerytalnych) i wpłatach w min. 5 latach kalendarzowych wypłacasz całość z 0% podatku od zysków.',
          },
          {
            heading: 'Rebalansowanie bez podatku',
            body: 'Sprzedaż zyskownego ETF-u wewnątrz IKE nie wywołuje podatku, dopóki pieniądze zostają na koncie IKE.',
          },
        ],
        questions: [
          {
            id: 'ike-1-q1',
            prompt: 'Ile podatku Belki płacisz przy zamianie jednego ETF-u na drugi wewnątrz IKE?',
            options: [
              {
                id: 'a',
                text: '0%',
                isCorrect: true,
                feedback: 'Obrót wewnątrz IKE nie powoduje naliczenia podatku Belki.',
              },
              {
                id: 'b',
                text: '10%',
                isCorrect: false,
                feedback: 'Stawka 10% dotyczy wyłącznie końcowej wypłaty z IKZE.',
              },
              {
                id: 'c',
                text: '19%',
                isCorrect: false,
                feedback: '19% dotyczy zwykłego rachunku lub wcześniejszego zwrotu środków z IKE.',
              },
            ],
          },
          {
            id: 'ike-1-q2',
            prompt: 'Jaki podstawowy warunek wieku zwalnia zysk na IKE z podatku przy wypłacie?',
            options: [
              {
                id: 'a',
                text: 'Ukończenie 60 lat (przy min. 5 latach wpłat)',
                isCorrect: true,
                feedback: 'Po spełnieniu warunku wieku i stażu wpłat zysk jest wolny od podatku.',
              },
              {
                id: 'b',
                text: 'Utrzymanie środków przez minimum 12 miesięcy',
                isCorrect: false,
                feedback: 'Jeden rok nie wystarczy do zwolnienia z podatku Belki na IKE.',
              },
              {
                id: 'c',
                text: 'Wiek nie ma znaczenia na IKE',
                isCorrect: false,
                feedback: 'Wiek 60 lat (lub 55 z uprawnieniami) jest warunkiem ustawowym.',
              },
            ],
          },
        ],
      },
      {
        id: 'ike-2',
        code: '202',
        kind: 'lesson',
        title: 'IKZE: odliczenie w PIT',
        durationLabel: '3 min',
        theoryBlocks: [
          {
            heading: 'Ulga od razu co rok',
            body: 'Wpłatę na IKZE w ramach limitu odliczasz od podstawy opodatkowania w rocznym PIT — dostajesz zwrot 12% lub 32% (zależnie od progu).',
          },
          {
            heading: '10% ryczałtu przy wypłacie',
            body: 'Przy wypłacie po 65. roku życia płacisz 10% zryczałtowanego podatku od wypłacanej kwoty zamiast 19% Belki.',
          },
        ],
        questions: [
          {
            id: 'ike-2-q1',
            prompt: 'Kiedy otrzymujesz pierwszą korzyść podatkową z wpłaty na IKZE?',
            options: [
              {
                id: 'a',
                text: 'W najbliższym rozliczeniu PIT za dany rok',
                isCorrect: true,
                feedback: 'Odliczenie od dochodu obniża podatek za rok dokonania wpłaty.',
              },
              {
                id: 'b',
                text: 'Dopiero po ukończeniu 65 lat',
                isCorrect: false,
                feedback: 'Ulga PIT działa na bieżąco co rok, a po 65. roku następuje wypłata.',
              },
              {
                id: 'c',
                text: 'Wyłącznie na obligacjach skarbowych',
                isCorrect: false,
                feedback: 'Ulga zależy od wpłaty na IKZE, nie od wyboru ETF czy obligacji.',
              },
            ],
          },
          {
            id: 'ike-2-q2',
            prompt: 'Jaki podatek obowiązuje przy wypłacie z IKZE po spełnieniu warunków (65 lat, 5 lat wpłat)?',
            options: [
              {
                id: 'a',
                text: '10% ryczałtu',
                isCorrect: true,
                feedback: 'Zamiast 19% Belki obowiązuje 10% ryczałt przy spełnieniu warunków.',
              },
              {
                id: 'b',
                text: '32% podatku dochodowego',
                isCorrect: false,
                feedback: '32% to drugi próg PIT w trakcie pracy, nie stawka końcowa na IKZE.',
              },
              {
                id: 'c',
                text: '0% niezależnie od progu i wieku',
                isCorrect: false,
                feedback: '0% dotyczy IKE, a na IKZE przy wypłacie na emeryturze jest 10% ryczałtu.',
              },
            ],
          },
        ],
      },
      {
        id: 'ike-3',
        code: '203',
        kind: 'lesson',
        title: 'Zwrot przed czasem',
        durationLabel: '2 min',
        theoryBlocks: [
          {
            heading: 'Pieniądze na IKE pozostają dostępne',
            body: 'W każdej chwili możesz zlecić częściowy lub pełny zwrot z IKE przed 60. rokiem życia.',
          },
          {
            heading: 'Brak dodatkowej kary',
            body: 'Przy wcześniejszym zwrocie płacisz standardowe 19% podatku od wypracowanego zysku — dokładnie tyle, ile na zwykłym rachunku.',
          },
        ],
        questions: [
          {
            id: 'ike-3-q1',
            prompt: 'Co się dzieje, gdy wypłacisz środki z IKE przed 60. rokiem życia?',
            options: [
              {
                id: 'a',
                text: 'Rozliczasz standardowe 19% podatku od zysku',
                isCorrect: true,
                feedback: 'Nie ma dodatkowej kary, a przez lata kapitał pracował bez podatku.',
              },
              {
                id: 'b',
                text: 'Tracisz połowę wpłaconych pieniędzy',
                isCorrect: false,
                feedback: 'Twój kapitał nie podlega żadnym karnym potrąceniom.',
              },
              {
                id: 'c',
                text: 'Wypłata jest prawnie niemożliwa',
                isCorrect: false,
                feedback: 'Możesz zrobić zarówno zwrot częściowy, jak i całkowity.',
              },
            ],
          },
          {
            id: 'ike-3-q2',
            prompt: 'Czy na IKE dostępny jest zwrot tylko części środków?',
            options: [
              {
                id: 'a',
                text: 'Tak — możesz wypłacić część i zostawić resztę na koncie',
                isCorrect: true,
                feedback: 'Zwrot częściowy nie zamyka rachunku IKE.',
              },
              {
                id: 'b',
                text: 'Nie — każda wypłata kasuje całe konto',
                isCorrect: false,
                feedback: 'IKE dopuszcza zwrot częściowy oraz całkowity.',
              },
              {
                id: 'c',
                text: 'Tylko po zgodzie urzędu skarbowego',
                isCorrect: false,
                feedback: 'Dyspozycję zwrotu składasz bezpośrednio w swojej instytucji.',
              },
            ],
          },
        ],
      },
      {
        id: 'ike-4',
        code: '204',
        kind: 'checkpoint',
        title: 'Test końcowy: IKE / IKZE',
        durationLabel: '2 min',
        theoryBlocks: [
          {
            heading: 'Podsumowanie działu 200',
            body: 'IKE daje 0% podatku na mecie przy zachowaniu elastyczności zwrotu, a IKZE obniża podatek PIT tu i teraz.',
          },
          {
            heading: 'Co odblokujesz po zaliczeniu',
            body: 'Linia przejdzie do działu 300 (Obligacje) i otworzy kalkulator Tarczy podatkowej.',
          },
        ],
        questions: [
          {
            id: 'ike-4-q1',
            prompt: 'Skąd wynika główna przewaga IKE nad zwykłym rachunkiem maklerskim?',
            options: [
              {
                id: 'a',
                text: 'Brak 19% podatku od zysku i brak podatku przy zmianach ETF-ów',
                isCorrect: true,
                feedback: 'Cały zysk pracuje na procent składany do końca inwestycji.',
              },
              {
                id: 'b',
                text: 'Gwarancja stałej stopy zwrotu 10% rocznie',
                isCorrect: false,
                feedback: 'IKE nie gwarantuje wyniku — daje osłonę podatkową.',
              },
              {
                id: 'c',
                text: 'Brak rocznego limitu wpłat',
                isCorrect: false,
                feedback: 'Zarówno IKE, jak i IKZE mają ustawowe limity wpłat.',
              },
            ],
          },
          {
            id: 'ike-4-q2',
            prompt: 'Które konto obniża podatek PIT już w roku dokonania wpłaty?',
            options: [
              {
                id: 'a',
                text: 'IKZE',
                isCorrect: true,
                feedback: 'Moduł 204 zaliczony. Kalkulator Tarczy podatkowej jest otwarty.',
              },
              {
                id: 'b',
                text: 'IKE',
                isCorrect: false,
                feedback: 'IKE daje ulgę na końcu (0% Belki), nie w bieżącym PIT.',
              },
              {
                id: 'c',
                text: 'Zwykły rachunek maklerski',
                isCorrect: false,
                feedback: 'Zwykły rachunek nie daje ulgi w podatku PIT.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'bonds',
    seriesNumber: '300',
    title: 'Obligacje',
    metaLabel: 'Moduły 301–304 · Sandbox: Symulator EDO',
    sandboxType: 'bonds',
    sandboxTitle: 'Obligacje EDO vs lokata',
    sandboxShortLabel: 'Symulator EDO',
    sandboxDescription: 'Indeksacja inflacją z roczną kapitalizacją w horyzoncie 2–10 lat.',
    bandClassName: 'bg-[#21292b]',
    pipeColor: '#e17101',
    activeRingColor: '#ffd22e',
    nodes: [
      {
        id: 'bonds-1',
        code: '301',
        kind: 'lesson',
        title: 'TOS, COI, EDO',
        durationLabel: '2 min',
        theoryBlocks: [
          {
            heading: 'Stałe vs antyinflacyjne',
            body: 'TOS (3 lata) mają stałą stawkę przez cały okres. COI (4 lata) i EDO (10 lat) od drugiego roku płacą inflację powiększoną o marżę.',
          },
          {
            heading: 'Kapitalizacja w EDO',
            body: 'W COI dostajesz odsetki co roku na konto, a w 10-letnich EDO odsetki dopisują się do kapitału (procent składany).',
          },
        ],
        questions: [
          {
            id: 'bonds-1-q1',
            prompt: 'Która seria łączy indeksację inflacją z corocznym dopisywaniem odsetek do kapitału?',
            options: [
              {
                id: 'a',
                text: 'EDO',
                isCorrect: true,
                feedback: '10-letnie EDO kapitalizują odsetki co rok bez wypłaty po drodze.',
              },
              {
                id: 'b',
                text: 'TOS',
                isCorrect: false,
                feedback: 'TOS to obligacje 3-letnie o stałym oprocentowaniu.',
              },
              {
                id: 'c',
                text: 'COI',
                isCorrect: false,
                feedback: 'COI są indeksowane inflacją, ale wypłacają odsetki co rok na konto.',
              },
            ],
          },
          {
            id: 'bonds-1-q2',
            prompt: 'Ile wynosi nominał jednej detalicznej obligacji skarbowej w Polsce?',
            options: [
              {
                id: 'a',
                text: '100 zł',
                isCorrect: true,
                feedback: 'Każda sztuka obligacji detalicznych ma wartość nominalną 100 zł.',
              },
              {
                id: 'b',
                text: '10 000 zł',
                isCorrect: false,
                feedback: 'Próg wejścia jest niski — zaczyna się od 1 sztuki za 100 zł.',
              },
              {
                id: 'c',
                text: '1 000 EUR',
                isCorrect: false,
                feedback: 'Standardowe detaliczne serie (TOS, COI, EDO) są w PLN po 100 zł.',
              },
            ],
          },
        ],
      },
      {
        id: 'bonds-2',
        code: '302',
        kind: 'lesson',
        title: 'Wykup przed terminem',
        durationLabel: '3 min',
        theoryBlocks: [
          {
            heading: 'Elastyczne wyjście przed 10. rokiem',
            body: 'EDO można przedstawić do wcześniejszego wykupu. Opłata jest pobierana wyłącznie z wypracowanych odsetek — nie uszczupla wpłaconego kapitału.',
          },
          {
            heading: 'Podatek dopiero na końcu',
            body: 'Podatek Belki 19% jest potrącany jednorazowo przy wykupie, dzięki czemu wcześniej odsetki procentują brutto.',
          },
        ],
        questions: [
          {
            id: 'bonds-2-q1',
            prompt: 'Kiedy pobierany jest podatek Belki od obligacji EDO?',
            options: [
              {
                id: 'a',
                text: 'Raz, przy wykupie końcowym lub przedterminowym',
                isCorrect: true,
                feedback: 'Odroczony podatek zwiększa efekt procentu składanego przez kolejne lata.',
              },
              {
                id: 'b',
                text: 'Co miesiąc z rachunku ROR',
                isCorrect: false,
                feedback: 'Podatek rozliczany jest automatycznie dopiero przy wykupie.',
              },
              {
                id: 'c',
                text: 'Z góry przy zakupie obligacji',
                isCorrect: false,
                feedback: 'W momencie zakupu płacisz wyłącznie wartość nominalną.',
              },
            ],
          },
          {
            id: 'bonds-2-q2',
            prompt: 'Z czego potrącana jest opłata za przedterminowy wykup EDO?',
            options: [
              {
                id: 'a',
                text: 'Wyłącznie z narosłych odsetek',
                isCorrect: true,
                feedback: 'Nominał wpłaconego kapitału jest chroniony przed opłatą wykupu.',
              },
              {
                id: 'b',
                text: 'Z dodatkowego przelewu z konta bankowego',
                isCorrect: false,
                feedback: 'Nie dopłacasz osobnej gotówki przy wcześniejszym wykupie.',
              },
              {
                id: 'c',
                text: 'Zawsze w wysokości 20% całego kapitału',
                isCorrect: false,
                feedback: 'Opłata jest stałą kwotą za sztukę i nie przekracza narosłych odsetek.',
              },
            ],
          },
        ],
      },
      {
        id: 'bonds-3',
        code: '303',
        kind: 'lesson',
        title: 'Część bezpieczna portfela',
        durationLabel: '2 min',
        theoryBlocks: [
          {
            heading: 'Amortyzator spadków na giełdzie',
            body: 'Obligacje detaliczne nie podlegają codziennym wahaniom giełdowym, więc stabilizują wartość całego majątku w trakcie bessy.',
          },
          {
            heading: 'Rezerwa bez panicznej sprzedaży',
            body: 'Mając część bezpieczną w obligacjach, nie musisz sprzedawać ETF-ów akcyjnych w dołku, gdy potrzebujesz gotówki.',
          },
        ],
        questions: [
          {
            id: 'bonds-3-q1',
            prompt: 'Po co łączy się obligacje EDO z ETF-ami akcyjnymi w jednym portfelu?',
            options: [
              {
                id: 'a',
                text: 'Żeby ograniczyć wahania i mieć stabilną rezerwę',
                isCorrect: true,
                feedback: 'Część obligacyjna równoważy wyższą zmienność rynku akcji.',
              },
              {
                id: 'b',
                text: 'Żeby zwiększyć zmienność podczas bessy',
                isCorrect: false,
                feedback: 'Zadaniem obligacji jest tłumienie wahań, nie ich powiększanie.',
              },
              {
                id: 'c',
                text: 'Bo makler blokuje zakup samych ETF-ów',
                isCorrect: false,
                feedback: 'Dom maklerski nie narzuca udziału obligacji w portfelu.',
              },
            ],
          },
          {
            id: 'bonds-3-q2',
            prompt: 'Jak obligacje detaliczne zachowują się podczas spadku giełdy o 25%?',
            options: [
              {
                id: 'a',
                text: 'Nadal naliczają swoje odsetki bez wahań kursu giełdowego',
                isCorrect: true,
                feedback: 'Obligacje oszczędnościowe nie są notowane na rynku wtórnym i nie spadają z giełdą.',
              },
              {
                id: 'b',
                text: 'Spadają automatycznie o dokładnie 25%',
                isCorrect: false,
                feedback: 'Oprocentowanie serii detalicznych zależy od stopy w umowie lub inflacji, nie od WIG/S&P.',
              },
              {
                id: 'c',
                text: 'Zostają zamrożone do końca krachu',
                isCorrect: false,
                feedback: 'Możesz je wykupić przed terminem w dowolnym momencie.',
              },
            ],
          },
        ],
      },
      {
        id: 'bonds-4',
        code: '304',
        kind: 'checkpoint',
        title: 'Test końcowy: Obligacje',
        durationLabel: '2 min',
        theoryBlocks: [
          {
            heading: 'Podsumowanie działu 300',
            body: 'Znasz różnicę między TOS, COI i EDO, zasadę odroczonego podatku Belki oraz rolę poduszki obligacyjnej.',
          },
          {
            heading: 'Ostatni sandbox ścieżki',
            body: 'Zaliczenie kończy cały kurs i otwiera symulator Obligacji EDO vs lokata.',
          },
        ],
        questions: [
          {
            id: 'bonds-4-q1',
            prompt: 'Która seria chroni siłę nabywczą przez 8–10 lat z roczną kapitalizacją?',
            options: [
              {
                id: 'a',
                text: 'EDO (10-letnie indeksowane inflacją)',
                isCorrect: true,
                feedback: 'Indeksacja inflacją + marża i kapitalizacja zabezpieczają kapitał długoterminowo.',
              },
              {
                id: 'b',
                text: 'Nieoprocentowane konto ROR',
                isCorrect: false,
                feedback: 'Gotówka bez oprocentowania traci realną wartość co rok.',
              },
              {
                id: 'c',
                text: '3-miesięczne OTS',
                isCorrect: false,
                feedback: 'OTS mają krótki horyzont bez indeksacji inflacją.',
              },
            ],
          },
          {
            id: 'bonds-4-q2',
            prompt: 'Czy w EDO da się wyjść z inwestycji po 4 latach bez straty kapitału nominalnego?',
            options: [
              {
                id: 'a',
                text: 'Tak — opłata jest potrącana tylko z narosłych odsetek',
                isCorrect: true,
                feedback: 'Moduł 304 zaliczony. Symulator EDO jest otwarty.',
              },
              {
                id: 'b',
                text: 'Nie — wykup przed 10. rokiem jest zablokowany',
                isCorrect: false,
                feedback: 'Wcześniejszy wykup jest dostępny w każdej chwili.',
              },
              {
                id: 'c',
                text: 'Tak, ale tracisz 30% kapitału początkowego',
                isCorrect: false,
                feedback: 'Wpłacony kapitał nominalny nie jest pomniejszany opłatą wykupu.',
              },
            ],
          },
        ],
      },
    ],
  },
];

export const INITIAL_COMPLETED_IDS: readonly string[] = ['etf-1'];

interface FlatNodeEntry {
  readonly topic: TopicDefinition;
  readonly node: LearningNode;
}

export const ALL_NODES_FLAT: readonly FlatNodeEntry[] = TOPICS.flatMap((topic) =>
  topic.nodes.map((node) => ({ topic, node })),
);

export const TOTAL_NODES_COUNT = ALL_NODES_FLAT.length;

export function getNodeStatus(nodeId: string, completedIds: ReadonlySet<string>): NodeStatus {
  if (completedIds.has(nodeId)) {
    return 'completed';
  }
  const index = ALL_NODES_FLAT.findIndex((entry) => entry.node.id === nodeId);
  if (index <= 0) {
    return 'active';
  }
  const previousNode = ALL_NODES_FLAT[index - 1].node;
  return completedIds.has(previousNode.id) ? 'active' : 'locked';
}

export function isTopicSandboxUnlocked(
  topic: TopicDefinition,
  completedIds: ReadonlySet<string>,
): boolean {
  return topic.nodes.every((node) => completedIds.has(node.id));
}

export function getTopicCompletedCount(
  topic: TopicDefinition,
  completedIds: ReadonlySet<string>,
): number {
  return topic.nodes.reduce((acc, node) => (completedIds.has(node.id) ? acc + 1 : acc), 0);
}

export function getFirstUnfinishedTopic(
  topics: readonly TopicDefinition[],
  completedIds: ReadonlySet<string>,
): TopicDefinition | undefined {
  return topics.find((topic) => !isTopicSandboxUnlocked(topic, completedIds));
}

export function getNextUnlockedNodeAfter(nodeId: string): FlatNodeEntry | undefined {
  const index = ALL_NODES_FLAT.findIndex((entry) => entry.node.id === nodeId);
  if (index < 0 || index + 1 >= ALL_NODES_FLAT.length) {
    return undefined;
  }
  return ALL_NODES_FLAT[index + 1];
}

export function findNodeById(nodeId: string): FlatNodeEntry | undefined {
  return ALL_NODES_FLAT.find((entry) => entry.node.id === nodeId);
}
