import React, { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider, useAppContext } from "./context/AppContext";
import { SoundProvider } from "./context/SoundContext";
import { THEMES } from "./lib/themes";

import NotFound from "@/pages/not-found";
import Welcome from "@/pages/Welcome";
import Home from "@/pages/Home";
import Maths from "@/pages/Maths";
import Animals from "@/pages/Animals";
import Reading from "@/pages/Reading";
import Science from "@/pages/Science";
import ColoursShapes from "@/pages/ColoursShapes";
import MemoryHub from "@/pages/MemoryHub";
import Health from "@/pages/Health";
import Progress from "@/pages/Progress";
import GameReview from "@/pages/GameReview";
import Notes from "@/pages/Notes";
import Class from "@/pages/Class";
import DailyChallenge from "@/pages/DailyChallenge";
import TimedPlay from "@/pages/TimedPlay";
import Classroom from "@/pages/Classroom";
import EditProfile from "@/pages/EditProfile";
import Shop from "@/pages/Shop";
import PetRoom from "@/pages/PetRoom";
import PasscodeGate from "@/components/PasscodeGate";

import WhoLivesHere from "@/components/games/WhoLivesHere";
import DiceCounting from "@/components/games/DiceCounting";
import CountObjects from "@/components/games/CountObjects";
import MatchNumbers from "@/components/games/MatchNumbers";
import Addition from "@/components/games/Addition";
import WhichBigger from "@/components/games/WhichBigger";
import WhichSmaller from "@/components/games/WhichSmaller";
import MissingNumber from "@/components/games/MissingNumber";
import NumberTracing from "@/components/games/NumberTracing";
import MemoryCards from "@/components/games/MemoryCards";
import ColorMatch from "@/components/games/ColorMatch";
import Subtraction from "@/components/games/Subtraction";
import Multiplication from "@/components/games/Multiplication";
import TimedMaths from "@/components/games/TimedMaths";
import NumberBonds from "@/components/games/NumberBonds";
import WordProblems from "@/components/games/WordProblems";
import MoneyCount from "@/components/games/MoneyCount";
import NumberNinja from "@/components/games/NumberNinja";
import DiceFlash from "@/components/games/DiceFlash";
import GameErrorBoundary from "@/components/GameErrorBoundary";

import AnimalNames from "@/components/games/AnimalNames";
import BabyAdultMatch from "@/components/games/BabyAdultMatch";
import AnimalSounds from "@/components/games/AnimalSounds";
import OddOneOut from "@/components/games/OddOneOut";
import AnimalCounting from "@/components/games/AnimalCounting";
import AnimalHabitat from "@/components/games/AnimalHabitat";
import AnimalDiet from "@/components/games/AnimalDiet";

import AlphabetTap from "@/components/games/AlphabetTap";
import LetterFill from "@/components/games/LetterFill";
import MatchPictureWord from "@/components/games/MatchPictureWord";
import RhymingWords from "@/components/games/RhymingWords";
import FillInWord from "@/components/games/FillInWord";
import HappySad from "@/components/games/HappySad";
import MissingLetterWords from "@/components/games/MissingLetterWords";
import SpellingQuiz from "@/components/games/SpellingQuiz";
import WriteMyName from "@/components/games/WriteMyName";
import BuildTheWord from "@/components/games/BuildTheWord";

import WeatherMatch from "@/components/games/WeatherMatch";
import HotCold from "@/components/games/HotCold";
import SeasonsGame from "@/components/games/SeasonsGame";
import BodyParts from "@/components/games/BodyParts";
import SpaceFacts from "@/components/games/SpaceFacts";
import LifeCycles from "@/components/games/LifeCycles";
import BigOrSmall from "@/components/games/BigOrSmall";
import FoodSorting from "@/components/games/FoodSorting";
import SinkOrFloat from "@/components/games/SinkOrFloat";

import ShapeSorting from "@/components/games/ShapeSorting";

import ColourPatterns from "@/components/games/ColourPatterns";
import SequenceMemory from "@/components/games/SequenceMemory";
import AnimalMemory from "@/components/games/AnimalMemory";
import PickFruitVeg from "@/components/games/PickFruitVeg";
import DrinkChoices from "@/components/games/DrinkChoices";
import HealthyLunchbox from "@/components/games/HealthyLunchbox";
import FoodGroups from "@/components/games/FoodGroups";
import TimeTelling from "@/components/games/TimeTelling";

const queryClient = new QueryClient();

const WHO_LIVES_HERE_IMAGES = ["Farm.png", "Ocean.png", "Jungle.png", "Sky.png", "Bugs.png"];

function AppAssetPreloader() {
  useEffect(() => {
    const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");

    WHO_LIVES_HERE_IMAGES.forEach(file => {
      const img = new Image();
      img.src = `${base}who-lives-here/${file}`;
    });
  }, []);

  return null;
}

function ThemeApplier() {
  const { activeProfile } = useAppContext();
  useEffect(() => {
    const theme = THEMES[activeProfile?.theme ?? "default"] ?? THEMES.default;
    const root = document.documentElement;
    Object.values(THEMES).forEach(t => Object.keys(t.vars).forEach(k => root.style.removeProperty(k)));
    Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  }, [activeProfile?.theme]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/home" component={Home} />
      <Route path="/pet" component={PetRoom} />
      <Route path="/edit-profile/:id"><PasscodeGate><EditProfile /></PasscodeGate></Route>

      <Route path="/maths" component={Maths} />
      <Route path="/maths/dice" component={DiceCounting} />
      <Route path="/maths/count" component={CountObjects} />
      <Route path="/maths/match" component={MatchNumbers} />
      <Route path="/maths/addition" component={Addition} />
      <Route path="/maths/bigger" component={WhichBigger} />
      <Route path="/maths/smaller" component={WhichSmaller} />
      <Route path="/maths/missing" component={MissingNumber} />
      <Route path="/maths/tracing" component={NumberTracing} />
      <Route path="/maths/memory" component={MemoryCards} />
      <Route path="/maths/color" component={ColorMatch} />
      <Route path="/maths/subtraction" component={Subtraction} />
      <Route path="/maths/times" component={Multiplication} />
      <Route path="/maths/timed" component={TimedMaths} />
      <Route path="/maths/bonds" component={NumberBonds} />
      <Route path="/maths/wordproblems" component={WordProblems} />
      <Route path="/maths/money" component={MoneyCount} />
      <Route path="/maths/ninja" component={NumberNinja} />
      <Route path="/maths/diceflash" component={DiceFlash} />
      
      <Route path="/animals/who-lives-here" component={WhoLivesHere} />
      <Route path="/animals" component={Animals} />
      <Route path="/animals/names" component={AnimalNames} />
      <Route path="/animals/baby" component={BabyAdultMatch} />
      <Route path="/animals/sounds" component={AnimalSounds} />
      <Route path="/animals/odd" component={OddOneOut} />
      <Route path="/animals/counting" component={AnimalCounting} />
      <Route path="/animals/habitat" component={AnimalHabitat} />
      <Route path="/animals/diet" component={AnimalDiet} />

      <Route path="/reading" component={Reading} />
      <Route path="/reading/alphabet" component={AlphabetTap} />
      <Route path="/reading/letterfill" component={LetterFill} />
      <Route path="/reading/picture" component={MatchPictureWord} />
      <Route path="/reading/rhyming" component={RhymingWords} />
      <Route path="/reading/fillin" component={FillInWord} />
      <Route path="/reading/emotions" component={HappySad} />
      <Route path="/reading/missing" component={MissingLetterWords} />
      <Route path="/reading/spelling" component={SpellingQuiz} />
      <Route path="/reading/write-name" component={WriteMyName} />
      <Route path="/reading/phonics-build" component={BuildTheWord} />

      <Route path="/science" component={Science} />
      <Route path="/science/weather" component={WeatherMatch} />
      <Route path="/science/hotcold" component={HotCold} />
      <Route path="/science/seasons" component={SeasonsGame} />
      <Route path="/science/body" component={BodyParts} />
      <Route path="/science/space" component={SpaceFacts} />
      <Route path="/science/lifecycle" component={LifeCycles} />
      <Route path="/science/bigorsmall" component={BigOrSmall} />
      <Route path="/science/food" component={FoodSorting} />
      <Route path="/science/sinkorflat" component={SinkOrFloat} />

      <Route path="/colours" component={ColoursShapes} />
      <Route path="/colours/shapes" component={ShapeSorting} />
      <Route path="/colours/patterns" component={ColourPatterns} />

      <Route path="/memory-hub" component={MemoryHub} />
      <Route path="/memory/sequence" component={SequenceMemory} />
      <Route path="/memory/animal" component={AnimalMemory} />

      <Route path="/health" component={Health} />
      <Route path="/health/fruitveg" component={PickFruitVeg} />
      <Route path="/health/drinks" component={DrinkChoices} />
      <Route path="/health/lunchbox" component={HealthyLunchbox} />
      <Route path="/health/foodgroups" component={FoodGroups} />
      <Route path="/health/time" component={TimeTelling} />

      <Route path="/memory-hub" component={MemoryHub} />
      <Route path="/class"><PasscodeGate><Class /></PasscodeGate></Route>
      <Route path="/progress"><PasscodeGate><Progress /></PasscodeGate></Route>
      <Route path="/game-review/:id"><PasscodeGate><GameReview /></PasscodeGate></Route>
      <Route path="/notes"><PasscodeGate><Notes /></PasscodeGate></Route>
      <Route path="/daily" component={DailyChallenge} />
      <Route path="/timed-play" component={TimedPlay} />
      <Route path="/shop" component={Shop} />
      <Route path="/classroom"><PasscodeGate><Classroom /></PasscodeGate></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <SoundProvider>
          <TooltipProvider>
            <ThemeApplier />
            <AppAssetPreloader />
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <GameErrorBoundary>
                <Router />
              </GameErrorBoundary>
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </SoundProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
