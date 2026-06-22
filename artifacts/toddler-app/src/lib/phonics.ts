// Read Write Inc-style phonics data for the toddler app.
//
// Each phoneme stores its three audio-relevant values SEPARATELY so the voice is
// never left to guess a pronunciation from the glyph on screen:
//  - displayLetter:  what is shown on screen ("b", "sh").
//  - letterName:     the alphabet NAME ("bee", "es"). Only spoken by games that
//                    deliberately teach letter names, never during phonics.
//  - phonicsSound:   a spelling tuned so the browser voice sounds out the PURE
//                    SOUND ("buh", "mmmm") rather than the letter name. Continuant
//                    sounds can be held (m, s, f, n, l, r, v, z, sh); stop sounds
//                    are approximated ("duh", "tuh") because text-to-speech cannot
//                    produce a clean schwa-free stop.
//  - rhyme:          a short, original child-friendly phrase.
//  - word/emoji:     an example word + picture.
//  - tracingPhrase:  the spoken "how to form the letter" guide used while tracing
//                    (UK Maisie-style phrases). Parent-editable later.

export interface Phoneme {
  id: string;
  displayLetter: string;
  letterName: string;
  phonicsSound: string;
  rhyme: string;
  word: string;
  emoji: string;
  tracingPhrase: string;
}

// Order follows the common phonics teaching sequence the request listed.
export const PHONEMES: Phoneme[] = [
  { id: "m",  displayLetter: "m",  letterName: "em",   phonicsSound: "mmmm",  rhyme: "Munching mangoes",      word: "mango",     emoji: "🥭", tracingPhrase: "Down Maisie, mountain, mountain" },
  { id: "a",  displayLetter: "a",  letterName: "ay",   phonicsSound: "aaa",   rhyme: "Ants on an apple",      word: "apple",     emoji: "🍎", tracingPhrase: "Around the apple and down the leaf" },
  { id: "s",  displayLetter: "s",  letterName: "es",   phonicsSound: "sssss", rhyme: "Silly snake slides",    word: "snake",     emoji: "🐍", tracingPhrase: "Slither down the snake" },
  { id: "d",  displayLetter: "d",  letterName: "dee",  phonicsSound: "duh",   rhyme: "Dizzy dog digs",        word: "dog",       emoji: "🐶", tracingPhrase: "Around his bottom, up his tall neck and down to his feet" },
  { id: "t",  displayLetter: "t",  letterName: "tee",  phonicsSound: "tuh",   rhyme: "Tiny tiger taps",       word: "tiger",     emoji: "🐯", tracingPhrase: "Down the tower, across the tower" },
  { id: "i",  displayLetter: "i",  letterName: "eye",  phonicsSound: "ih",    rhyme: "In the igloo",          word: "igloo",     emoji: "🧊", tracingPhrase: "Down the insect's body, dot for the head" },
  { id: "n",  displayLetter: "n",  letterName: "en",   phonicsSound: "nnnn",  rhyme: "Noisy in the nest",     word: "nest",      emoji: "🪺", tracingPhrase: "Down Nobby and over his net" },
  { id: "p",  displayLetter: "p",  letterName: "pee",  phonicsSound: "puh",   rhyme: "Playful little pig",    word: "pig",       emoji: "🐷", tracingPhrase: "Down the plait and over the pirate's face" },
  { id: "g",  displayLetter: "g",  letterName: "jee",  phonicsSound: "guh",   rhyme: "Giggly goat grins",     word: "goat",      emoji: "🐐", tracingPhrase: "Around the girl's face, down her hair and give her a curl" },
  { id: "o",  displayLetter: "o",  letterName: "oh",   phonicsSound: "o",     rhyme: "Orange octopus",        word: "octopus",   emoji: "🐙", tracingPhrase: "All around the orange" },
  { id: "c",  displayLetter: "c",  letterName: "see",  phonicsSound: "cuh",   rhyme: "Curious cat creeps",    word: "cat",       emoji: "🐱", tracingPhrase: "Curl around the caterpillar" },
  { id: "k",  displayLetter: "k",  letterName: "kay",  phonicsSound: "kuh",   rhyme: "Kicking the kite",      word: "kite",      emoji: "🪁", tracingPhrase: "Down the kangaroo's body, tail and leg" },
  { id: "u",  displayLetter: "u",  letterName: "you",  phonicsSound: "uh",    rhyme: "Up with the umbrella",  word: "umbrella",  emoji: "☂️", tracingPhrase: "Down and under, up to the top and draw the puddle" },
  { id: "b",  displayLetter: "b",  letterName: "bee",  phonicsSound: "buh",   rhyme: "Big brown bear",        word: "bear",      emoji: "🐻", tracingPhrase: "Down the laces to the heel, round the toe" },
  { id: "f",  displayLetter: "f",  letterName: "ef",   phonicsSound: "fffff", rhyme: "Flappy fish flips",     word: "fish",      emoji: "🐟", tracingPhrase: "Down the stem and draw the leaves" },
  { id: "e",  displayLetter: "e",  letterName: "ee",   phonicsSound: "eh",    rhyme: "Eggs for everyone",     word: "egg",       emoji: "🥚", tracingPhrase: "Lift off the top and scoop out the egg" },
  { id: "l",  displayLetter: "l",  letterName: "el",   phonicsSound: "llll",  rhyme: "Lazy lion licks",       word: "lion",      emoji: "🦁", tracingPhrase: "Down the long leg" },
  { id: "h",  displayLetter: "h",  letterName: "aitch", phonicsSound: "huh",  rhyme: "Happy in a hat",        word: "hat",       emoji: "🎩", tracingPhrase: "Down the head to the hooves and over his back" },
  { id: "r",  displayLetter: "r",  letterName: "ar",   phonicsSound: "rrrr",  rhyme: "Running rabbit races",  word: "rabbit",    emoji: "🐰", tracingPhrase: "Down his back, then curl over his arm" },
  { id: "j",  displayLetter: "j",  letterName: "jay",  phonicsSound: "juh",   rhyme: "Jolly jellyfish",       word: "jellyfish", emoji: "🪼", tracingPhrase: "Down his body, curl and dot" },
  { id: "v",  displayLetter: "v",  letterName: "vee",  phonicsSound: "vvvv",  rhyme: "Vroom goes the van",    word: "van",       emoji: "🚐", tracingPhrase: "Down a wing, up a wing" },
  { id: "y",  displayLetter: "y",  letterName: "why",  phonicsSound: "yuh",   rhyme: "Yellow yo-yo spins",    word: "yo-yo",     emoji: "🪀", tracingPhrase: "Down a horn, up a horn and under his head" },
  { id: "w",  displayLetter: "w",  letterName: "double-you", phonicsSound: "wuh", rhyme: "Wiggly little worm", word: "worm",     emoji: "🪱", tracingPhrase: "Down, up, down, up" },
  { id: "z",  displayLetter: "z",  letterName: "zed",  phonicsSound: "zzzz",  rhyme: "Zigzag zebra",          word: "zebra",     emoji: "🦓", tracingPhrase: "Zig-zag-zig" },
  { id: "x",  displayLetter: "x",  letterName: "ex",   phonicsSound: "ks",    rhyme: "Six toys in a box",     word: "box",       emoji: "📦", tracingPhrase: "Down the arm and leg, repeat the other side" },
  { id: "sh", displayLetter: "sh", letterName: "es aitch", phonicsSound: "shhh", rhyme: "Shy sheep, shhh",    word: "sheep",     emoji: "🐑", tracingPhrase: "Slither down the snake, then down the head to the hooves and over his back" },
  { id: "ch", displayLetter: "ch", letterName: "see aitch", phonicsSound: "chuh", rhyme: "Chatty melting cheese", word: "cheese", emoji: "🧀", tracingPhrase: "Curl around the caterpillar, then down the head to the hooves and over his back" },
  { id: "th", displayLetter: "th", letterName: "tee aitch", phonicsSound: "th", rhyme: "Three little thumbs",  word: "thumb",     emoji: "👍", tracingPhrase: "Down the tower, across the tower, then down the head to the hooves and over his back" },
  { id: "ng", displayLetter: "ng", letterName: "en jee", phonicsSound: "ng",  rhyme: "Sing and ring",         word: "ring",      emoji: "💍", tracingPhrase: "Down Nobby and over his net, then around the girl's face, down her hair and give her a curl" },
  { id: "qu", displayLetter: "qu", letterName: "cue",  phonicsSound: "kwuh",  rhyme: "Quick little queen",    word: "queen",     emoji: "👑", tracingPhrase: "Round the queen's head, up to her crown, down her hair and flick" },
];

// "nk" is a final blend rather than an initial sound, so it is kept out of the
// "which sound starts this word" games (PickTheSound / SoundPictureMatch) but is
// still offered for tracing, where the spec lists a phrase for it.
export const NK_PHONEME: Phoneme = {
  id: "nk", displayLetter: "nk", letterName: "en kay", phonicsSound: "ngk",
  rhyme: "Pink ink in a tank", word: "pink", emoji: "🩷",
  tracingPhrase: "Down Nobby and over his net, then down the kangaroo's body, tail and leg",
};

// The set the tracing game offers: all phonemes plus the nk blend.
export const TRACE_PHONEMES: Phoneme[] = [...PHONEMES, NK_PHONEME];

export const PHONEME_BY_ID: Record<string, Phoneme> = Object.fromEntries(
  TRACE_PHONEMES.map(p => [p.id, p]),
);

// Simple consonant-vowel-consonant words built only from single-letter phonemes,
// each with a picture, for the "Build the Word" game (5-6 years).
export interface CvcWord {
  word: string;
  letters: string[];
  emoji: string;
}

export const CVC_WORDS: CvcWord[] = [
  { word: "cat", letters: ["c", "a", "t"], emoji: "🐱" },
  { word: "dog", letters: ["d", "o", "g"], emoji: "🐶" },
  { word: "pig", letters: ["p", "i", "g"], emoji: "🐷" },
  { word: "hat", letters: ["h", "a", "t"], emoji: "🎩" },
  { word: "sun", letters: ["s", "u", "n"], emoji: "☀️" },
  { word: "bus", letters: ["b", "u", "s"], emoji: "🚌" },
  { word: "bed", letters: ["b", "e", "d"], emoji: "🛏️" },
  { word: "net", letters: ["n", "e", "t"], emoji: "🥅" },
  { word: "fox", letters: ["f", "o", "x"], emoji: "🦊" },
  { word: "cup", letters: ["c", "u", "p"], emoji: "☕" },
  { word: "pen", letters: ["p", "e", "n"], emoji: "🖊️" },
  { word: "jam", letters: ["j", "a", "m"], emoji: "🍓" },
];
