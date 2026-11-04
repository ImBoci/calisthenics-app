import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'hu';

export interface Translations {
  // Bottom Navigation
  navWorkouts: string;
  navLeaderboard: string;
  navPBs: string;
  navCatalog: string;
  navProfile: string;

  // Exercise Sections
  sectionWarmup: string;
  sectionJointPrep: string;
  sectionStatic: string;
  sectionDynamic: string;
  sectionStretching: string;

  // Section Labels (for display)
  sectionLabelWarmup: string;
  sectionLabelJointPrep: string;
  sectionLabelStatic: string;
  sectionLabelDynamic: string;
  sectionLabelStretching: string;

  // Metrics & Filters
  metricReps: string;
  metricTime: string;
  metricTimeSeconds: string;
  assisted: string;
  bodyweight: string;
  filterAll: string;

  // Routines & Workouts
  newWorkoutRoutine: string;
  routineName: string;
  selectExercises: string;
  saveRoutine: string;
  cancel: string;
  markAsCompleted: string;
  workoutRoutines: string;
  noWorkoutPlans: string;
  buildCustomRoutine: string;
  newRoutine: string;
  groupedBySections: string;
  start: string;

  // Profile & Calendar
  activityCalendar: string;
  checkInToday: string;
  logWorkoutFor: string;
  removeWorkoutFor: string;
  edit: string;
  done: string;
  startingLevel: string;
  favoriteMove: string;
  logOut: string;
  profile: string;
  squadBrotherhood: string;
  memberSince: string;
  joined: string;

  // PBs
  personalBests: string;
  pbs: string;
  logPB: string;
  update: string;
  noRecordLogged: string;
  holdDuration: string;
  repsCompleted: string;
  assistedMovement: string;
  usingResistance: string;
  assistanceDetails: string;
  saveRecord: string;

  // Leaderboard
  leaderboard: string;
  allCompetitiveExercises: string;
  contestedMoves: string;
  setFirstRecord: string;
  records: string;
  record: string;

  // Catalog
  exerciseCatalog: string;
  add: string;
  suggest: string;
  searchMoves: string;
  catalogEmpty: string;
  noExercisesFoundMatching: string;
  addExercise: string;
  suggestExercise: string;
  exerciseName: string;
  routineSection: string;
  metricType: string;
  addToCatalog: string;
  sendProposal: string;
  viewFriendSuggestions: string;
  incomingSuggestions: string;
  allSuggestionsReviewed: string;
  approveAddToCatalog: string;
  dismiss: string;
  suggestionSent: string;

  // Auth
  signIn: string;
  createAccount: string;
  displayName: string;
  username: string;
  email: string;
  password: string;
  joinChalkTimber: string;
  adminPrivileges: string;
  pendingSuggestions: string;

  // Common
  loading: string;
  saving: string;
  sending: string;
  seconds: string;
  hold: string;
  sec: string;
  moves: string;
  exercises: string;

  // Filters (short labels)
  filterStatic: string;
  filterDynamic: string;
  reps: string;

  // Workouts extras
  allRoutines: string;
  progress: string;
  selectAtLeastOne: string;
  failedToSavePlan: string;
  noExercisesInCatalog: string;
  loadStarterMovesHint: string;
  loadStarterMoves: string;
  routineNamePlaceholder: string;
  workoutLogged: string;
  couldNotLogWorkout: string;
  routineDeleted: string;
  confirmDeleteRoutine: string;
  routineCreated: string;
  movesLoaded: string;
  buildFirstRoutineHint: string;
  sectionsLabel: string;

  // Catalog extras
  catalogEmptyAdminHint: string;
  catalogEmptyFriendHint: string;
  seedClassics: string;
  noteForSquad: string;
  from: string;
  close: string;
  exerciseNamePlaceholder: string;
  suggestNamePlaceholder: string;
  notePlaceholder: string;
  assistNotesPlaceholder: string;
  added: string;
  approved: string;
  suggestionDismissed: string;
  classicMovesSeeded: string;
  failedToAddExercise: string;
  failedToSendSuggestion: string;

  // PBs & Leaderboard extras
  searchPBs: string;
  searchScoreboard: string;
  noExercisesCatalogShort: string;
  noExercisesFound: string;
  noPBsHint: string;
  noSearchResults: string;
  noExercisesFoundHint: string;
  invalidNumber: string;
  couldNotSaveRecord: string;
  pbUpdated: string;
  you: string;
  squadMate: string;
  unknownExercise: string;

  // Auth extras
  authTagline: string;
  errEmailExists: string;
  errWeakPassword: string;
  errInvalidCreds: string;
  errRateLimit: string;
  errUnexpected: string;
  errEnterBoth: string;
  errUsernameChars: string;
  errSupabaseNotConfigured: string;

  // Month names
  months: string[];
  dayNames: string[];
  dayNamesShort: string[];
}

const translations: Record<Language, Translations> = {
  en: {
    // Bottom Navigation
    navWorkouts: 'Workouts',
    navLeaderboard: 'Board',
    navPBs: 'PBs',
    navCatalog: 'Catalog',
    navProfile: 'Profile',

    // Exercise Sections
    sectionWarmup: 'warmup',
    sectionJointPrep: 'joint_prep',
    sectionStatic: 'static',
    sectionDynamic: 'dynamic',
    sectionStretching: 'stretching',

    // Section Labels
    sectionLabelWarmup: 'Warmup',
    sectionLabelJointPrep: 'Joint Prep',
    sectionLabelStatic: 'Static',
    sectionLabelDynamic: 'Dynamic',
    sectionLabelStretching: 'Stretching',

    // Metrics & Filters
    metricReps: 'Repetitions',
    metricTime: 'Hold Time',
    metricTimeSeconds: 'Hold Duration (Seconds)',
    assisted: 'Assisted',
    bodyweight: 'Bodyweight',
    filterAll: 'All',

    // Routines & Workouts
    newWorkoutRoutine: 'New Workout Routine',
    routineName: 'Routine Name',
    selectExercises: 'Select Exercises',
    saveRoutine: 'Save Routine',
    cancel: 'Cancel',
    markAsCompleted: 'Mark as Completed',
    workoutRoutines: 'Workout Routines',
    noWorkoutPlans: 'No Workout Plans Yet',
    buildCustomRoutine: 'Build Custom Routine',
    newRoutine: 'New Routine',
    groupedBySections: 'Grouped by 5 sections',
    start: 'Start',

    // Profile & Calendar
    activityCalendar: 'Activity Calendar',
    checkInToday: "Check-in Today's Workout",
    logWorkoutFor: 'Log Workout for',
    removeWorkoutFor: 'Remove Workout for',
    edit: 'Edit',
    done: 'Done',
    startingLevel: 'Starting Level',
    favoriteMove: 'Favorite Move',
    logOut: 'Log Out',
    profile: 'Profile',
    squadBrotherhood: 'Squad Brotherhood',
    memberSince: 'Member Since',
    joined: 'Joined',

    // PBs
    personalBests: 'Personal Bests',
    pbs: 'PBs',
    logPB: 'Log PB',
    update: 'Update',
    noRecordLogged: 'No record logged yet',
    holdDuration: 'Hold Duration (Seconds)',
    repsCompleted: 'Reps Completed',
    assistedMovement: 'Assisted Movement',
    usingResistance: 'Using resistance band, chair, or partner',
    assistanceDetails: 'Assistance Details',
    saveRecord: 'Save Record',

    // Leaderboard
    leaderboard: 'Leaderboard',
    allCompetitiveExercises: 'All Competitive Exercises',
    contestedMoves: 'Uncontested Moves',
    setFirstRecord: 'Set 1st Record',
    records: 'records',
    record: 'record',

    // Catalog
    exerciseCatalog: 'Exercise Catalog',
    add: 'Add',
    suggest: 'Suggest',
    searchMoves: 'Search moves (e.g. Pull-ups, Handstand)...',
    catalogEmpty: 'Catalog is empty',
    noExercisesFoundMatching: 'No exercises found matching',
    addExercise: 'Add Exercise',
    suggestExercise: 'Suggest Exercise',
    exerciseName: 'Exercise Name',
    routineSection: 'Routine Section',
    metricType: 'Metric Type',
    addToCatalog: 'Add to Catalog',
    sendProposal: 'Send Proposal',
    viewFriendSuggestions: 'View Friend Suggestions',
    incomingSuggestions: 'Incoming Suggestions',
    allSuggestionsReviewed: 'All suggestions have been reviewed!',
    approveAddToCatalog: 'Approve & Add to Catalog',
    dismiss: 'Dismiss',
    suggestionSent: 'Suggestion sent to admin!',

    // Auth
    signIn: 'Sign In',
    createAccount: 'Create Account',
    displayName: 'Display Name',
    username: 'Username',
    email: 'Email',
    password: 'Password',
    joinChalkTimber: 'Join Chalk & Timber',
    adminPrivileges: 'Admin privileges active',
    pendingSuggestions: 'pending suggestion',

    // Common
    loading: 'Loading...',
    saving: 'Saving...',
    sending: 'Sending...',
    seconds: 'Seconds',
    hold: 'Hold',
    sec: 'sec',
    moves: 'moves',
    exercises: 'exercises',

    // Filters (short labels)
    filterStatic: 'Static',
    filterDynamic: 'Dynamic',
    reps: 'Reps',

    // Workouts extras
    allRoutines: 'All Routines',
    progress: 'Progress',
    selectAtLeastOne: 'Please select at least 1 exercise for your routine',
    failedToSavePlan: 'Failed to save workout plan',
    noExercisesInCatalog: 'No exercises in catalog yet',
    loadStarterMovesHint: 'Load starter calisthenics moves now or add custom ones in the Catalog tab.',
    loadStarterMoves: 'Load Starter Calisthenics Moves',
    routineNamePlaceholder: 'e.g. Monday Pull & Handstand',
    workoutLogged: 'Workout logged! 💪',
    couldNotLogWorkout: 'Could not log workout',
    routineDeleted: 'Routine deleted',
    confirmDeleteRoutine: 'Are you sure you want to delete this routine?',
    routineCreated: 'Routine created',
    movesLoaded: 'moves loaded into catalog!',
    buildFirstRoutineHint: 'Build your first routine organized into Warmup, Joint Prep, Static, Dynamic, and Stretching!',
    sectionsLabel: 'sections',

    // Catalog extras
    catalogEmptyAdminHint: 'Add your first exercise or seed classic calisthenics progressions with 1 click.',
    catalogEmptyFriendHint: 'Propose an exercise to the squad admin to get it added to the catalog.',
    seedClassics: 'Seed 17 Classic Calisthenics Exercises',
    noteForSquad: 'Note for Squad (Optional)',
    from: 'From',
    close: 'Close',
    exerciseNamePlaceholder: 'e.g. Muscle-up, Front Lever',
    suggestNamePlaceholder: 'e.g. Ring Dips, Archer Push-up',
    notePlaceholder: 'e.g. Great progression for muscle-ups',
    assistNotesPlaceholder: 'e.g. Heavy black band, Light red band',
    added: 'Added',
    approved: 'Approved',
    suggestionDismissed: 'Suggestion dismissed',
    classicMovesSeeded: 'Classic calisthenics moves added!',
    failedToAddExercise: 'Failed to add exercise',
    failedToSendSuggestion: 'Failed to send suggestion',

    // PBs & Leaderboard extras
    searchPBs: 'Filter moves for PB tracking...',
    searchScoreboard: 'Search moves on scoreboard...',
    noExercisesCatalogShort: 'No exercises in catalog',
    noExercisesFound: 'No exercises found',
    noPBsHint: 'Visit the Catalog tab to add or seed calisthenics moves first.',
    noSearchResults: 'No exercises found matching your search.',
    noExercisesFoundHint: 'Add or seed exercises in the Catalog tab to start tracking squad rankings!',
    invalidNumber: 'Please enter a valid positive number',
    couldNotSaveRecord: 'Could not save record',
    pbUpdated: 'Personal Best updated',
    you: 'You',
    squadMate: 'Squad Mate',
    unknownExercise: 'Unknown Exercise',

    // Auth extras
    authTagline: 'Squad Calisthenics & Progression',
    errEmailExists: 'An account with this email already exists. Try signing in instead!',
    errWeakPassword: 'Password must be at least 6 characters long.',
    errInvalidCreds: 'Incorrect email or password. Please double-check your credentials.',
    errRateLimit: 'Too many login attempts. Please wait a moment and try again.',
    errUnexpected: 'An unexpected error occurred. Please try again.',
    errEnterBoth: 'Please enter both a display name and a username.',
    errUsernameChars: 'Username can only contain letters, numbers, and underscores.',
    errSupabaseNotConfigured: 'Supabase is not configured yet. Please check your credentials in .env.',

    // Month names
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    dayNames: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    dayNamesShort: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  },
  hu: {
    // Bottom Navigation
    navWorkouts: 'Edzések',
    navLeaderboard: 'Ranglista',
    navPBs: 'Rekordok',
    navCatalog: 'Gyakorlatok',
    navProfile: 'Profil',

    // Exercise Sections
    sectionWarmup: 'warmup',
    sectionJointPrep: 'joint_prep',
    sectionStatic: 'static',
    sectionDynamic: 'dynamic',
    sectionStretching: 'stretching',

    // Section Labels
    sectionLabelWarmup: 'Bemelegítés',
    sectionLabelJointPrep: 'Ízületelőkészítés',
    sectionLabelStatic: 'Statikus gyakorlatok',
    sectionLabelDynamic: 'Dinamikus gyakorlatok',
    sectionLabelStretching: 'Nyújtás',

    // Metrics & Filters
    metricReps: 'Ismétlés',
    metricTime: 'Időtartam',
    metricTimeSeconds: 'Időtartam (mp)',
    assisted: 'Könnyített',
    bodyweight: 'Saját testsúly',
    filterAll: 'Összes',

    // Routines & Workouts
    newWorkoutRoutine: 'Új edzésterv',
    routineName: 'Edzésterv neve',
    selectExercises: 'Gyakorlatok kiválasztása',
    saveRoutine: 'Edzésterv mentése',
    cancel: 'Mégse',
    markAsCompleted: 'Edzés befejezése',
    workoutRoutines: 'Edzéstervek',
    noWorkoutPlans: 'Még nincs edzésterv',
    buildCustomRoutine: 'Egyedi edzésterv építése',
    newRoutine: 'Új edzésterv',
    groupedBySections: '5 szekcióra csoportosítva',
    start: 'Indítás',

    // Profile & Calendar
    activityCalendar: 'Aktivitási naptár',
    checkInToday: 'Mai edzés naplózása',
    logWorkoutFor: 'Edzés naplózása:',
    removeWorkoutFor: 'Edzés törlése:',
    edit: 'Szerkesztés',
    done: 'Kész',
    startingLevel: 'Kezdő szint',
    favoriteMove: 'Kedvenc gyakorlat',
    logOut: 'Kijelentkezés',
    profile: 'Profil',
    squadBrotherhood: 'Csapattestvériség',
    memberSince: 'Tag',
    joined: 'Csatlakozott',

    // PBs
    personalBests: 'Személyes rekordok',
    pbs: 'Rekordok',
    logPB: 'Rekord naplózása',
    update: 'Frissítés',
    noRecordLogged: 'Még nincs rekord naplózva',
    holdDuration: 'Időtartam (mp)',
    repsCompleted: 'Ismétlések száma',
    assistedMovement: 'Könnyített gyakorlat',
    usingResistance: 'Ellenállási szalag, szék vagy partner használata',
    assistanceDetails: 'Könnyítés részletei',
    saveRecord: 'Rekord mentése',

    // Leaderboard
    leaderboard: 'Ranglista',
    allCompetitiveExercises: 'Összes versenygyakorlat',
    contestedMoves: 'Versenyzetlen gyakorlatok',
    setFirstRecord: 'Első rekord beállítása',
    records: 'rekord',
    record: 'rekord',

    // Catalog
    exerciseCatalog: 'Gyakorlatkatalógus',
    add: 'Hozzáadás',
    suggest: 'Javaslat',
    searchMoves: 'Gyakorlatok keresése (pl. húzódzkodás, kézenállás)...',
    catalogEmpty: 'A katalógus üres',
    noExercisesFoundMatching: 'Nincs találat:',
    addExercise: 'Gyakorlat hozzáadása',
    suggestExercise: 'Gyakorlat javaslata',
    exerciseName: 'Gyakorlat neve',
    routineSection: 'Szekció',
    metricType: 'Mértékegység',
    addToCatalog: 'Hozzáadás a katalógushoz',
    sendProposal: 'Javaslat küldése',
    viewFriendSuggestions: 'Javaslatok megtekintése',
    incomingSuggestions: 'Beérkező javaslatok',
    allSuggestionsReviewed: 'Minden javaslat áttekintve!',
    approveAddToCatalog: 'Jóváhagyás és hozzáadás',
    dismiss: 'Elutasítás',
    suggestionSent: 'Javaslat elküldve az adminnak!',

    // Auth
    signIn: 'Bejelentkezés',
    createAccount: 'Fiók létrehozása',
    displayName: 'Megjelenített név',
    username: 'Felhasználónév',
    email: 'E-mail',
    password: 'Jelszó',
    joinChalkTimber: 'Csatlakozás a Chalk & Timber-hez',
    adminPrivileges: 'Admin jogosultság aktív',
    pendingSuggestions: 'függő javaslat',

    // Common
    loading: 'Betöltés...',
    saving: 'Mentés...',
    sending: 'Küldés...',
    seconds: 'másodperc',
    hold: 'Kitartás',
    sec: 'mp',
    moves: 'gyakorlat',
    exercises: 'gyakorlat',

    // Filters (short labels)
    filterStatic: 'Statikus',
    filterDynamic: 'Dinamikus',
    reps: 'Ism.',

    // Workouts extras
    allRoutines: 'Összes edzésterv',
    progress: 'Haladás',
    selectAtLeastOne: 'Válassz ki legalább 1 gyakorlatot az edzéstervedhez',
    failedToSavePlan: 'Nem sikerült menteni az edzéstervet',
    noExercisesInCatalog: 'Még nincs gyakorlat a katalógusban',
    loadStarterMovesHint: 'Tölts be kezdő kalisténiás gyakorlatokat, vagy adj hozzá egyedieket a Gyakorlatok fülön.',
    loadStarterMoves: 'Kezdő kalisténiás gyakorlatok betöltése',
    routineNamePlaceholder: 'pl. Hétfői húzás és kézenállás',
    workoutLogged: 'Edzés naplózva! 💪',
    couldNotLogWorkout: 'Nem sikerült naplózni az edzést',
    routineDeleted: 'Edzésterv törölve',
    confirmDeleteRoutine: 'Biztosan törlöd ezt az edzéstervet?',
    routineCreated: 'Edzésterv létrehozva',
    movesLoaded: 'gyakorlat betöltve a katalógusba!',
    buildFirstRoutineHint: 'Építsd meg az első edzéstervedet Bemelegítés, Ízületelőkészítés, Statikus, Dinamikus és Nyújtás szekciókra bontva!',
    sectionsLabel: 'szekció',

    // Catalog extras
    catalogEmptyAdminHint: 'Add hozzá az első gyakorlatot, vagy tölts be klasszikus kalisténiás progressziókat 1 kattintással.',
    catalogEmptyFriendHint: 'Javasolj gyakorlatot az adminnak, hogy bekerüljön a katalógusba.',
    seedClassics: '17 klasszikus kalisténiás gyakorlat betöltése',
    noteForSquad: 'Megjegyzés a csapatnak (opcionális)',
    from: 'Feladó',
    close: 'Bezárás',
    exerciseNamePlaceholder: 'pl. Muscle-up, Front Lever',
    suggestNamePlaceholder: 'pl. Gyűrűn tolódzkodás, Archer fekvőtámasz',
    notePlaceholder: 'pl. Remek progresszió a muscle-up-hoz',
    assistNotesPlaceholder: 'pl. Nehéz fekete szalag, könnyű piros szalag',
    added: 'Hozzáadva',
    approved: 'Jóváhagyva',
    suggestionDismissed: 'Javaslat elutasítva',
    classicMovesSeeded: 'Klasszikus kalisténiás gyakorlatok hozzáadva!',
    failedToAddExercise: 'Nem sikerült hozzáadni a gyakorlatot',
    failedToSendSuggestion: 'Nem sikerült elküldeni a javaslatot',

    // PBs & Leaderboard extras
    searchPBs: 'Gyakorlatok szűrése rekordkövetéshez...',
    searchScoreboard: 'Gyakorlatok keresése a ranglistán...',
    noExercisesCatalogShort: 'Nincs gyakorlat a katalógusban',
    noExercisesFound: 'Nincs gyakorlat',
    noPBsHint: 'Először add hozzá vagy tölts be gyakorlatokat a Gyakorlatok fülön.',
    noSearchResults: 'Nincs a keresésnek megfelelő gyakorlat.',
    noExercisesFoundHint: 'Adj hozzá vagy tölts be gyakorlatokat a Gyakorlatok fülön a ranglista követéséhez!',
    invalidNumber: 'Adj meg egy érvényes pozitív számot',
    couldNotSaveRecord: 'Nem sikerült menteni a rekordot',
    pbUpdated: 'Személyes rekord frissítve',
    you: 'Te',
    squadMate: 'Csapattárs',
    unknownExercise: 'Ismeretlen gyakorlat',

    // Auth extras
    authTagline: 'Csapat kalisténia és fejlődés',
    errEmailExists: 'Már létezik fiók ezzel az e-mail-címmel. Próbálj inkább bejelentkezni!',
    errWeakPassword: 'A jelszónak legalább 6 karakter hosszúnak kell lennie.',
    errInvalidCreds: 'Hibás e-mail vagy jelszó. Kérlek ellenőrizd az adataidat.',
    errRateLimit: 'Túl sok bejelentkezési kísérlet. Kérlek várj egy kicsit, és próbáld újra.',
    errUnexpected: 'Váratlan hiba történt. Kérlek próbáld újra.',
    errEnterBoth: 'Kérlek add meg a megjelenített nevet és a felhasználónevet is.',
    errUsernameChars: 'A felhasználónév csak betűket, számokat és aláhúzást tartalmazhat.',
    errSupabaseNotConfigured: 'A Supabase még nincs beállítva. Ellenőrizd az adataidat a .env fájlban.',

    // Month names
    months: ['Január', 'Február', 'Március', 'Április', 'Május', 'Június', 'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'],
    dayNames: ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'],
    dayNamesShort: ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'],
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'chalk_timber_lang';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Try to get from localStorage, otherwise default to 'hu'
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'hu') {
      return stored;
    }
    return 'hu'; // Default to Hungarian
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

/** Resolves a localized display label for a routine/exercise section key. */
export const getSectionLabel = (t: Translations, section: string): string => {
  switch (section) {
    case 'warmup':
      return t.sectionLabelWarmup;
    case 'joint_prep':
      return t.sectionLabelJointPrep;
    case 'static':
      return t.sectionLabelStatic;
    case 'dynamic':
      return t.sectionLabelDynamic;
    case 'stretching':
      return t.sectionLabelStretching;
    default:
      return section;
  }
};
