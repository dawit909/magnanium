export interface SampleArtistSummary {
  id: number;
  name: string;
  department: string;
  avatar: string;
  popularity: number;
}

export interface SampleFeedItem {
  id: string;
  title: string;
  artist: SampleArtistSummary;
  role: string;
  format?: string;
  formatNote?: string;
  release: string;
  dateDisplay: string;
  pubDateDisplay: string;
  episodes?: number;
  runtime: string;
  language: string;
  director?: string;
  writer?: string;
  stars?: string;
  image: string;
  streaming?: string;
  rentBuy?: string;
  justWatchUrl: string;
  tmdbUrl: string;
  overview: string;
}

export const JAMES_CAMERON: SampleArtistSummary = {
  id: 2710,
  name: "James Cameron",
  department: "Directing",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/9NAZnTjBQ9WcXAQEzZpKy4vdQto.jpg",
  popularity: 3.4,
};

export const EMMA_MYERS: SampleArtistSummary = {
  id: 2604515,
  name: "Emma Myers",
  department: "Acting",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/v1Y8RP39135ZOary9M4MbkrCAdn.jpg",
  popularity: 6.8,
};

export const SUMMER_H_HOWELL: SampleArtistSummary = {
  id: 1524215,
  name: "Summer H. Howell",
  department: "Acting",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/YkxshNKixpwZOKgZ9bpWBuKkok.jpg",
  popularity: 7.3,
};

export const DENIS_VILLENEUVE: SampleArtistSummary = {
  id: 137427,
  name: "Denis Villeneuve",
  department: "Directing",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/xzQYqb4nR8xT7Zdw5itbEL9K3fd.jpg",
  popularity: 4.1,
};

export const SHAMEIK_MOORE: SampleArtistSummary = {
  id: 587506,
  name: "Shameik Moore",
  department: "Acting",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/ovUKfVOwJ7CadEHaG3NDsfA5xRq.jpg",
  popularity: 1.7,
};

export const ZENDAYA: SampleArtistSummary = {
  id: 505710,
  name: "Zendaya",
  department: "Acting",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/qGkBlyn1AwQpuFnRARMRwj0iHZp.jpg",
  popularity: 9.7,
};

export const PEDRO_PASCAL: SampleArtistSummary = {
  id: 1253360,
  name: "Pedro Pascal",
  department: "Acting",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/oKcMbVn0NJTNzQt0ClKKvVXkm60.jpg",
  popularity: 9.3,
};

export const MICHELLE_YEOH: SampleArtistSummary = {
  id: 1620,
  name: "Michelle Yeoh",
  department: "Acting",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/i6fHvGt7Rb8oVyjjdQVV6vEHB94.jpg",
  popularity: 3.2,
};

export const DWAYNE_JOHNSON: SampleArtistSummary = {
  id: 18918,
  name: "Dwayne Johnson",
  department: "Acting",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/5QApZVV8FUFlVxQpIK3Ew6cqotq.jpg",
  popularity: 6.3,
};

export const TAKASHI_YAMAZAKI: SampleArtistSummary = {
  id: 43652,
  name: "Takashi Yamazaki",
  department: "Directing",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/aRxPJuOij3DUUGojtBmjAAxfL9x.jpg",
  popularity: 2.3,
};

export const RANBIR_KAPOOR: SampleArtistSummary = {
  id: 85034,
  name: "Ranbir Kapoor",
  department: "Acting",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/ymYNHV9luwgyrw17NXHqbOWTQkg.jpg",
  popularity: 2.8,
};

export const RAW_SAMPLE_ITEMS: SampleFeedItem[] = [
  {
    id: "avatar-4",
    title: "Avatar 4",
    artist: JAMES_CAMERON,
    role: "Director, Writer, Producer",
    format: "Cinema (Wide)",
    release: "2029-12-19 (US)",
    dateDisplay: "Dec 19, 2029",
    pubDateDisplay: "DEC 19, 2029 AT 9:00 AM",
    runtime: "3h 10m",
    language: "English",
    director: "James Cameron",
    writer: "James Cameron, Josh Friedman",
    stars: "Sam Worthington, Zoe Saldaña, Sigourney Weaver",
    image: "https://image.tmdb.org/t/p/w500/qzMYKnT4MG1d0gnhwytr4cKhUvS.jpg",
    streaming: "[Opening in Theaters & IMAX nationwide]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/movie/216527",
    overview:
      "The fourth chapter in James Cameron's groundbreaking Avatar saga, continuing the journey of the Sully family across uncharted biomes of Pandora.",
  },
  {
    id: "zendaya-shrek5",
    title: "Shrek 5",
    artist: ZENDAYA,
    role: "Actor (Felicia (voice))",
    format: "Cinema (Wide)",
    release: "2027-06-30 (US)",
    dateDisplay: "Jun 30, 2027",
    pubDateDisplay: "JUN 30, 2027 AT 9:00 AM",
    runtime: "1h 38m",
    language: "English",
    director: "Walt Dohrn, Conrad Vernon",
    writer: "Michael McCullers, Chris Meledandri",
    stars: "Mike Myers, Eddie Murphy, Cameron Diaz, Zendaya",
    image: "https://image.tmdb.org/t/p/w500/m9jLiemA7t2umlXKptDwtIUHU8l.jpg",
    streaming: "[Opening in Theaters & IMAX nationwide]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/movie/421892",
    overview:
      "Shrek and Donkey team up for another whirlwind, big-city adventure, this time in the magical city of Further Further Away.",
  },
  {
    id: "shameik-spiderverse",
    title: "Spider-Man: Beyond the Spider-Verse",
    artist: SHAMEIK_MOORE,
    role: "Actor (Miles Morales (voice))",
    format: "Cinema (Wide)",
    release: "2027-06-16 (US)",
    dateDisplay: "Jun 16, 2027",
    pubDateDisplay: "JUN 16, 2027 AT 9:00 AM",
    runtime: "2h 20m",
    language: "English",
    director: "Bob Persichetti, Justin K. Thompson",
    writer: "Christopher Miller, Phil Lord, David Callaham",
    stars: "Shameik Moore, Hailee Steinfeld, Oscar Isaac, Jason Schwartzman",
    image: "https://image.tmdb.org/t/p/w500/9KAe39xqyZnv9J4W3DRGdQqX82h.jpg",
    streaming: "[Opening in Theaters & IMAX nationwide]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/movie/911916",
    overview:
      "Hunted by Miguel O'Hara's Spider Society and betrayed by his friends, Miles finds himself in the darkest corners of the Spider-Verse in search of a way home. Knowing that his family has been not only fractured but endangered by his calling, it's a race against the clock for Miles to travel across the wildest reaches of time and space to fight for and reunite everything he holds most dear.",
  },
  {
    id: "dwayne-jumanji",
    title: "Jumanji: Open World",
    artist: DWAYNE_JOHNSON,
    role: "Actor (Dr. Smolder Bravestone), Producer",
    format: "Cinema (Wide)",
    release: "2026-12-23 (US)",
    dateDisplay: "Dec 23, 2026",
    pubDateDisplay: "DEC 23, 2026 AT 9:00 AM",
    runtime: "2h 05m",
    language: "English",
    director: "Jake Kasdan",
    writer: "Jake Kasdan, Jeff Pinkner, Scott Rosenberg",
    stars: "Dwayne Johnson, Kevin Hart, Jack Black, Karen Gillan",
    image: "https://image.tmdb.org/t/p/w500/qGFuvcXqQdXS5ZNblDlVTOmK6mq.jpg",
    streaming: "[Opening in Theaters & IMAX nationwide]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/movie/1260649",
    overview:
      "Our heroes have escaped the ever-changing jungles of Jumanji before, but this time the game comes to us - as Jumanji breaks free of its console, unleashing its chaos into our world.",
  },
  {
    id: "emma-angry-birds-3",
    title: "The Angry Birds Movie 3",
    artist: EMMA_MYERS,
    role: "Actor (June (voice))",
    format: "Cinema (Wide)",
    release: "2026-12-23 (US)",
    dateDisplay: "Dec 23, 2026",
    pubDateDisplay: "DEC 23, 2026 AT 9:00 AM",
    runtime: "1h 36m",
    language: "English",
    director: "John Rice",
    writer: "Thurop Van Orman",
    stars: "Jason Sudeikis, Josh Gad, Emma Myers",
    image: "https://image.tmdb.org/t/p/w500/oxaW6X3xohnzdFSBKCrCjRDckMe.jpg",
    streaming: "[Opening in Theaters & IMAX nationwide]",
    justWatchUrl: "https://www.justwatch.com/us/movie/the-angry-birds-movie-3",
    tmdbUrl: "https://www.themoviedb.org/movie/1300926",
    overview:
      "Red faces his greatest challenge yet — surviving fatherhood — while saving the world alongside friends old and new in an all-new high-flying animated adventure.",
  },
  {
    id: "denis-dune3",
    title: "Dune: Part Three",
    artist: DENIS_VILLENEUVE,
    role: "Director, Screenplay, Producer",
    format: "Cinema (Wide)",
    release: "2026-12-18 (US)",
    dateDisplay: "Dec 18, 2026",
    pubDateDisplay: "DEC 18, 2026 AT 9:00 AM",
    runtime: "2h 50m",
    language: "English",
    director: "Denis Villeneuve",
    writer: "Denis Villeneuve, Jon Spaihts",
    stars: "Timothée Chalamet, Zendaya, Florence Pugh",
    image: "https://image.tmdb.org/t/p/w500/glt0v4I89rMWstDNCaFXc5SNyO1.jpg",
    streaming: "[Opening in Theaters & IMAX nationwide]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/movie/1170608",
    overview:
      "Nearly two decades after he seized control of the Imperium, Paul Atreides is now Emperor of the Known Universe, facing the unintended holy war waged in his name and conspiracies threatening Arrakis.",
  },
  {
    id: "pedro-avengers-doomsday",
    title: "Avengers: Doomsday",
    artist: PEDRO_PASCAL,
    role: "Actor (Reed Richards / Mister Fantastic)",
    format: "Cinema (Wide)",
    release: "2026-12-16 (US)",
    dateDisplay: "Dec 16, 2026",
    pubDateDisplay: "DEC 16, 2026 AT 9:00 AM",
    runtime: "2h 40m",
    language: "English",
    director: "Anthony Russo, Joe Russo",
    writer: "Stephen McFeely, Michael Waldron",
    stars: "Robert Downey Jr., Pedro Pascal, Chris Evans, Chris Hemsworth",
    image: "https://image.tmdb.org/t/p/w500/jzPwsojjFStf5lR5Nm07w2hH56G.jpg",
    streaming: "[Opening in Theaters & IMAX nationwide]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/movie/1003596",
    overview:
      "Beloved heroes from three distinct universes are set on a deadly collision course and face an existential threat unlike anything they've ever encountered.",
  },
  {
    id: "michelle-bladerunner",
    title: "Blade Runner 2099: Season 1",
    artist: MICHELLE_YEOH,
    role: "Actor (Olwen)",
    format: "Series Premiere",
    episodes: 8,
    release: "2026-11-25 (US)",
    dateDisplay: "Nov 25, 2026",
    pubDateDisplay: "NOV 25, 2026 AT 12:00 AM",
    runtime: "55m/ep",
    language: "English",
    director: "Jonathan van Tulleken",
    writer: "Silka Luisa, Ridley Scott",
    stars: "Hunter Schafer, Michelle Yeoh, Dimitri Abold, Lewis Gribben",
    image: "https://image.tmdb.org/t/p/w500/gMdQMmqKu5zee7sCGGZvbSHFVb2.jpg",
    streaming: "[Stream on Prime Video]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/tv/171802",
    overview:
      "Fifty years after the events of Blade Runner 2049, Los Angeles has been reborn, just not by humanity. Cora, a fugitive in a final bid to stop running, takes on one last identity: a Blade Runner. Forced to partner with Olwen, a Replicant days from dying, she hunts down a runaway hiding a truth that could collapse their fragile city.",
  },
  {
    id: "ranbir-ramayana",
    title: "Ramayana: Rise of a Legend",
    artist: RANBIR_KAPOOR,
    role: "Actor (Prince Ram / Lord Vishnu)",
    format: "Cinema (Wide)",
    release: "2026-11-04 (IN)",
    dateDisplay: "Nov 4, 2026",
    pubDateDisplay: "NOV 4, 2026 AT 9:00 AM",
    runtime: "3h 15m",
    language: "Hindi",
    director: "Nitesh Tiwari",
    writer: "Nitesh Tiwari, Shridhar Raghavan",
    stars: "Ranbir Kapoor, Yash, Sai Pallavi, Ravi Dubey",
    image: "https://image.tmdb.org/t/p/w500/hz2Hv8tPToHvQ7HaxzqeLvahmcJ.jpg",
    streaming: "[Opening in Theaters worldwide]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/movie/656908",
    overview:
      "An ancient epic follows a young prince and princess whose marriage and subsequent exile mark the beginning of a legendary journey. Their story of love, duty and destiny sets the stage for greater challenges ahead.",
  },
  {
    id: "takashi-godzilla",
    title: "Godzilla Minus Zero",
    artist: TAKASHI_YAMAZAKI,
    role: "Director, Writer, Visual Effects",
    format: "Cinema (Wide)",
    release: "2026-11-03 (JP)",
    dateDisplay: "Nov 3, 2026",
    pubDateDisplay: "NOV 3, 2026 AT 9:00 AM",
    runtime: "2h 12m",
    language: "Japanese",
    director: "Takashi Yamazaki",
    writer: "Takashi Yamazaki",
    stars: "Ryunosuke Kamiki, Minami Hamabe, Yuki Yamada, Kuranosuke Sasaki",
    image: "https://image.tmdb.org/t/p/w500/hSmIJluOJmTWvJs4d7kHRxjc8s8.jpg",
    streaming: "[Opening in Theaters & IMAX]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/movie/1381071",
    overview:
      "War reduced Japan to zero, and Godzilla plunged it into minus. Two years have passed since then, and the country has faced agonizing struggles to achieve recovery and finally reclaim its daily life. Just as humanity managed to cling to a hard-won peace, a new threat strikes, crushing hope in an instant. There is no third time. Everything ends here.",
  },
  {
    id: "summer-carrie",
    title: "Carrie",
    artist: SUMMER_H_HOWELL,
    role: "Actor (Carrie White)",
    format: "Series Premiere",
    episodes: 8,
    release: "2026-10-07 (US)",
    dateDisplay: "Oct 7, 2026",
    pubDateDisplay: "OCT 7, 2026 AT 12:00 AM",
    runtime: "50m/ep",
    language: "English",
    director: "Mike Flanagan",
    writer: "Mike Flanagan, Stephen King",
    stars: "Summer H. Howell, Samantha Sloyan, Siena Agudong",
    image: "https://image.tmdb.org/t/p/w500/6mUMquPQBFJGqTACS3Azkwwrx8d.jpg",
    streaming: "[Stream on Prime Video]",
    justWatchUrl: "https://www.justwatch.com/us/tv-show/carrie",
    tmdbUrl: "https://www.themoviedb.org/tv/288673",
    overview:
      "After her father's sudden, untimely death thrusts her into the unforgiving ecosystem of public high school, Carrie is forced to navigate a viral bullying scandal that tears through her community, the relentless pressure and casual cruelty of the social‑media age, and the awakening of mysterious telekinetic powers that rise alongside her adolescence.",
  },
];

// Sort descending by release date (newest/future release first, matching RSS readers)
export const SAMPLE_ITEMS: SampleFeedItem[] = [...RAW_SAMPLE_ITEMS].sort((a, b) =>
  b.release.localeCompare(a.release)
);
