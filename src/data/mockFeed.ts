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
  release: string;
  dateDisplay: string;
  pubDateDisplay: string;
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

export const TOM_HANKS: SampleArtistSummary = {
  id: 31,
  name: "Tom Hanks",
  department: "Acting",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/oFvZoKI6lvU03n4YoNGAll9rkas.jpg",
  popularity: 10.9,
};

export const EMMA_MYERS: SampleArtistSummary = {
  id: 2604515,
  name: "Emma Myers",
  department: "Acting",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/v1Y8RP39135ZOary9M4MbkrCAdn.jpg",
  popularity: 6.8,
};

export const CHRISTOPHER_NOLAN: SampleArtistSummary = {
  id: 525,
  name: "Christopher Nolan",
  department: "Directing",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg",
  popularity: 7.2,
};

export const DENIS_VILLENEUVE: SampleArtistSummary = {
  id: 137427,
  name: "Denis Villeneuve",
  department: "Directing",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/xzQYqb4nR8xT7Zdw5itbEL9K3fd.jpg",
  popularity: 4.1,
};

export const SCARLETT_JOHANSSON: SampleArtistSummary = {
  id: 1245,
  name: "Scarlett Johansson",
  department: "Acting",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/tgxYh3jMs5bY2Ub4d2dcp9iaz1R.jpg",
  popularity: 11.2,
};

export const SUMMER_H_HOWELL: SampleArtistSummary = {
  id: 1524215,
  name: "Summer H. Howell",
  department: "Acting",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/YkxshNKixpwZOKgZ9bpWBuKkok.jpg",
  popularity: 7.3,
};

export const TOM_HOLLAND: SampleArtistSummary = {
  id: 1136406,
  name: "Tom Holland",
  department: "Acting",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/5OK84Wn1bIEIThFKcVoaN087mLj.jpg",
  popularity: 14.3,
};

export const JAMES_CAMERON: SampleArtistSummary = {
  id: 2710,
  name: "James Cameron",
  department: "Directing",
  avatar: "https://image.tmdb.org/t/p/w180_and_h180_face/9NAZnTjBQ9WcXAQEzZpKy4vdQto.jpg",
  popularity: 3.4,
};

export const RAW_SAMPLE_ITEMS: SampleFeedItem[] = [
  {
    id: "avatar-4",
    title: "Avatar 4",
    artist: JAMES_CAMERON,
    role: "Director, Writer, Producer",
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
    id: "emma-angry-birds-3",
    title: "The Angry Birds Movie 3",
    artist: EMMA_MYERS,
    role: "Actor (June (voice))",
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
    id: "summer-carrie",
    title: "Carrie",
    artist: SUMMER_H_HOWELL,
    role: "Actor (Carrie White)",
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
  {
    id: "holland-spiderman-bnd",
    title: "Spider-Man: Brand New Day",
    artist: TOM_HOLLAND,
    role: "Actor (Peter Parker / Spider-Man)",
    release: "2026-07-29 (US)",
    dateDisplay: "Jul 29, 2026",
    pubDateDisplay: "JUL 29, 2026 AT 9:00 AM",
    runtime: "2h 25m",
    language: "English",
    director: "Destin Daniel Cretton",
    writer: "Chris McKenna, Erik Sommers",
    stars: "Tom Holland, Sadie Sink, Zendaya",
    image: "https://image.tmdb.org/t/p/w500/bjiS5ipwxb9JFy3XRRN4OAilSeX.jpg",
    streaming: "[Opening in Theaters & IMAX nationwide]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/movie/969681",
    overview:
      "Fighting crime full-time as Spider-Man in a world that doesn't remember him—and the pressure of seeing his old friends move on without him—sparks a change in Peter Parker he may not have the power to control. But that transformation might also be the only thing that can stop a shocking new threat to the city and those he loves - a powerful villain no one can even see.",
  },
  {
    id: "denis-dune3",
    title: "Dune: Part Three",
    artist: DENIS_VILLENEUVE,
    role: "Director, Screenplay, Producer",
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
    id: "nolan-odyssey",
    title: "The Odyssey",
    artist: CHRISTOPHER_NOLAN,
    role: "Director, Writer, Producer",
    release: "2026-07-17 (US)",
    dateDisplay: "Jul 17, 2026",
    pubDateDisplay: "JUL 17, 2026 AT 9:00 AM",
    runtime: "2h 45m",
    language: "English",
    director: "Christopher Nolan",
    writer: "Christopher Nolan",
    stars: "Matt Damon, Tom Holland, Anne Hathaway",
    image: "https://image.tmdb.org/t/p/w500/5rhTDKUhPYvpdQIijFIs5VoWsON.jpg",
    streaming: "[Opening in Theaters & IMAX nationwide]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/movie/1368337",
    overview:
      "Odysseus, the legendary King of Ithaca, embarks on a long and perilous journey home after the fall of Troy, encountering mythical creatures, vengeful gods, and treacherous waters.",
  },
  {
    id: "ts5",
    title: "Toy Story 5",
    artist: TOM_HANKS,
    role: "Actor (Woody (voice))",
    release: "2026-06-19 (US)",
    dateDisplay: "Jun 19, 2026",
    pubDateDisplay: "JUN 19, 2026 AT 9:00 AM",
    runtime: "1h 42m",
    language: "English",
    director: "Andrew Stanton",
    writer: "Andrew Stanton, Kenna Harris",
    stars: "Joan Cusack, Tom Hanks, Tim Allen",
    image: "https://image.tmdb.org/t/p/w500/sfQtVlIHljToOwYjhe21KPGzZWK.jpg",
    streaming: "[Stream on Disney+]",
    rentBuy: "[Rent on Amazon Video] · [Rent on Apple TV] · [Rent on Google Play]",
    justWatchUrl: "https://www.justwatch.com/us/movie/toy-story-5",
    tmdbUrl: "https://www.themoviedb.org/movie/1084244",
    overview:
      "When Bonnie receives a Lilypad tablet as a gift and becomes obsessed, Buzz, Woody, Jessie and the rest of the gang's jobs become exponentially harder when they have to go head to head with the all-new threat to playtime.",
  },
  {
    id: "wednesday-s2",
    title: "Wednesday: Season 2",
    artist: EMMA_MYERS,
    role: "Actor (Enid Sinclair)",
    release: "2025-09-15 (US)",
    dateDisplay: "Sep 15, 2025",
    pubDateDisplay: "SEP 15, 2025 AT 12:00 AM",
    runtime: "55m/ep",
    language: "English",
    director: "Tim Burton",
    writer: "Alfred Gough, Miles Millar",
    stars: "Jenna Ortega, Emma Myers, Hunter Doohan",
    image: "https://image.tmdb.org/t/p/w500/9PFonBhy4cQy7Jz20NpMygczOkv.jpg",
    streaming: "[Stream on Netflix]",
    justWatchUrl: "https://www.justwatch.com/us/tv-show/wednesday",
    tmdbUrl: "https://www.themoviedb.org/tv/119051",
    overview:
      "Smart, sarcastic and a little dead inside, Wednesday Addams investigates twisted mysteries while making new friends — and foes — alongside her vibrant werewolf roommate Enid Sinclair at Nevermore Academy.",
  },
  {
    id: "scarlett-jurassic",
    title: "Jurassic World Rebirth",
    artist: SCARLETT_JOHANSSON,
    role: "Actor (Zora Bennett)",
    release: "2025-07-02 (US)",
    dateDisplay: "Jul 2, 2025",
    pubDateDisplay: "JUL 2, 2025 AT 9:00 AM",
    runtime: "2h 10m",
    language: "English",
    director: "Gareth Edwards",
    writer: "David Koepp",
    stars: "Scarlett Johansson, Jonathan Bailey, Mahershala Ali",
    image: "https://image.tmdb.org/t/p/w500/1RICxzeoNCAO5NpcRMIgg1XT6fm.jpg",
    streaming: "[Opening in Theaters & IMAX nationwide]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/movie/1234821",
    overview:
      "Five years after the events of Jurassic World Dominion, covert operations expert Zora Bennett leads a skilled team on a top-secret mission to secure genetic material from the world's three most massive dinosaurs.",
  },
  {
    id: "phoenician",
    title: "The Phoenician Scheme",
    artist: TOM_HANKS,
    role: "Actor (Leland)",
    release: "2025-05-23 (US)",
    dateDisplay: "May 23, 2025",
    pubDateDisplay: "MAY 23, 2025 AT 12:00 AM",
    runtime: "1h 58m",
    language: "English",
    director: "Wes Anderson",
    writer: "Wes Anderson, Roman Coppola",
    stars: "Benicio del Toro, Michael Cera, Tom Hanks",
    image: "https://image.tmdb.org/t/p/w500/iXxIUVqpQAlyy98UjUlzjkMYuj6.jpg",
    streaming: "[Stream on Peacock]",
    rentBuy: "[Rent on Apple TV] · [Rent on Amazon Video]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/movie/1137350",
    overview:
      "Wealthy businessman Zsa-zsa Korda appoints his only daughter, a nun, as sole heir to his estate. As Korda embarks on a new enterprise, they soon become the target of scheming tycoons, foreign terrorists, and determined assassins.",
  },
  {
    id: "minecraft",
    title: "A Minecraft Movie",
    artist: EMMA_MYERS,
    role: "Actor (Natalie)",
    release: "2025-04-04 (US)",
    dateDisplay: "Apr 4, 2025",
    pubDateDisplay: "APR 4, 2025 AT 9:00 AM",
    runtime: "1h 41m",
    language: "English",
    director: "Jared Hess",
    writer: "Chris Bowman, Hubbel Palmer",
    stars: "Jack Black, Jason Momoa, Emma Myers",
    image: "https://image.tmdb.org/t/p/w500/yFHHfHcUgGAxziP1C3lLt0q2T4s.jpg",
    streaming: "[Opening in Theaters & IMAX nationwide]",
    rentBuy: "[Rent on Apple TV] · [Rent on Amazon Video]",
    justWatchUrl: "https://www.justwatch.com",
    tmdbUrl: "https://www.themoviedb.org/movie/950387",
    overview:
      "Four misfits find themselves struggling with ordinary problems when they are suddenly pulled through a mysterious portal into the Overworld: a bizarre, cubic wonderland that thrives on imagination. To get back home, they'll have to master this world while embarking on a magical quest with an unexpected, expert crafter, Steve.",
  },
];

// Sort descending by release date (newest/future release first, matching RSS readers)
export const SAMPLE_ITEMS: SampleFeedItem[] = [...RAW_SAMPLE_ITEMS].sort((a, b) =>
  b.release.localeCompare(a.release)
);
