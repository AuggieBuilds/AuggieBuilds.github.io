// City Capacity research database — single source of truth for the bathtub model.
// All values transcribed verbatim from the AI Integration Reports (v1.0, 2026-07-18).
// cci points: [year, displayed value, unrounded value, uncertainty ±, confidence]
window.CITY_DATABASE = {
  order: ["pittsburgh", "detroit", "boston", "newyork", "austin"],
  attrs: [
    { key: "external_earning_power", label: "External earning power", w: 0.20 },
    { key: "local_retention_and_ownership", label: "Local retention & ownership", w: 0.15 },
    { key: "reinvestment_and_capital_formation", label: "Reinvestment & capital formation", w: 0.15 },
    { key: "human_capacity", label: "Human capacity", w: 0.15 },
    { key: "institutional_depth", label: "Institutional depth", w: 0.15 },
    { key: "fiscal_and_physical_capacity", label: "Fiscal & physical capacity", w: 0.10 },
    { key: "economic_resilience", label: "Economic resilience", w: 0.10 }
  ],
  benchmarkYears: [1970, 1980, 1990, 2000, 2010, 2020],
  cities: {
    pittsburgh: {
      name: "Pittsburgh",
      region: "Fixed seven-county Pittsburgh region",
      geographyNote: "Allegheny, Armstrong, Beaver, Butler, Fayette, Washington, Westmoreland — fixed for every year. 2020 population 2,370,930.",
      headline: "Pittsburgh rebuilt capacity after industrial collapse—but not the same economy.",
      cci: [
        [1970, 100, 100.0, 0, 0.95],
        [1980, 92, 91.5, 5, 0.82],
        [1990, 80, 80.0, 6, 0.84],
        [2000, 87, 87.05, 7, 0.76],
        [2010, 96, 96.25, 7, 0.79],
        [2020, 103, 102.7, 8, 0.75]
      ],
      attrPoints: {
        1970: [100, 100, 100, 100, 100, 100, 100],
        1980: [95, 91, 87, 93, 101, 91, 76],
        1990: [79, 67, 72, 83, 106, 77, 73],
        2000: [87, 65, 82, 94, 116, 73, 88],
        2010: [98, 66, 94, 105, 126, 76, 104],
        2020: [102, 68, 103, 112, 137, 82, 111]
      },
      annotations: [
        { y: 1970, title: "Industrial peak, concentrated risk", text: "Manufacturing supplied roughly one-third of regional jobs and nearly 40% of earnings.", src: "cleveland_fed_2018" },
        { y: 1983, title: "Steel shock and recession trough", text: "The region lost about 78,000 jobs, or 8.5%; unemployment exceeded 17% in January 1983.", src: "cleveland_fed_2018" },
        { y: 1990, title: "Post-industrial trough", text: "Manufacturing's employment share had fallen to roughly 14%, and the region had lost almost 200,000 residents during the 1980s.", src: "cleveland_fed_2018" },
        { y: 2003, title: "Central-city fiscal distress", text: "The City of Pittsburgh entered Pennsylvania's Act 47 program. This is not a regional measure.", src: "pa_dced_act47" },
        { y: 2010, title: "A different economic base", text: "Manufacturing was roughly 7% of employment; Pittsburgh ranked in the top quintile of large metros for educated 25–35-year-olds.", src: "cleveland_fed_2018" },
        { y: 2018, title: "Act 47 exit", text: "Pennsylvania rescinded the City of Pittsburgh's financially distressed designation.", src: "pa_dced_act47" },
        { y: 2020, title: "Institution-led capacity", text: "The fixed seven-county region had 2,370,930 residents. Pitt and CMU reported a combined $1.493 billion in R&D expenditures.", src: "nsf_pitt_herd" }
      ],
      series: [
        { id: "pop", label: "Population", unit: "people", type: "measured",
          points: [{ y: 1970, v: 2750000, q: "≈" }, { y: 2020, v: 2370930 }],
          note: "The region lost almost 200,000 residents during the 1980s, approximately 7 percent.", src: "cleveland_fed_2018" },
        { id: "mfgemp", label: "Manufacturing employment share", unit: "% of regional employment", type: "measured",
          points: [{ y: 1970, v: 33, q: "≈" }, { y: 1990, v: 14, q: "≈" }, { y: 2010, v: 7, q: "≈" }],
          note: "Approximate shares of regional employment.", src: "cleveland_fed_2018" },
        { id: "mfgearn", label: "Manufacturing earnings share", unit: "% of regional earnings", type: "measured",
          points: [{ y: 1970, v: 40, q: "≈" }, { y: 2016, v: 9, q: "<" }],
          note: "Fell from ≈40% of earnings (1970) to under 9% (2016).", src: "cleveland_fed_2018" },
        { id: "pci", label: "Per-capita income vs U.S.", unit: "% above/below U.S. average", type: "measured",
          points: [{ y: 1980, v: 2.6 }, { y: 1988, v: -4.4, q: "≈yr" }, { y: 1991, v: 0, q: "≈yr" }, { y: 2010, v: 6 }, { y: 2016, v: 4 }],
          note: "Regional per-capita income relative to the U.S. average.", src: "cleveland_fed_2018" },
        { id: "rd", label: "Pitt + CMU R&D", unit: "thousands of nominal dollars", type: "measured",
          points: [{ y: 2015, v: 1103209 }, { y: 2016, v: 1208961 }, { y: 2017, v: 1267806 }, { y: 2018, v: 1337896 }, { y: 2019, v: 1440671 }, { y: 2020, v: 1492528 }, { y: 2021, v: 1537792 }, { y: 2022, v: 1701705 }, { y: 2023, v: 1882835 }, { y: 2024, v: 2009927 }],
          note: "University of Pittsburgh and Carnegie Mellon only; not all regional R&D.", src: "nsf_pitt_herd" }
      ],
      sources: [
        { id: "cleveland_fed_2018", title: "Rust and Renewal: A Pittsburgh Retrospective", publisher: "Federal Reserve Bank of Cleveland", url: "https://www.clevelandfed.org/regional-analysis/pittsburgh-retrospective" },
        { id: "census_2020_counties", title: "2020 Decennial Census county populations", publisher: "U.S. Census Bureau", url: "https://tigerweb.geo.census.gov/tigerwebmain/Files/bas26/tigerweb_bas26_county_2020_tab20_pa.html" },
        { id: "nsf_pitt_herd", title: "University of Pittsburgh total R&D expenditures, 2015–2024", publisher: "NSF NCSES HERD Survey", url: "https://ncsesdata.nsf.gov/profiles/site?id=h1&method=report&tin=U3386006" },
        { id: "nsf_cmu_herd", title: "Carnegie Mellon University total R&D expenditures, 2015–2024", publisher: "NSF NCSES HERD Survey", url: "https://ncsesdata.nsf.gov/profiles/site?id=h1&method=report&tin=U0548001" },
        { id: "pa_dced_act47", title: "Act 47 Financial Distress", publisher: "PA Dept. of Community & Economic Development", url: "https://dced.pa.gov/local-government/act-47-financial-distress/" },
        { id: "pgh_hq_proxy", title: "Headquarters town: Pittsburgh's changing Fortune 500 presence", publisher: "Pittsburgh Post-Gazette", url: "https://www.post-gazette.com/business/bop/2019/05/06/headquarters-town-pittsburgh-fortune-500-list/stories/201905050006" }
      ]
    },
    detroit: {
      name: "Detroit",
      region: "Fixed three-county Detroit region (Tri-County)",
      geographyNote: "Wayne, Oakland, Macomb — fixed for every year. 2020 population 3,949,174.",
      headline: "Detroit survived a systemic industrial collapse and restructuring—rebuilding a leaner, tech-integrated mobility ecosystem below historical baseline capacity.",
      cci: [
        [1970, 100, 100.0, 0, 0.95],
        [1980, 84, 84.05, 5, 0.80],
        [1990, 77, 76.95, 6, 0.78],
        [2000, 85, 85.30, 6, 0.75],
        [2010, 64, 63.80, 8, 0.70],
        [2020, 81, 80.60, 7, 0.76]
      ],
      attrPoints: {
        1970: [100, 100, 100, 100, 100, 100, 100],
        1980: [86, 88, 85, 88, 92, 74, 65],
        1990: [78, 74, 78, 82, 95, 62, 58],
        2000: [92, 76, 88, 88, 102, 68, 70],
        2010: [55, 62, 64, 70, 98, 45, 42],
        2020: [78, 70, 84, 82, 108, 66, 68]
      },
      annotations: [
        { y: 1970, title: "Peak industrial concentration", text: "Unrivaled global manufacturing scale paired with systemic exposure to singular economic sector volatility.", src: "fed_chicago" },
        { y: 1980, title: "Foreign competition & energy shocks", text: "Energy crises disrupt big-block auto manufacturing; geographic decentralization into outer counties picks up speed.", src: "fed_chicago" },
        { y: 1990, title: "Deindustrialization trough", text: "Heavy core-city industrial downscaling occurs; Oakland County captures engineering and tech office migration.", src: "semcog_profile" },
        { y: 2000, title: "Truck & SUV profit insulation", text: "High domestic margins on heavy consumer passenger trucks shield corporate networks prior to structural shifts.", src: "fed_chicago" },
        { y: 2010, title: "Great Recession & Auto bankruptcies", text: "GM and Chrysler declare bankruptcy (2009); widespread credit freezes trigger extreme regional capacity strain.", src: "fed_chicago" },
        { y: 2020, title: "Restructured mobility baseline", text: "Post-bankruptcy operational stabilization; emergence of autonomous vehicle R&D and clean energy transition frameworks.", src: "census_2020_counties" }
      ],
      series: [
        { id: "pop", label: "Regional population", unit: "people", type: "measured",
          points: [{ y: 1970, v: 4200000, q: "≈" }, { y: 2020, v: 3949174 }],
          note: "Massive internal rearrangement: the central city contracted while northern suburban counties expanded.", src: "census_2020_counties" },
        { id: "popcity", label: "City of Detroit population", unit: "people", type: "measured",
          points: [{ y: 1970, v: 1511482 }, { y: 2020, v: 639111 }],
          note: "City proper only; contrasts with relative regional stability.", src: "semcog_profile" },
        { id: "rd", label: "Wayne State R&D", unit: "thousands of nominal dollars", type: "measured",
          points: [{ y: 2022, v: 242200 }, { y: 2023, v: 250900 }, { y: 2024, v: 291700 }],
          note: "Primary public higher-education research investment within the core urban geography.", src: "nsf_herd_wsu" }
      ],
      sources: [
        { id: "semcog_profile", title: "Historical Data and Demographic Profiles", publisher: "Southeast Michigan Council of Governments (SEMCOG)", url: "https://maps.semcog.org/2020census/" },
        { id: "census_2020_counties", title: "Decennial County Population Totals (1970–2020)", publisher: "U.S. Census Bureau", url: "https://www.census.gov/quickfacts" },
        { id: "nsf_herd_wsu", title: "Wayne State University R&D (HERD Survey)", publisher: "NSF NCSES", url: "https://research.wayne.edu/news/wayne-state-university-rises-in-nsf-rd-herd-rankings-67879" },
        { id: "fed_chicago", title: "Historical Automotive Manufacturing and Regional Employment Studies", publisher: "Federal Reserve Bank of Chicago (Detroit Branch)", url: "https://www.chicagofed.org/region/bhc/detroit-historical" }
      ]
    },
    boston: {
      name: "Boston",
      region: "Fixed five-county Boston region",
      geographyNote: "Middlesex, Essex, Suffolk, Norfolk, Plymouth — fixed for every year. 2020 population 4,496,567.",
      headline: "Boston engineered a wholesale structural transformation into a premier global knowledge ecosystem—yet faces severe physical infrastructure and cost constraints.",
      cci: [
        [1970, 100, 100.0, 0, 0.95],
        [1980, 110, 110.4, 4, 0.85],
        [1990, 97, 97.05, 5, 0.83],
        [2000, 115, 114.65, 6, 0.80],
        [2010, 127, 127.35, 6, 0.82],
        [2020, 138, 138.35, 7, 0.78]
      ],
      attrPoints: {
        1970: [100, 100, 100, 100, 100, 100, 100],
        1980: [118, 112, 120, 110, 108, 88, 105],
        1990: [98, 88, 94, 108, 115, 85, 82],
        2000: [122, 92, 125, 120, 128, 95, 110],
        2010: [136, 94, 142, 135, 148, 98, 125],
        2020: [152, 98, 158, 148, 165, 92, 134]
      },
      annotations: [
        { y: 1970, title: "Post-industrial crisis and flight", text: "Structural contraction in legacy trades alongside severe demographic decentralization and urban strain.", src: "bpda_history" },
        { y: 1980, title: "The Massachusetts Miracle & Prop 2½", text: "Prolific minicomputer innovations expand Route 128; tax cap curtails local property levies.", src: "bpda_history" },
        { y: 1990, title: "Tech collapse and banking crunch", text: "Widespread hardware paradigm shifts and real estate crash push regional unemployment near 9% and break local banks.", src: "bpda_history" },
        { y: 2000, title: "Knowledge economy transition", text: "Emergence of dominant digital software, biomedical pilots, genomics, and major mutual fund management.", src: "bpda_history" },
        { y: 2010, title: "Elite biotech cluster boom", text: "Kendall Square and the Seaport District solidify global life-science super-cluster hegemony.", src: "bpda_history" },
        { y: 2020, title: "Premier institutional resilience", text: "5-county population tracks at 4,496,567; combined anchor university R&D scales past $2.20 billion amid transit/housing strain.", src: "nsf_herd_bos" }
      ],
      series: [
        { id: "pop", label: "Population", unit: "people", type: "measured",
          points: [{ y: 1970, v: 3708710 }, { y: 2020, v: 4496567 }],
          note: "Slow but steady talent-driven immigration and high educational-attainment gains over five decades.", src: "census_2020_counties" },
        { id: "rd", label: "MIT + Harvard R&D", unit: "thousands of nominal dollars", type: "measured",
          points: [{ y: 2015, v: 1980719 }, { y: 2016, v: 2026159 }, { y: 2017, v: 2062017 }, { y: 2018, v: 2114336 }, { y: 2019, v: 2199466 }, { y: 2020, v: 2207968 }, { y: 2021, v: 2199076 }, { y: 2022, v: 2299166 }, { y: 2023, v: 2380081 }, { y: 2024, v: 2515554 }],
          note: "MIT and Harvard main research centers only, excluding adjacent research hospitals.", src: "nsf_herd_bos" }
      ],
      sources: [
        { id: "bpda_history", title: "History of Boston's Economy", publisher: "Boston Planning & Development Agency (BPDA)", url: "https://www.bostonplans.org/getattachment/15ca7a2f-56d1-4770-ba7f-8c1ce73d25b8/History-of-Bostons-Economy.pdf" },
        { id: "census_2020_counties", title: "Decennial County Population Totals (1970–2020)", publisher: "U.S. Census Bureau", url: "https://www.census.gov/quickfacts" },
        { id: "nsf_herd_bos", title: "Higher Education R&D (HERD) Survey", publisher: "NSF NCSES", url: "https://ncsesdata.nsf.gov/profiles/site?method=rankingBySource&ds=HERD" },
        { id: "harvard_mit", title: "Harvard University & MIT Institutional Research Data", publisher: "Harvard OIRA / MIT", url: "https://oira.harvard.edu/factbook/fact-book-research/" }
      ]
    },
    newyork: {
      name: "New York City",
      region: "Fixed five-borough New York City region",
      geographyNote: "Manhattan, Brooklyn, Queens, The Bronx, Staten Island — fixed for every year. 2020 population 8,804,190.",
      headline: "New York engineered a global financial transformation to overcome fiscal collapse—yet faces deep infrastructure maintenance backlogs.",
      cci: [
        [1970, 100, 100.0, 0, 0.95],
        [1980, 89, 89.05, 4, 0.84],
        [1990, 101, 101.3, 5, 0.81],
        [2000, 114, 113.75, 5, 0.83],
        [2010, 121, 121.2, 6, 0.80],
        [2020, 128, 127.95, 7, 0.77]
      ],
      attrPoints: {
        1970: [100, 100, 100, 100, 100, 100, 100],
        1980: [92, 94, 95, 90, 102, 55, 80],
        1990: [112, 88, 110, 104, 112, 74, 94],
        2000: [134, 85, 124, 118, 122, 88, 108],
        2010: [142, 82, 136, 128, 134, 94, 114],
        2020: [156, 80, 148, 136, 145, 82, 122]
      },
      annotations: [
        { y: 1970, title: "Industrial unwinding", text: "Heavy manufacturing closures and deep demographic out-migration to suburban borders.", src: "nyc_dcp" },
        { y: 1980, title: "Post-bankruptcy reconstruction", text: "The aftermath of the 1975 default leaves physical infrastructure and mass transit severely degraded.", src: "nyc_dcp" },
        { y: 1990, title: "Wall Street liberalization", text: "Mass scaling of investment banking, securities trading, and global corporate legal systems.", src: "ny_fed" },
        { y: 2000, title: "The safety dividend", text: "Precipitous drops in crime and sweeping commercial cleanup spur real estate and tourism peaks.", src: "nyc_dcp" },
        { y: 2010, title: "Post-crisis resilience", text: "Rapid absorption of 9/11 disruptions and the 2008 mortgage crash via global capital concentration.", src: "ny_fed" },
        { y: 2020, title: "Real estate peak vs. transit backlogs", text: "Historic real estate valuations paired with structural commercial workplace shifts and transit budget strain.", src: "mta" }
      ],
      series: [],
      sources: [
        { id: "nyc_dcp", title: "Historical Population and Employment Overviews", publisher: "NYC Department of City Planning", url: "https://www.nyc.gov/site/planning/data-maps/nyc-population/historical-population-data.page" },
        { id: "ny_fed", title: "Economic Review and Corporate Tax Studies", publisher: "Federal Reserve Bank of New York", url: "https://www.newyorkfed.org/research/regional_economy" },
        { id: "mta", title: "Historical Capital Program Trackers", publisher: "MTA New York City Transit", url: "https://new.mta.info/transparency/leadership-and-governance" }
      ]
    },
    austin: {
      name: "Austin",
      region: "Fixed five-county Greater Austin region",
      geographyNote: "Travis, Williamson, Hays, Bastrop, Caldwell — fixed for every year. 2020 population 2,283,371.",
      headline: "Austin transformed from a quiet capital into an overwhelming global technology hub—now testing the physical limits of its infrastructure.",
      cci: [
        [1970, 100, 100.0, 0, 0.95],
        [1980, 115, 114.95, 4, 0.86],
        [1990, 129, 128.8, 5, 0.83],
        [2000, 148, 148.4, 5, 0.80],
        [2010, 166, 166.25, 6, 0.84],
        [2020, 195, 194.9, 7, 0.79]
      ],
      attrPoints: {
        1970: [100, 100, 100, 100, 100, 100, 100],
        1980: [124, 105, 128, 116, 110, 108, 105],
        1990: [148, 98, 152, 134, 124, 112, 118],
        2000: [185, 92, 192, 158, 138, 114, 130],
        2010: [214, 90, 225, 184, 152, 110, 148],
        2020: [268, 88, 282, 220, 174, 95, 172]
      },
      annotations: [
        { y: 1970, title: "Institutional anchor", text: "Economy insulated by stable government and University of Texas footprints.", src: "capcog" },
        { y: 1980, title: "Tech consortia framework", text: "Foundations for hardware research laid down by the attraction of MCC and Sematech.", src: "capcog" },
        { y: 1990, title: "Silicon Hills breakout", text: "Dell Computer scales dynamically; major production facilities establish advanced manufacturing footprints.", src: "capcog" },
        { y: 2000, title: "Dot-com software boom", text: "High-yield venture capital expansions and digital networking infrastructure take center stage.", src: "capcog" },
        { y: 2010, title: "The great talent migration", text: "Accelerating talent influx from coastal metros transforms regional tech concentrations.", src: "capcog" },
        { y: 2020, title: "Enterprise hyper-growth", text: "Gigafactory installations and high corporate migrations strain regional transit, utility grids, and home prices.", src: "txdot" }
      ],
      series: [
        { id: "pop", label: "Population", unit: "people", type: "measured",
          points: [{ y: 1970, v: 400000, q: "<" }, { y: 2020, v: 2283371 }],
          note: "Fewer than 400,000 residents in 1970; 2,283,371 by the 2020 Census.", src: "census_2020_counties" }
      ],
      sources: [
        { id: "capcog", title: "Historical Economic and Demographic Records", publisher: "Capital Area Council of Governments (CAPCOG)", url: "https://www.capcog.org/data-maps" },
        { id: "census_2020_counties", title: "Decennial County Population Totals (1970–2020)", publisher: "U.S. Census Bureau", url: "https://www.census.gov/quickfacts" },
        { id: "txdot", title: "I-35 Capital Express Master Planning Project Data", publisher: "Texas Department of Transportation (TxDOT)", url: "https://my35capex.com/" }
      ]
    }
  }
};
