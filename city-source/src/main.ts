import './style.css'
import * as THREE from 'three'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) throw new Error('#app not found')

/* =========================================================
   DREAM KEEP DREAMIN'
   RELEASE CANDIDATE
   ========================================================= */

type PlaceId =
  | 'NOW'
  | 'FERRIS WHEEL'
  | 'THE BENCH'
  | 'LOST & FOUND'
  | 'CINEMA'
  | 'THE HOTEL'
  | 'STATION'
  | 'CLOSED'
  | 'EXIT'

type Mode =
  | 'walk'
  | 'bench'
  | 'ferris'
  | 'now'
  | 'cinema'
  | 'hotel'
  | 'station'
  | 'yesterday'
  | 'exit'

type MemoryState = {
  firstVisit: string
  lastVisit: string
  visitCount: number

  placesSeen: string[]
  placesMissed: string[]

  benchSeconds: number
  benchVisits: number

  foundItems: string[]
  droppedItems: string[]

  ferrisRides: number
  ferrisCabins: number[]

  nowRides: number
  nowRideRecords: Array<{
    visit: number
    date: string
  }>

  cinemaSeen: number
  cinemaMissed: number

  hotelRoom: number
  hotelLight: boolean
  hotelCurtain: boolean
  hotelTV: boolean

  stationTrips: number
  yesterdayTrips: number

  sentencesSeen: string[]
  sentencesMissed: string[]

  entryTimes: string[]
  exitTimes: string[]

  parkClockOffset: number
}

const ALL_PLACES: PlaceId[] = [
  'NOW',
  'FERRIS WHEEL',
  'THE BENCH',
  'LOST & FOUND',
  'CINEMA',
  'THE HOTEL',
  'STATION',
  'CLOSED',
  'EXIT',
]

const MEMORY_KEY = 'dream-keep-dreamin-memory-rc1'

function defaultMemory(): MemoryState {
  return {
    firstVisit: new Date().toISOString(),
    lastVisit: new Date().toISOString(),
    visitCount: 0,

    placesSeen: [],
    placesMissed: [],

    benchSeconds: 0,
    benchVisits: 0,

    foundItems: [],
    droppedItems: [],

    ferrisRides: 0,
    ferrisCabins: [],

    nowRides: 0,
    nowRideRecords: [],

    cinemaSeen: 0,
    cinemaMissed: 0,

    hotelRoom: 317,
    hotelLight: false,
    hotelCurtain: false,
    hotelTV: false,

    stationTrips: 0,
    yesterdayTrips: 0,

    sentencesSeen: [],
    sentencesMissed: [],

    entryTimes: [],
    exitTimes: [],

    parkClockOffset: 0,
  }
}

function loadMemory(): MemoryState {
  const fallback = defaultMemory()

  try {
    const raw = localStorage.getItem(MEMORY_KEY)
    if (!raw) return fallback

    const parsed = JSON.parse(raw) as Partial<MemoryState>

    return {
      ...fallback,
      ...parsed,
      placesSeen: parsed.placesSeen ?? [],
      placesMissed: parsed.placesMissed ?? [],
      foundItems: parsed.foundItems ?? [],
      droppedItems: parsed.droppedItems ?? [],
      ferrisCabins: parsed.ferrisCabins ?? [],
      nowRideRecords: parsed.nowRideRecords ?? [],
      sentencesSeen: parsed.sentencesSeen ?? [],
      sentencesMissed: parsed.sentencesMissed ?? [],
      entryTimes: parsed.entryTimes ?? [],
      exitTimes: parsed.exitTimes ?? [],
    }
  } catch {
    return fallback
  }
}

const memory = loadMemory()
memory.visitCount += 1
memory.lastVisit = new Date().toISOString()
memory.entryTimes.push(new Date().toISOString())

if (memory.parkClockOffset === 0) {
  memory.parkClockOffset = Math.floor(Math.random() * 19) - 9
}

function saveMemory() {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(memory))
}

saveMemory()

/* =========================================================
   MOBILE
   ========================================================= */

const mobileUserAgent =
  /Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )

const isMobile =
  navigator.maxTouchPoints > 0 ||
  matchMedia('(pointer: coarse)').matches ||
  matchMedia('(any-pointer: coarse)').matches ||
  matchMedia('(hover: none)').matches ||
  mobileUserAgent ||
  Math.min(innerWidth, innerHeight) <= 820

/* =========================================================
   UI
   ========================================================= */

app.innerHTML = `
  <div id="world"></div>

  <div id="arrival">
    <div class="arrival-inner">
      <div class="tiny">STILLOPERABLE PRESENTS</div>

      <h1>DREAM<br>KEEP DREAMIN'</h1>

      <div class="arrival-rule">
        <span>NIGHT ADMISSION</span>
        <strong id="arrival-line"></strong>
      </div>

      <button id="admit">
        <strong id="admit-main"></strong>
        <span>ENTER THE PARK</span>
      </button>

      <div id="desktop-entry">
        <span><b>W A S D</b> WALK</span>
        <span><b>MOUSE</b> LOOK</span>
        <span><b>SHIFT</b> RUN</span>
        <span><b>E</b> USE</span>
      </div>

      <div id="mobile-entry" class="hidden">
        <strong>CHOOSE WHERE TO GO.</strong>
        <span>THE PARK WILL TAKE YOU THERE.</span>
      </div>
    </div>
  </div>

  <div id="park-id" class="hidden">
    <span>DREAM KEEP DREAMIN'</span>
    <strong id="park-clock">23:51:00</strong>
  </div>

  <div id="guide" class="hidden">
    <div class="guide-top">
      <span>PARK GUIDE</span>
      <span id="guide-state">OPEN</span>
    </div>
    <div class="guide-main">
      <b id="guide-arrow">↑</b>
      <div>
        <strong id="guide-name">NOW</strong>
        <span id="guide-distance">—</span>
      </div>
    </div>
    <small id="guide-help">G / DESTINATION</small>
  </div>

  <div id="reticle" class="hidden"></div>

  <div id="interaction" class="hidden">
    <b id="interaction-key">E</b>
    <div>
      <strong id="interaction-name"></strong>
      <span id="interaction-action"></span>
    </div>
  </div>

  <div id="message" class="hidden">
    <span id="message-kicker"></span>
    <strong id="message-text"></strong>
  </div>

  <div id="mobile-ui" class="hidden">
    <button id="where-button">
      <span>PARK GUIDE</span>
      <strong>WHERE TO?</strong>
    </button>
    <button id="mobile-use">USE</button>
  </div>

  <div id="destination-sheet" class="hidden">
    <div class="sheet">
      <div class="sheet-head">
        <div>
          <span>PARK GUIDE</span>
          <strong>WHERE TO?</strong>
        </div>
        <button id="sheet-close">×</button>
      </div>
      <div id="destination-list"></div>
      <div class="sheet-foot">YOU WILL WALK THERE.</div>
    </div>
  </div>

  <div id="bench-ui" class="mode-ui hidden">
    <span>THE BENCH</span>
    <strong id="bench-time">00:00</strong>
    <small id="bench-note">PLEASE REMAIN SEATED</small>
  </div>

  <div id="ferris-ui" class="mode-ui hidden">
    <span>FERRIS WHEEL / CABIN <b id="cabin-number">07</b></span>
    <strong id="ferris-height">0m</strong>
    <small id="ferris-sub"></small>
  </div>

  <div id="now-ui" class="mode-ui hidden">
    <span>NOW</span>
    <strong id="now-speed">0 km/h</strong>
    <small id="now-sub">RESTRAINT LOCKED</small>
  </div>

  <div id="now-flash" class="hidden">NOW</div>

  <div id="cinema-ui" class="full-panel hidden">
    <div class="cinema-room">
      <div class="cinema-label">CINEMA 01</div>
      <div id="cinema-screen">
        <span id="film-kicker">TONIGHT</span>
        <strong id="film-title">BEFORE</strong>
        <small id="film-copy"></small>
      </div>
      <button id="cinema-leave">LEAVE CINEMA</button>
    </div>
  </div>

  <div id="hotel-ui" class="full-panel hidden">
    <div class="hotel-panel">
      <span>THE HOTEL</span>
      <h2>ROOM <b id="room-number">317</b></h2>
      <p id="hotel-record"></p>
      <div class="hotel-actions">
        <button id="hotel-light">LIGHT</button>
        <button id="hotel-curtain">CURTAIN</button>
        <button id="hotel-tv">TELEVISION</button>
      </div>
      <div id="hotel-tv-screen" class="hidden"></div>
      <button id="hotel-leave">LEAVE ROOM</button>
    </div>
  </div>

  <div id="station-ui" class="full-panel hidden">
    <div class="station-panel">
      <span>STATION</span>
      <h2>DEPARTURES</h2>
      <div class="departures">
        <button data-train="HOME">
          <b id="home-time">23:41</b>
          <strong>HOME</strong>
        </button>
        <button data-train="YESTERDAY">
          <b id="yesterday-time">23:58</b>
          <strong>YESTERDAY</strong>
        </button>
        <button data-train="UNKNOWN">
          <b>--:--</b>
          <strong>—</strong>
        </button>
      </div>
      <button id="station-leave">LEAVE PLATFORM</button>
    </div>
  </div>

  <div id="yesterday-ui" class="hidden">
    <span>YESTERDAY</span>
    <strong id="yesterday-record"></strong>
  </div>

  <div id="exit-ui" class="full-panel hidden">
    <div class="exit-panel">
      <span>DREAM KEEP DREAMIN'</span>
      <h2>YOU WERE HERE.</h2>

      <div class="exit-stats">
        <div><span>VISIT</span><strong id="stat-visit">01</strong></div>
        <div><span>SAW</span><strong id="stat-saw">00</strong></div>
        <div><span>MISSED</span><strong id="stat-missed">00</strong></div>
        <div><span>TOOK</span><strong id="stat-took">00</strong></div>
        <div><span>LEFT</span><strong id="stat-left">00</strong></div>
        <div><span>TIME INSIDE</span><strong id="stat-time">00:00</strong></div>
      </div>

      <p>THE PARK WAS ALSO HERE.</p>

      <button id="return-park">RETURN TO THE PARK</button>
    </div>
  </div>
`

const style = document.createElement('style')

style.textContent = `
  :root {
    color-scheme: dark;
  }

  * {
    box-sizing: border-box;
  }

  html,
  body,
  #app {
    margin: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #020509;
    font-family: Arial, Helvetica, sans-serif;
  }

  button {
    font: inherit;
  }

  .hidden {
    display: none !important;
  }

  #world {
    position: fixed;
    inset: 0;
    background: #020509;
  }

  #world canvas {
    display: block;
    width: 100%;
    height: 100%;
    touch-action: none;
  }

  #arrival {
    position: fixed;
    inset: 0;
    z-index: 2000;
    display: grid;
    place-items: center;
    color: #eef0eb;
    background:
      radial-gradient(circle at 50% 60%, rgba(45,62,68,.23), transparent 38%),
      linear-gradient(180deg, rgba(2,5,9,.7), rgba(1,3,5,.97));
    transition: opacity 900ms ease;
  }

  #arrival.leaving {
    opacity: 0;
    pointer-events: none;
  }

  .arrival-inner {
    width: min(820px, calc(100vw - 38px));
    text-align: center;
  }

  .tiny,
  .arrival-rule span {
    font-size: 8px;
    letter-spacing: .28em;
    color: rgba(238,241,236,.45);
  }

  .arrival-inner h1 {
    margin: 23px 0 29px;
    font-size: clamp(50px, 9vw, 112px);
    font-weight: 500;
    line-height: .82;
    letter-spacing: -.07em;
  }

  .arrival-rule {
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  .arrival-rule strong {
    font-size: 10px;
    font-weight: 500;
    letter-spacing: .13em;
  }

  #admit {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 230px;
    margin: 42px auto 0;
    padding: 17px 30px;
    border: 1px solid rgba(238,242,237,.55);
    border-radius: 0;
    color: #eef0eb;
    background: rgba(3,8,10,.45);
  }

  #admit strong {
    font-size: 12px;
    letter-spacing: .22em;
  }

  #admit span {
    font-size: 7px;
    letter-spacing: .2em;
    opacity: .45;
  }

  #desktop-entry {
    display: flex;
    justify-content: center;
    gap: 25px;
    margin-top: 37px;
  }

  #desktop-entry span {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 7px;
    letter-spacing: .15em;
    color: rgba(236,240,235,.4);
  }

  #desktop-entry b {
    color: rgba(240,243,238,.75);
  }

  #mobile-entry {
    margin-top: 34px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  #mobile-entry strong {
    font-size: 10px;
    letter-spacing: .17em;
  }

  #mobile-entry span {
    font-size: 8px;
    letter-spacing: .14em;
    opacity: .45;
  }

  #park-id {
    position: fixed;
    left: 20px;
    bottom: 18px;
    z-index: 300;
    display: flex;
    flex-direction: column;
    gap: 6px;
    color: rgba(235,239,234,.42);
    pointer-events: none;
  }

  #park-id span {
    font-size: 7px;
    letter-spacing: .18em;
  }

  #park-id strong {
    font-size: 9px;
    font-weight: 500;
    letter-spacing: .14em;
  }

  #guide {
    position: fixed;
    top: 18px;
    left: 50%;
    z-index: 500;
    width: 215px;
    padding: 12px 14px;
    transform: translateX(-50%);
    border: 1px solid rgba(235,240,235,.18);
    color: #edf0eb;
    background: rgba(3,8,11,.66);
    backdrop-filter: blur(9px);
    pointer-events: none;
  }

  .guide-top {
    display: flex;
    justify-content: space-between;
    padding-bottom: 9px;
    border-bottom: 1px solid rgba(235,240,235,.1);
    font-size: 7px;
    letter-spacing: .17em;
    color: rgba(235,240,235,.42);
  }

  .guide-main {
    display: flex;
    align-items: center;
    gap: 13px;
    padding: 11px 0;
  }

  #guide-arrow {
    width: 30px;
    font-size: 27px;
    font-weight: 300;
    text-align: center;
  }

  .guide-main div {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  #guide-name {
    font-size: 10px;
    letter-spacing: .14em;
  }

  #guide-distance {
    font-size: 8px;
    font-weight: 500;
    letter-spacing: .12em;
    color: rgba(235,240,235,.48);
  }

  #guide-help {
    display: block;
    padding-top: 8px;
    border-top: 1px solid rgba(235,240,235,.1);
    font-size: 7px;
    letter-spacing: .14em;
    color: rgba(235,240,235,.36);
  }

  #reticle {
    position: fixed;
    left: 50%;
    top: 50%;
    z-index: 300;
    width: 5px;
    height: 5px;
    transform: translate(-50%, -50%);
    border: 1px solid rgba(240,243,238,.5);
    border-radius: 50%;
    pointer-events: none;
  }

  #interaction {
    position: fixed;
    left: 50%;
    bottom: 8vh;
    z-index: 650;
    display: flex;
    align-items: center;
    gap: 12px;
    transform: translateX(-50%);
    padding: 11px 15px;
    border: 1px solid rgba(235,240,235,.24);
    color: #eef0eb;
    background: rgba(3,7,9,.76);
    backdrop-filter: blur(8px);
    pointer-events: none;
  }

  #interaction-key {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border: 1px solid rgba(235,240,235,.55);
    font-size: 11px;
  }

  #interaction div {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  #interaction-name {
    font-size: 10px;
    letter-spacing: .14em;
  }

  #interaction-action {
    font-size: 7px;
    letter-spacing: .17em;
    color: rgba(235,240,235,.48);
  }

  #message {
    position: fixed;
    left: 50%;
    top: 18vh;
    z-index: 900;
    width: min(620px, calc(100vw - 38px));
    transform: translateX(-50%);
    padding: 17px 22px;
    border-top: 1px solid rgba(235,240,235,.2);
    border-bottom: 1px solid rgba(235,240,235,.2);
    color: #edf0eb;
    background: rgba(2,6,8,.78);
    text-align: center;
    backdrop-filter: blur(10px);
    pointer-events: none;
  }

  #message span {
    display: block;
    margin-bottom: 8px;
    font-size: 7px;
    letter-spacing: .22em;
    color: rgba(235,240,235,.43);
  }

  #message strong {
    font-size: 11px;
    font-weight: 500;
    line-height: 1.6;
    letter-spacing: .11em;
  }

  #mobile-ui {
    position: fixed;
    inset: 0;
    z-index: 750;
    pointer-events: none;
  }

  #where-button {
    position: absolute;
    left: 17px;
    bottom: calc(20px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
    min-width: 132px;
    padding: 13px 15px;
    border: 1px solid rgba(235,240,235,.25);
    border-radius: 0;
    color: #edf0eb;
    background: rgba(3,8,10,.75);
    pointer-events: auto;
  }

  #where-button span {
    font-size: 7px;
    letter-spacing: .18em;
    opacity: .45;
  }

  #where-button strong {
    font-size: 10px;
    letter-spacing: .14em;
  }

  #mobile-use {
    position: absolute;
    right: 19px;
    bottom: calc(18px + env(safe-area-inset-bottom));
    width: 76px;
    height: 76px;
    border: 1px solid rgba(235,240,235,.14);
    border-radius: 50%;
    color: rgba(235,240,235,.25);
    background: rgba(3,8,10,.48);
    font-size: 9px;
    letter-spacing: .12em;
    pointer-events: none;
  }

  #mobile-use.active {
    color: #edf0eb;
    border-color: rgba(235,240,235,.7);
    background: rgba(5,12,14,.82);
    pointer-events: auto;
  }

  #destination-sheet {
    position: fixed;
    inset: 0;
    z-index: 1500;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 18px 18px calc(18px + env(safe-area-inset-bottom));
    background: rgba(1,4,6,.6);
    backdrop-filter: blur(8px);
  }

  .sheet {
    width: min(520px, 100%);
    border: 1px solid rgba(235,240,235,.2);
    color: #edf0eb;
    background: rgba(4,9,12,.97);
  }

  .sheet-head {
    display: flex;
    justify-content: space-between;
    padding: 18px;
    border-bottom: 1px solid rgba(235,240,235,.12);
  }

  .sheet-head div {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .sheet-head span,
  .sheet-foot {
    font-size: 7px;
    letter-spacing: .2em;
    color: rgba(235,240,235,.42);
  }

  .sheet-head strong {
    font-size: 18px;
    letter-spacing: .08em;
  }

  #sheet-close {
    width: 34px;
    height: 34px;
    border: 1px solid rgba(235,240,235,.16);
    color: #edf0eb;
    background: transparent;
    font-size: 22px;
  }

  #destination-list {
    max-height: 58vh;
    overflow: auto;
  }

  .destination {
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: 17px 18px;
    border: 0;
    border-bottom: 1px solid rgba(235,240,235,.09);
    color: #edf0eb;
    background: transparent;
    text-align: left;
  }

  .destination:active {
    background: rgba(235,240,235,.09);
  }

  .destination strong {
    font-size: 10px;
    letter-spacing: .13em;
  }

  .destination span {
    font-size: 7px;
    letter-spacing: .15em;
    opacity: .4;
  }

  .destination.locked {
    opacity: .28;
  }

  .sheet-foot {
    padding: 14px 18px;
  }

  .mode-ui {
    position: fixed;
    left: 50%;
    bottom: 8vh;
    z-index: 850;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    transform: translateX(-50%);
    color: #eef0eb;
    pointer-events: none;
  }

  .mode-ui > span,
  .mode-ui > small {
    font-size: 8px;
    letter-spacing: .21em;
    color: rgba(235,240,235,.5);
  }

  .mode-ui > strong {
    font-size: clamp(24px, 5vw, 56px);
    font-weight: 500;
    letter-spacing: -.025em;
  }

  #now-flash {
    position: fixed;
    inset: 0;
    z-index: 1900;
    display: grid;
    place-items: center;
    color: #050708;
    background: #eeede6;
    font-size: clamp(100px, 22vw, 300px);
    font-weight: 700;
    letter-spacing: -.09em;
    pointer-events: none;
  }

  .full-panel {
    position: fixed;
    inset: 0;
    z-index: 1400;
    display: grid;
    place-items: center;
    padding: 22px;
    color: #edf0eb;
    background: rgba(1,4,6,.94);
    backdrop-filter: blur(12px);
  }

  .cinema-room,
  .hotel-panel,
  .station-panel,
  .exit-panel {
    width: min(760px, 100%);
  }

  .cinema-label,
  .hotel-panel > span,
  .station-panel > span,
  .exit-panel > span {
    font-size: 8px;
    letter-spacing: .22em;
    color: rgba(235,240,235,.45);
  }

  #cinema-screen {
    aspect-ratio: 16 / 9;
    margin: 20px 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 15px;
    padding: 30px;
    border: 1px solid rgba(235,240,235,.16);
    background:
      radial-gradient(circle at 50% 50%, #18252b, #020405 72%);
    text-align: center;
  }

  #cinema-screen span {
    font-size: 8px;
    letter-spacing: .22em;
    opacity: .45;
  }

  #cinema-screen strong {
    font-size: clamp(28px, 7vw, 78px);
    font-weight: 500;
    letter-spacing: -.045em;
  }

  #cinema-screen small {
    max-width: 520px;
    font-size: 9px;
    line-height: 1.7;
    letter-spacing: .13em;
    color: rgba(235,240,235,.58);
  }

  .full-panel button {
    padding: 13px 18px;
    border: 1px solid rgba(235,240,235,.25);
    border-radius: 0;
    color: #edf0eb;
    background: rgba(5,10,12,.65);
    font-size: 8px;
    letter-spacing: .16em;
  }

  .hotel-panel h2,
  .station-panel h2,
  .exit-panel h2 {
    margin: 18px 0;
    font-size: clamp(38px, 8vw, 84px);
    font-weight: 500;
    line-height: .95;
    letter-spacing: -.055em;
  }

  #hotel-record {
    min-height: 48px;
    margin: 0 0 24px;
    font-size: 10px;
    line-height: 1.7;
    letter-spacing: .1em;
    color: rgba(235,240,235,.58);
  }

  .hotel-actions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  #hotel-tv-screen {
    margin: 15px 0;
    min-height: 120px;
    padding: 22px;
    border: 1px solid rgba(175,220,225,.18);
    color: #bfe5df;
    background:
      repeating-linear-gradient(
        0deg,
        rgba(140,210,200,.025) 0,
        rgba(140,210,200,.025) 2px,
        transparent 2px,
        transparent 4px
      ),
      #071012;
    font: 500 9px/1.8 monospace;
    white-space: pre-line;
  }

  #hotel-leave {
    margin-top: 20px;
  }

  .departures {
    border-top: 1px solid rgba(235,240,235,.15);
    margin-bottom: 22px;
  }

  .departures button {
    display: grid;
    grid-template-columns: 100px 1fr;
    width: 100%;
    padding: 20px 10px;
    border: 0;
    border-bottom: 1px solid rgba(235,240,235,.11);
    text-align: left;
  }

  .departures b {
    font-weight: 500;
    color: rgba(235,240,235,.45);
  }

  .departures strong {
    letter-spacing: .15em;
  }

  #yesterday-ui {
    position: fixed;
    inset: 0;
    z-index: 1300;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: 0 0 9vh;
    align-items: center;
    color: #edf0eb;
    background: linear-gradient(transparent 55%, rgba(1,4,6,.7));
    pointer-events: none;
  }

  #yesterday-ui span {
    font-size: 8px;
    letter-spacing: .22em;
    opacity: .45;
  }

  #yesterday-ui strong {
    margin-top: 10px;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: .14em;
  }

  .exit-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    border-top: 1px solid rgba(235,240,235,.15);
    border-bottom: 1px solid rgba(235,240,235,.15);
  }

  .exit-stats div {
    padding: 18px 10px;
    border-right: 1px solid rgba(235,240,235,.09);
  }

  .exit-stats span,
  .exit-stats strong {
    display: block;
  }

  .exit-stats span {
    margin-bottom: 7px;
    font-size: 7px;
    letter-spacing: .17em;
    opacity: .42;
  }

  .exit-stats strong {
    font-size: 17px;
    font-weight: 500;
  }

  .exit-panel p {
    margin: 25px 0;
    font-size: 9px;
    letter-spacing: .15em;
    color: rgba(235,240,235,.5);
  }

  @media (max-width: 700px) {
    .arrival-inner h1 {
      font-size: clamp(50px, 15vw, 78px);
    }

    #desktop-entry {
      display: none !important;
    }

    #park-id,
    #reticle {
      display: none !important;
    }

    #guide {
      top: calc(10px + env(safe-area-inset-top));
      width: 190px;
    }

    #interaction {
      bottom: calc(108px + env(safe-area-inset-bottom));
    }

    #interaction-key {
      display: none;
    }

    #message {
      top: calc(112px + env(safe-area-inset-top));
    }

    .exit-stats {
      grid-template-columns: repeat(2, 1fr);
    }

    .hotel-actions {
      grid-template-columns: 1fr;
    }
  }
`

document.head.appendChild(style)

/* =========================================================
   DOM
   ========================================================= */

function el<T extends HTMLElement>(selector: string): T {
  const node = document.querySelector<T>(selector)
  if (!node) throw new Error(`Missing ${selector}`)
  return node
}

const worldEl = el<HTMLDivElement>('#world')
const arrival = el<HTMLDivElement>('#arrival')
const arrivalLine = el<HTMLElement>('#arrival-line')
const admit = el<HTMLButtonElement>('#admit')
const admitMain = el<HTMLElement>('#admit-main')
const desktopEntry = el<HTMLDivElement>('#desktop-entry')
const mobileEntry = el<HTMLDivElement>('#mobile-entry')

const parkId = el<HTMLDivElement>('#park-id')
const parkClock = el<HTMLElement>('#park-clock')

const guide = el<HTMLDivElement>('#guide')
const guideState = el<HTMLElement>('#guide-state')
const guideArrow = el<HTMLElement>('#guide-arrow')
const guideName = el<HTMLElement>('#guide-name')
const guideDistance = el<HTMLElement>('#guide-distance')
const guideHelp = el<HTMLElement>('#guide-help')

const reticle = el<HTMLDivElement>('#reticle')

const interaction = el<HTMLDivElement>('#interaction')
const interactionName = el<HTMLElement>('#interaction-name')
const interactionAction = el<HTMLElement>('#interaction-action')

const message = el<HTMLDivElement>('#message')
const messageKicker = el<HTMLElement>('#message-kicker')
const messageText = el<HTMLElement>('#message-text')

const mobileUi = el<HTMLDivElement>('#mobile-ui')
const whereButton = el<HTMLButtonElement>('#where-button')
const mobileUse = el<HTMLButtonElement>('#mobile-use')

const destinationSheet = el<HTMLDivElement>('#destination-sheet')
const destinationList = el<HTMLDivElement>('#destination-list')
const sheetClose = el<HTMLButtonElement>('#sheet-close')

const benchUi = el<HTMLDivElement>('#bench-ui')
const benchTime = el<HTMLElement>('#bench-time')
const benchNote = el<HTMLElement>('#bench-note')

const ferrisUi = el<HTMLDivElement>('#ferris-ui')
const ferrisHeight = el<HTMLElement>('#ferris-height')
const ferrisSub = el<HTMLElement>('#ferris-sub')
const cabinNumber = el<HTMLElement>('#cabin-number')

const nowUi = el<HTMLDivElement>('#now-ui')
const nowSpeed = el<HTMLElement>('#now-speed')
const nowSub = el<HTMLElement>('#now-sub')
const nowFlash = el<HTMLDivElement>('#now-flash')

const cinemaUi = el<HTMLDivElement>('#cinema-ui')
const filmKicker = el<HTMLElement>('#film-kicker')
const filmTitle = el<HTMLElement>('#film-title')
const filmCopy = el<HTMLElement>('#film-copy')
const cinemaLeave = el<HTMLButtonElement>('#cinema-leave')

const hotelUi = el<HTMLDivElement>('#hotel-ui')
const roomNumber = el<HTMLElement>('#room-number')
const hotelRecord = el<HTMLElement>('#hotel-record')
const hotelLight = el<HTMLButtonElement>('#hotel-light')
const hotelCurtain = el<HTMLButtonElement>('#hotel-curtain')
const hotelTV = el<HTMLButtonElement>('#hotel-tv')
const hotelTVScreen = el<HTMLDivElement>('#hotel-tv-screen')
const hotelLeave = el<HTMLButtonElement>('#hotel-leave')

const stationUi = el<HTMLDivElement>('#station-ui')
const stationLeave = el<HTMLButtonElement>('#station-leave')
const homeTime = el<HTMLElement>('#home-time')
const yesterdayTime = el<HTMLElement>('#yesterday-time')

const yesterdayUi = el<HTMLDivElement>('#yesterday-ui')
const yesterdayRecord = el<HTMLElement>('#yesterday-record')

const exitUi = el<HTMLDivElement>('#exit-ui')
const statVisit = el<HTMLElement>('#stat-visit')
const statSaw = el<HTMLElement>('#stat-saw')
const statMissed = el<HTMLElement>('#stat-missed')
const statTook = el<HTMLElement>('#stat-took')
const statLeft = el<HTMLElement>('#stat-left')
const statTime = el<HTMLElement>('#stat-time')
const returnPark = el<HTMLButtonElement>('#return-park')

/* =========================================================
   ARRIVAL COPY
   ========================================================= */

if (memory.visitCount === 1) {
  arrivalLine.textContent =
    'THIS TICKET IS VALID UNTIL YOU NOTICE YOU ARE INSIDE.'
  admitMain.textContent = 'ADMIT ONE'
} else {
  arrivalLine.textContent =
    'YOUR PREVIOUS VISIT HAS NOT FINISHED.'
  admitMain.textContent = 'ADMIT AGAIN'
}

if (isMobile) {
  desktopEntry.classList.add('hidden')
  mobileEntry.classList.remove('hidden')
  guideHelp.textContent = 'TAP / CHOOSE DESTINATION'
}

/* =========================================================
   THREE
   ========================================================= */

const scene = new THREE.Scene()
scene.background = new THREE.Color('#02060b')
scene.fog = new THREE.FogExp2('#07121a', 0.0065)

const camera = new THREE.PerspectiveCamera(
  64,
  innerWidth / innerHeight,
  0.08,
  600
)

camera.position.set(0, 1.72, 18)
camera.rotation.order = 'YXZ'

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
})

renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(
  Math.min(devicePixelRatio, isMobile ? 1.2 : 1.5)
)

renderer.outputColorSpace = THREE.SRGBColorSpace
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.02
renderer.shadowMap.enabled = !isMobile
renderer.shadowMap.type = THREE.PCFShadowMap

worldEl.appendChild(renderer.domElement)

/* =========================================================
   MATERIALS
   ========================================================= */

const mat = {
  asphalt: new THREE.MeshStandardMaterial({
    color: '#101719',
    roughness: 0.84,
    metalness: 0.06,
  }),

  concrete: new THREE.MeshStandardMaterial({
    color: '#353c3e',
    roughness: 0.87,
  }),

  concreteDark: new THREE.MeshStandardMaterial({
    color: '#1d2528',
    roughness: 0.86,
  }),

  black: new THREE.MeshStandardMaterial({
    color: '#080d10',
    roughness: 0.66,
    metalness: 0.25,
  }),

  metal: new THREE.MeshStandardMaterial({
    color: '#596367',
    roughness: 0.36,
    metalness: 0.78,
  }),

  blackMetal: new THREE.MeshStandardMaterial({
    color: '#111719',
    roughness: 0.42,
    metalness: 0.8,
  }),

  cream: new THREE.MeshStandardMaterial({
    color: '#b9b19d',
    roughness: 0.72,
  }),

  red: new THREE.MeshStandardMaterial({
    color: '#4f171c',
    roughness: 0.58,
  }),

  blue: new THREE.MeshStandardMaterial({
    color: '#17313a',
    roughness: 0.62,
  }),

  glass: new THREE.MeshPhysicalMaterial({
    color: '#7ba9b0',
    roughness: 0.15,
    metalness: 0.04,
    transparent: true,
    opacity: 0.42,
  }),

  wet: new THREE.MeshStandardMaterial({
    color: '#0b151a',
    roughness: 0.13,
    metalness: 0.48,
  }),

  rail: new THREE.MeshStandardMaterial({
    color: '#929b9d',
    roughness: 0.23,
    metalness: 0.9,
  }),

  warm: new THREE.MeshBasicMaterial({
    color: '#ffd49a',
  }),

  cold: new THREE.MeshBasicMaterial({
    color: '#b9ecff',
  }),

  redLight: new THREE.MeshBasicMaterial({
    color: '#ff3c2e',
  }),
}

/* =========================================================
   HELPERS
   ========================================================= */

function box(
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    material
  )

  mesh.position.set(x, y, z)
  mesh.castShadow = !isMobile
  mesh.receiveShadow = true
  scene.add(mesh)

  return mesh
}

function cylinder(
  radius: number,
  height: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 12),
    material
  )

  mesh.position.set(x, y, z)
  mesh.castShadow = !isMobile
  scene.add(mesh)

  return mesh
}

function plane(
  w: number,
  h: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  ry = 0
) {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    material
  )

  mesh.position.set(x, y, z)
  mesh.rotation.y = ry
  scene.add(mesh)

  return mesh
}

function rememberPlace(name: PlaceId) {
  if (!memory.placesSeen.includes(name)) {
    memory.placesSeen.push(name)
    saveMemory()
  }
}

function rememberSentence(text: string) {
  if (!memory.sentencesSeen.includes(text)) {
    memory.sentencesSeen.push(text)
    saveMemory()
  }
}

function formatDuration(seconds: number) {
  const min = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')

  const sec = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')

  return `${min}:${sec}`
}

function distanceXZ(a: THREE.Vector3, b: THREE.Vector3) {
  return Math.hypot(a.x - b.x, a.z - b.z)
}

let messageTimer = 0

function showMessage(
  kicker: string,
  text: string,
  duration = 4000
) {
  clearTimeout(messageTimer)

  messageKicker.textContent = kicker
  messageText.textContent = text
  message.classList.remove('hidden')

  rememberSentence(`${kicker}: ${text}`)

  messageTimer = window.setTimeout(() => {
    message.classList.add('hidden')
  }, duration)
}

/* =========================================================
   SIGN SYSTEM
   ========================================================= */

function signMaterial(
  lines: string[],
  bg = '#e3dcc9',
  fg = '#101416'
) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return new THREE.MeshBasicMaterial({ color: bg })
  }

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  ctx.strokeStyle = fg
  ctx.lineWidth = 10
  ctx.strokeRect(18, 18, 988, 476)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  lines.forEach((line, index) => {
    const size =
      index === 0
        ? 66
        : Math.max(25, 42 - lines.length * 2)

    ctx.font = `${index === 0 ? 700 : 500} ${size}px Arial`
    ctx.fillStyle = fg

    ctx.fillText(
      line,
      canvas.width / 2,
      ((index + 1) / (lines.length + 1)) * canvas.height
    )
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace

  return new THREE.MeshBasicMaterial({
    map: texture,
    toneMapped: false,
  })
}

function sign(
  lines: string[],
  w: number,
  h: number,
  x: number,
  y: number,
  z: number,
  ry = 0,
  bg = '#e3dcc9',
  fg = '#101416'
) {
  return plane(
    w,
    h,
    signMaterial(lines, bg, fg),
    x,
    y,
    z,
    ry
  )
}

/* =========================================================
   SKY / LIGHT
   ========================================================= */

scene.add(
  new THREE.HemisphereLight(
    '#6c8ca5',
    '#050707',
    1.35
  )
)

const moonLight = new THREE.DirectionalLight('#bddcff', 1.8)
moonLight.position.set(-40, 55, 35)
scene.add(moonLight)

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(4.5, 20, 20),
  new THREE.MeshBasicMaterial({ color: '#c7d4da' })
)

moon.position.set(-72, 46, -235)
scene.add(moon)

/* =========================================================
   PARK GROUND
   ========================================================= */

box(210, 0.4, 300, mat.asphalt, 0, -0.3, -112)

box(11, 0.13, 245, mat.concreteDark, 0, -0.03, -99)

box(1.5, 0.2, 245, mat.concrete, -6.2, 0, -99)
box(1.5, 0.2, 245, mat.concrete, 6.2, 0, -99)

for (let z = 9; z > -215; z -= 12) {
  box(0.07, 0.025, 4, mat.cream, 0, 0.05, z)
}

const puddles = [
  [-2.4, -17, 3.2, 1.1],
  [2.7, -37, 2.1, .8],
  [-3.1, -63, 2.7, .9],
  [2.3, -91, 3.2, .8],
  [-2.8, -121, 2.1, .75],
  [2.5, -151, 3.4, 1.1],
  [-2.1, -184, 2.4, .8],
]

for (const [x, z, sx, sy] of puddles) {
  const puddle = new THREE.Mesh(
    new THREE.CircleGeometry(1, 22),
    mat.wet
  )

  puddle.rotation.x = -Math.PI / 2
  puddle.position.set(x, 0.045, z)
  puddle.scale.set(sx, sy, 1)
  scene.add(puddle)
}

/* =========================================================
   PARK LIGHTS
   ========================================================= */

const parkLights: THREE.PointLight[] = []

function lamp(x: number, z: number, cold = false) {
  cylinder(.065, 5.5, mat.blackMetal, x, 2.75, z)

  box(
    .7,
    .32,
    .7,
    cold ? mat.cold : mat.warm,
    x,
    5.42,
    z
  )

  if (!isMobile || parkLights.length < 12) {
    const light = new THREE.PointLight(
      cold ? '#b9ecff' : '#ffd29a',
      6.5,
      13,
      2
    )

    light.position.set(x, 5.05, z)
    scene.add(light)
    parkLights.push(light)
  }
}

for (let z = 3, i = 0; z > -210; z -= 15, i++) {
  lamp(-7, z, i % 4 === 0)
  lamp(7, z - 7, i % 5 === 0)
}

/* =========================================================
   ARCHITECTURE HELPERS
   ========================================================= */

function roof(x: number, z: number, w: number, d: number, y: number) {
  box(w + .9, .35, d + .9, mat.blackMetal, x, y, z)
}

function windows(
  x: number,
  z: number,
  w: number,
  y: number,
  facingFront = true
) {
  const count = Math.max(2, Math.floor(w / 2.4))

  for (let i = 0; i < count; i++) {
    const offset =
      -w / 2 + 1.4 + i * ((w - 2.8) / Math.max(1, count - 1))

    if (facingFront) {
      box(1.15, 1.6, .06, mat.glass, x + offset, y, z)
    } else {
      box(.06, 1.6, 1.15, mat.glass, x, y, z + offset)
    }
  }
}

function acUnit(x: number, y: number, z: number, ry = 0) {
  const unit = box(1.2, .8, .5, mat.metal, x, y, z)
  unit.rotation.y = ry

  const fan = new THREE.Mesh(
    new THREE.TorusGeometry(.23, .035, 6, 16),
    mat.blackMetal
  )

  fan.position.set(x, y, z + (ry === 0 ? .27 : 0))
  fan.rotation.y = ry
  scene.add(fan)
}

function fence(x: number, z: number, length: number, horizontal = true) {
  const posts = Math.ceil(length / 2)

  for (let i = 0; i <= posts; i++) {
    const t = i / posts

    const px = horizontal ? x - length / 2 + t * length : x
    const pz = horizontal ? z : z - length / 2 + t * length

    cylinder(.035, 1.6, mat.blackMetal, px, .8, pz)
  }

  if (horizontal) {
    box(length, .045, .045, mat.blackMetal, x, .35, z)
    box(length, .045, .045, mat.blackMetal, x, 1.25, z)
  } else {
    box(.045, .045, length, mat.blackMetal, x, .35, z)
    box(.045, .045, length, mat.blackMetal, x, 1.25, z)
  }
}

function serviceBuilding(
  x: number,
  z: number,
  w: number,
  d: number,
  h: number,
  title: string,
  material = mat.black
) {
  box(w, h, d, material, x, h / 2, z)
  roof(x, z, w, d, h + .15)

  windows(x, z + d / 2 + .04, w, 2.25)

  sign(
    [title, 'OPEN UNTIL FURTHER NOTICE'],
    Math.min(7.5, w - 1),
    1.5,
    x,
    h - 1,
    z + d / 2 + .07
  )

  box(1.2, 2.5, .08, mat.metal, x + w / 2 - 1.1, 1.25, z + d / 2 + .08)

  acUnit(
    x - w / 2 + .9,
    1.1,
    z + d / 2 + .31
  )
}

/* =========================================================
   ENTRANCE
   ========================================================= */

box(1.1, 8, 1.1, mat.concrete, -7.5, 4, 10)
box(1.1, 8, 1.1, mat.concrete, 7.5, 4, 10)
box(16.2, 1, 1.3, mat.black, 0, 7.7, 10)

sign(
  [
    "DREAM KEEP DREAMIN'",
    'THE PARK / AFTER HOURS',
  ],
  12,
  2.4,
  0,
  7.7,
  9.3,
  0,
  '#0a0f11',
  '#d8e8e7'
)

serviceBuilding(-12.5, 7, 6, 5, 4.3, 'TICKETS')

sign(
  [
    'NIGHT ADMISSION',
    'ADULT ¥0',
    'CHILD ¥0',
    'RETURNING VISITOR ALREADY PAID',
  ],
  4.2,
  2.8,
  -12.5,
  2.4,
  9.55
)

fence(-20, 12, 18, true)
fence(20, 12, 18, true)

/* =========================================================
   DIRECTORY
   ========================================================= */

box(6.2, .3, .45, mat.blackMetal, 8.5, 1.2, -4)

cylinder(.07, 2.4, mat.blackMetal, 6.2, 1.2, -4)
cylinder(.07, 2.4, mat.blackMetal, 10.8, 1.2, -4)

sign(
  [
    'PARK DIRECTORY',
    'NOW',
    'FERRIS WHEEL',
    'THE BENCH',
    'LOST & FOUND',
    'CINEMA / HOTEL / STATION',
  ],
  5.5,
  5,
  8.5,
  3.5,
  -4,
  -.1
)

/* =========================================================
   SHOPS / BACK OF HOUSE
   ========================================================= */

serviceBuilding(-17, -22, 12, 10, 6.7, 'NIGHT CANDY')
serviceBuilding(18, -35, 13, 9, 7.3, 'PHOTO SERVICE')
serviceBuilding(-18, -128, 14, 12, 8.2, 'ARCADE')
serviceBuilding(20, -145, 12, 10, 6.8, 'FIRST AID')

sign(
  [
    'STAFF ONLY',
    'IF YOU ARE STAFF',
    'YOU ALREADY KNOW THE CODE',
  ],
  4.4,
  2.7,
  20,
  3.2,
  -139.95
)

fence(-18, -32, 14, true)
fence(18, -46, 14, true)

/* =========================================================
   BENCH
   ========================================================= */

const benchPosition = new THREE.Vector3(-10.5, 0, -51)

box(4.5, .28, .65, mat.cream, -10.5, .95, -51)
box(4.5, 1.2, .2, mat.cream, -10.5, 1.55, -51.4)

box(.16, .9, .16, mat.blackMetal, -12.1, .45, -51)
box(.16, .9, .16, mat.blackMetal, -8.9, .45, -51)

const benchRecord =
  memory.benchSeconds > 1
    ? [
        'THE BENCH',
        `PREVIOUS OCCUPANCY ${formatDuration(memory.benchSeconds)}`,
        'CLAIMANT: PRESENT',
      ]
    : [
        'THE BENCH',
        'WAITING IS PERMITTED',
      ]

sign(
  benchRecord,
  5,
  2.2,
  -10.5,
  3.8,
  -52
)

/* =========================================================
   LOST & FOUND
   ========================================================= */

const lostPosition = new THREE.Vector3(13.5, 0, -66)

serviceBuilding(18, -67, 12, 10, 7, 'LOST & FOUND', mat.concrete)

const itemClaimed = memory.foundItems.includes('ITEM 0317')

sign(
  itemClaimed
    ? [
        'ITEM 0317',
        'STATUS: CLAIMED',
        'CLAIMANT: PRESENT',
      ]
    : [
        'ITEM 0317',
        'ADMIT ONE / 03:17',
        'OWNER: NOT CURRENTLY AVAILABLE',
      ],
  4.8,
  2.8,
  12.4,
  4,
  -64.2,
  -Math.PI / 2
)

let lostItem: THREE.Mesh | null = null

if (!itemClaimed) {
  lostItem = box(
    .9,
    .04,
    .45,
    mat.cream,
    13.1,
    1.05,
    -66
  )
}

/* =========================================================
   FERRIS WHEEL
   ========================================================= */

const ferrisBoarding = new THREE.Vector3(-17, 0, -87)
const ferrisCenter = new THREE.Vector3(-29, 16, -91)
const ferrisRadius = 14.5

const ferris = new THREE.Group()
ferris.position.copy(ferrisCenter)
scene.add(ferris)

const ferrisRing = new THREE.Mesh(
  new THREE.TorusGeometry(ferrisRadius, .2, 8, 72),
  mat.metal
)

ferrisRing.rotation.y = Math.PI / 2
ferris.add(ferrisRing)

for (let i = 0; i < 12; i++) {
  const a = (i / 12) * Math.PI * 2

  const spoke = new THREE.Mesh(
    new THREE.CylinderGeometry(.045, .045, ferrisRadius, 6),
    mat.blackMetal
  )

  spoke.position.set(
    0,
    Math.cos(a) * ferrisRadius / 2,
    Math.sin(a) * ferrisRadius / 2
  )

  spoke.rotation.x = Math.PI / 2 - a
  ferris.add(spoke)
}

const gondolas: THREE.Group[] = []

for (let i = 0; i < 12; i++) {
  const group = new THREE.Group()

  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 1.45, 1.5),
    i % 3 === 0 ? mat.red : mat.black
  )

  cabin.position.y = -.75
  group.add(cabin)

  const canopy = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, .12, 1.8),
    mat.cream
  )

  canopy.position.y = .02
  group.add(canopy)

  ferris.add(group)
  gondolas.push(group)
}

const supportA = box(.75, 31, .75, mat.blackMetal, -34, 15, -91)
const supportB = box(.75, 31, .75, mat.blackMetal, -24, 15, -91)

supportA.rotation.z = -.31
supportB.rotation.z = .31

box(14, .5, 7, mat.concrete, -29, .25, -91)

sign(
  [
    'FERRIS WHEEL',
    'ONE REVOLUTION',
  ],
  7,
  2,
  -18,
  5,
  -84,
  Math.PI / 2
)

/* =========================================================
   CINEMA
   ========================================================= */

const cinemaPosition = new THREE.Vector3(14, 0, -104)

serviceBuilding(20, -108, 13, 14, 8.5, 'CINEMA')

sign(
  [
    'TONIGHT',
    'BEFORE',
    'DURING',
    'AFTER',
    'CLOSED',
  ],
  4.4,
  4.6,
  13.4,
  4,
  -100.9,
  -Math.PI / 2
)

box(1.7, 3.3, .08, mat.red, 16.2, 1.65, -100.95)

/* =========================================================
   HOTEL
   ========================================================= */

const hotelPosition = new THREE.Vector3(17, 0, -128)

box(15, 18, 13, mat.concreteDark, 23, 9, -128)
roof(23, -128, 15, 13, 18.2)

for (let floor = 0; floor < 5; floor++) {
  for (let col = 0; col < 4; col++) {
    const lit =
      (floor * 4 + col + memory.visitCount) % 5 === 0

    box(
      1.6,
      1.6,
      .07,
      lit ? mat.warm : mat.glass,
      18.7 + col * 2.8,
      3 + floor * 3,
      -121.45
    )
  }
}

sign(
  [
    'THE HOTEL',
    `ROOM ${memory.hotelRoom}`,
    'CHECKOUT NOT REQUIRED',
  ],
  7,
  3,
  17.5,
  5,
  -121.35
)

/* =========================================================
   CLOSED
   ========================================================= */

const closedPosition = new THREE.Vector3(-15, 0, -151)
const closedOpen =
  memory.visitCount >= 3 ||
  memory.benchSeconds >= 60

box(14, 8, 11, mat.red, -22, 4, -154)
roof(-22, -154, 14, 11, 8.2)

box(9, 5.5, .15, mat.blackMetal, -22, 2.75, -148.42)

sign(
  closedOpen
    ? [
        '03:17',
        'OPEN',
        'ONE VISITOR AT A TIME',
      ]
    : [
        'CLOSED',
        'OPENING CONDITION:',
        'UNKNOWN',
      ],
  8,
  3,
  -22,
  6.4,
  -148.3
)

/* =========================================================
   STATION
   ========================================================= */

const stationPosition = new THREE.Vector3(15, 0, -177)

box(20, .4, 12, mat.concrete, 20, .2, -180)

box(20, 5.5, 5, mat.black, 20, 2.75, -186)
roof(20, -186, 20, 5, 5.7)

sign(
  [
    'STATION',
    'HOME',
    'YESTERDAY',
    '—',
  ],
  7,
  3.2,
  13,
  4,
  -183.42,
  -Math.PI / 2
)

for (let i = 0; i < 2; i++) {
  box(
    .1,
    .08,
    70,
    mat.rail,
    8 + i * 1.2,
    .08,
    -190
  )
}

/* =========================================================
   NOW STATION
   ========================================================= */

const nowBoarding = new THREE.Vector3(0, 0, -207)

box(20, .45, 14, mat.concrete, 0, .22, -214)

box(1, 9, 1, mat.blackMetal, -8.5, 4.5, -213)
box(1, 9, 1, mat.blackMetal, 8.5, 4.5, -213)

box(19, .75, 13, mat.black, 0, 8.7, -213)

sign(
  [
    'NOW',
    "YOU CAN'T STAY HERE",
  ],
  12,
  3.4,
  0,
  10.1,
  -206.45,
  0,
  '#091012',
  '#e2f2ef'
)

sign(
  [
    'BOARDING',
    'RESTRAINTS WILL LOCK',
    'BEFORE YOU ARE READY',
  ],
  6,
  2.2,
  0,
  3.6,
  -206.4
)

/* =========================================================
   NOW TRACK
   ========================================================= */

const trackPoints = [
  new THREE.Vector3(0, 5.5, -215),
  new THREE.Vector3(15, 8, -229),
  new THREE.Vector3(32, 20, -244),
  new THREE.Vector3(27, 35, -267),
  new THREE.Vector3(6, 17, -286),
  new THREE.Vector3(-22, 6, -283),
  new THREE.Vector3(-40, 25, -255),
  new THREE.Vector3(-32, 34, -225),
  new THREE.Vector3(-15, 11, -204),
  new THREE.Vector3(-3, 5.5, -198),
]

const nowCurve = new THREE.CatmullRomCurve3(
  trackPoints,
  true,
  'catmullrom',
  .18
)

function offsetCurve(offset: number) {
  const points: THREE.Vector3[] = []

  for (let i = 0; i <= 260; i++) {
    const t = i / 260
    const p = nowCurve.getPointAt(t)
    const tangent = nowCurve.getTangentAt(t).normalize()

    const side = new THREE.Vector3()
      .crossVectors(tangent, new THREE.Vector3(0, 1, 0))
      .normalize()

    points.push(p.clone().addScaledVector(side, offset))
  }

  return new THREE.CatmullRomCurve3(points, true)
}

scene.add(
  new THREE.Mesh(
    new THREE.TubeGeometry(offsetCurve(-.55), 320, .09, 8, true),
    mat.rail
  )
)

scene.add(
  new THREE.Mesh(
    new THREE.TubeGeometry(offsetCurve(.55), 320, .09, 8, true),
    mat.rail
  )
)

for (let i = 0; i < 110; i++) {
  const t = i / 110
  const p = nowCurve.getPointAt(t)
  const tangent = nowCurve.getTangentAt(t)

  const sleeper = box(
    1.55,
    .1,
    .2,
    mat.blackMetal,
    p.x,
    p.y,
    p.z
  )

  sleeper.rotation.y = Math.atan2(tangent.x, tangent.z)
}

/* =========================================================
   NOW MEMORY MONUMENTS
   ========================================================= */

function memoryMonument(
  t: number,
  lines: string[]
) {
  const p = nowCurve.getPointAt(t)
  const tangent = nowCurve.getTangentAt(t).normalize()

  const side = new THREE.Vector3()
    .crossVectors(tangent, new THREE.Vector3(0, 1, 0))
    .normalize()

  const pos = p.clone().addScaledVector(side, 5.5)
  pos.y += 2

  sign(
    lines,
    5.8,
    3,
    pos.x,
    pos.y,
    pos.z,
    Math.atan2(tangent.x, tangent.z)
  )
}

memoryMonument(.17, [
  `VISIT ${String(Math.max(1, memory.visitCount - 1)).padStart(2, '0')}`,
  memory.visitCount > 1 ? 'PREVIOUS' : 'NOT YET COMPLETE',
])

if (memory.benchSeconds > 1) {
  memoryMonument(.36, [
    'THE BENCH',
    formatDuration(memory.benchSeconds),
  ])
}

if (itemClaimed) {
  memoryMonument(.54, [
    'ITEM 0317',
    'CLAIMED',
  ])
}

if (memory.visitCount > 1) {
  memoryMonument(.72, [
    `VISIT ${String(memory.visitCount).padStart(2, '0')}`,
    'CURRENT',
  ])
}

/* =========================================================
   EXIT
   ========================================================= */

const exitPosition = new THREE.Vector3(11, 0, 8)

serviceBuilding(13, 7, 5, 4, 4.8, 'EXIT')

sign(
  [
    'EXIT',
    'THIS WAY',
    'YOU MAY RETURN',
  ],
  4,
  2.5,
  10.4,
  3.1,
  8.95
)

/* =========================================================
   SMALL DETAILS
   ========================================================= */

for (let z = -18; z > -195; z -= 26) {
  box(.8, 1.1, .8, mat.black, -8.4, .55, z)

  box(
    .65,
    .08,
    .65,
    mat.metal,
    -8.4,
    1.1,
    z
  )
}

for (let z = -30; z > -185; z -= 38) {
  sign(
    [
      'PARK NOTICE',
      z < -100
        ? 'DO NOT FOLLOW STAFF'
        : 'PLEASE KEEP YOUR TICKET',
    ],
    3.4,
    1.6,
    8.2,
    2.5,
    z,
    -.12
  )
}

/* =========================================================
   AUDIO
   ========================================================= */

let audioContext: AudioContext | null = null
let masterGain: GainNode | null = null

function startAudio() {
  if (audioContext) {
    audioContext.resume()
    return
  }

  const AudioCtor =
    window.AudioContext ||
    (window as typeof window & {
      webkitAudioContext?: typeof AudioContext
    }).webkitAudioContext

  if (!AudioCtor) return

  audioContext = new AudioCtor()

  masterGain = audioContext.createGain()
  masterGain.gain.value = .12
  masterGain.connect(audioContext.destination)

  const hum = audioContext.createOscillator()
  const humGain = audioContext.createGain()

  hum.type = 'sine'
  hum.frequency.value = 47
  humGain.gain.value = .05

  hum.connect(humGain)
  humGain.connect(masterGain)
  hum.start()

  const electrical = audioContext.createOscillator()
  const electricalGain = audioContext.createGain()

  electrical.type = 'triangle'
  electrical.frequency.value = 97
  electricalGain.gain.value = .009

  electrical.connect(electricalGain)
  electricalGain.connect(masterGain)
  electrical.start()
}

function audioPulse(
  frequency: number,
  duration: number,
  volume = .04
) {
  if (!audioContext || !masterGain) return

  const osc = audioContext.createOscillator()
  const gain = audioContext.createGain()

  osc.frequency.value = frequency
  osc.type = 'sine'

  gain.gain.setValueAtTime(volume, audioContext.currentTime)
  gain.gain.exponentialRampToValueAtTime(
    .0001,
    audioContext.currentTime + duration
  )

  osc.connect(gain)
  gain.connect(masterGain)

  osc.start()
  osc.stop(audioContext.currentTime + duration)
}

/* =========================================================
   STATE
   ========================================================= */

let entered = false
let mode: Mode = 'walk'
let visitStartedAt = performance.now()

let yaw = 0
let pitch = 0

const movement = {
  forward: false,
  back: false,
  left: false,
  right: false,
  run: false,
}

function clearMovement() {
  movement.forward = false
  movement.back = false
  movement.left = false
  movement.right = false
  movement.run = false
}

/* =========================================================
   INPUT
   ========================================================= */

window.addEventListener('keydown', (event) => {
  if (isMobile) return

  const key = event.key.toLowerCase()

  if (key === 'w' || event.code === 'ArrowUp') movement.forward = true
  if (key === 's' || event.code === 'ArrowDown') movement.back = true
  if (key === 'a' || event.code === 'ArrowLeft') movement.left = true
  if (key === 'd' || event.code === 'ArrowRight') movement.right = true
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') movement.run = true

  if (key === 'e' && !event.repeat) interact()
  if (key === 'g' && !event.repeat && mode === 'walk') cycleGuide()

  if (event.code === 'Escape' && mode === 'bench') {
    stopBench()
  }
})

window.addEventListener('keyup', (event) => {
  if (isMobile) return

  const key = event.key.toLowerCase()

  if (key === 'w' || event.code === 'ArrowUp') movement.forward = false
  if (key === 's' || event.code === 'ArrowDown') movement.back = false
  if (key === 'a' || event.code === 'ArrowLeft') movement.left = false
  if (key === 'd' || event.code === 'ArrowRight') movement.right = false
  if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') movement.run = false
})

window.addEventListener('blur', clearMovement)

/* =========================================================
   DESKTOP LOOK
   ========================================================= */

renderer.domElement.addEventListener('click', () => {
  if (
    entered &&
    mode === 'walk' &&
    !isMobile &&
    document.pointerLockElement !== renderer.domElement
  ) {
    renderer.domElement.requestPointerLock()
  }
})

document.addEventListener('mousemove', (event) => {
  if (
    mode !== 'walk' ||
    document.pointerLockElement !== renderer.domElement
  ) {
    return
  }

  yaw -= event.movementX * .0018
  pitch -= event.movementY * .0015
  pitch = THREE.MathUtils.clamp(pitch, -1.2, 1.2)
})

/* =========================================================
   MOBILE LOOK
   ========================================================= */

let lookPointer: number | null = null
let lookX = 0
let lookY = 0

renderer.domElement.addEventListener('pointerdown', (event) => {
  if (!isMobile || !entered || mode !== 'walk') return

  lookPointer = event.pointerId
  lookX = event.clientX
  lookY = event.clientY
})

renderer.domElement.addEventListener('pointermove', (event) => {
  if (
    !isMobile ||
    lookPointer !== event.pointerId ||
    mode !== 'walk'
  ) {
    return
  }

  const dx = event.clientX - lookX
  const dy = event.clientY - lookY

  lookX = event.clientX
  lookY = event.clientY

  yaw -= dx * .005
  pitch -= dy * .004
  pitch = THREE.MathUtils.clamp(pitch, -1.1, 1.1)
})

renderer.domElement.addEventListener('pointerup', (event) => {
  if (lookPointer === event.pointerId) {
    lookPointer = null
  }
})

renderer.domElement.addEventListener('pointercancel', () => {
  lookPointer = null
})

/* =========================================================
   GUIDE / DESTINATIONS
   ========================================================= */

type Stop = {
  name: PlaceId
  position: THREE.Vector3
  note: string
}

const stops: Stop[] = [
  {
    name: 'NOW',
    position: nowBoarding,
    note: 'RIDE',
  },
  {
    name: 'FERRIS WHEEL',
    position: ferrisBoarding,
    note: 'ONE REVOLUTION',
  },
  {
    name: 'THE BENCH',
    position: benchPosition,
    note: 'WAIT',
  },
  {
    name: 'LOST & FOUND',
    position: lostPosition,
    note: 'POCKET',
  },
  {
    name: 'CINEMA',
    position: cinemaPosition,
    note: 'TONIGHT',
  },
  {
    name: 'THE HOTEL',
    position: hotelPosition,
    note: `ROOM ${memory.hotelRoom}`,
  },
  {
    name: 'STATION',
    position: stationPosition,
    note: 'DEPARTURES',
  },
  {
    name: 'CLOSED',
    position: closedPosition,
    note: closedOpen ? '03:17 / OPEN' : 'NOT OPEN',
  },
  {
    name: 'EXIT',
    position: exitPosition,
    note: 'LEAVE THE PARK',
  },
]

let guideIndex = 0

function buildDestinationList() {
  destinationList.innerHTML = ''

  for (const stop of stops) {
    const button = document.createElement('button')

    button.className =
      `destination ${stop.name === 'CLOSED' && !closedOpen ? 'locked' : ''}`

    button.innerHTML = `
      <strong>${stop.name}</strong>
      <span>${stop.note}</span>
    `

    button.addEventListener('click', () => {
      chooseDestination(stop)
    })

    destinationList.appendChild(button)
  }

  if (itemClaimed) {
    const ticket = document.createElement('button')
    ticket.className = 'destination'

    ticket.innerHTML = `
      <strong>03:17</strong>
      <span>ITEM 0317</span>
    `

    ticket.addEventListener('click', () => {
      chooseDestination(
        closedOpen
          ? stops.find((s) => s.name === 'CLOSED')!
          : stops.find((s) => s.name === 'LOST & FOUND')!
      )
    })

    destinationList.appendChild(ticket)
  }

  if (memory.visitCount > 1) {
    const yesterday = document.createElement('button')
    yesterday.className = 'destination'

    yesterday.innerHTML = `
      <strong>YESTERDAY</strong>
      <span>STATION</span>
    `

    yesterday.addEventListener('click', () => {
      chooseDestination(
        stops.find((s) => s.name === 'STATION')!
      )
    })

    destinationList.appendChild(yesterday)
  }
}

buildDestinationList()

function cycleGuide() {
  guideIndex = (guideIndex + 1) % stops.length
}

function openGuide() {
  if (!entered || mode !== 'walk') return
  destinationSheet.classList.remove('hidden')
}

function closeGuide() {
  destinationSheet.classList.add('hidden')
}

whereButton.addEventListener('click', openGuide)
sheetClose.addEventListener('click', closeGuide)

destinationSheet.addEventListener('click', (event) => {
  if (event.target === destinationSheet) closeGuide()
})

/* =========================================================
   MOBILE WALK ROUTE
   ========================================================= */

let autoWalking = false
let route: THREE.Vector3[] = []
let routeIndex = 0
let routeTarget: Stop | null = null

function buildRoute(stop: Stop) {
  const current = camera.position.clone()
  current.y = 1.72

  const target = stop.position.clone()
  target.y = 1.72

  const points: THREE.Vector3[] = []

  if (Math.abs(current.x) > 2.5) {
    points.push(new THREE.Vector3(0, 1.72, current.z))
  }

  const approachZ =
    target.z < current.z
      ? target.z + 6
      : target.z - 6

  points.push(new THREE.Vector3(0, 1.72, approachZ))

  if (Math.abs(target.x) > 2) {
    points.push(
      new THREE.Vector3(
        target.x * .55,
        1.72,
        approachZ
      )
    )
  }

  points.push(target)

  return points
}

function chooseDestination(stop: Stop) {
  guideIndex = stops.indexOf(stop)

  closeGuide()

  if (stop.name === 'CLOSED' && !closedOpen) {
    showMessage(
      'PARK GUIDE',
      'THIS DESTINATION IS NOT CURRENTLY AVAILABLE.',
      3500
    )
    return
  }

  routeTarget = stop
  route = buildRoute(stop)
  routeIndex = 0
  autoWalking = true

  showMessage(
    'PARK GUIDE',
    `DESTINATION: ${stop.name}`,
    1800
  )
}

function stopRoute() {
  autoWalking = false
  route = []
  routeIndex = 0
}

/* =========================================================
   INTERACTION
   ========================================================= */

type Interactable = {
  name: PlaceId
  actionText: string
  position: THREE.Vector3
  range: number
  action: () => void
}

let currentInteractable: Interactable | null = null

const interactables: Interactable[] = [
  {
    name: 'THE BENCH',
    actionText: 'SIT',
    position: benchPosition,
    range: 4.8,
    action: startBench,
  },
  {
    name: 'LOST & FOUND',
    actionText: itemClaimed ? 'CHECK RECORD' : 'TAKE',
    position: lostPosition,
    range: 5,
    action: useLostFound,
  },
  {
    name: 'FERRIS WHEEL',
    actionText: 'BOARD',
    position: ferrisBoarding,
    range: 5.5,
    action: startFerris,
  },
  {
    name: 'CINEMA',
    actionText: 'ENTER',
    position: cinemaPosition,
    range: 5.2,
    action: startCinema,
  },
  {
    name: 'THE HOTEL',
    actionText: 'ENTER',
    position: hotelPosition,
    range: 5.4,
    action: startHotel,
  },
  {
    name: 'CLOSED',
    actionText: closedOpen ? 'ENTER 03:17' : 'READ NOTICE',
    position: closedPosition,
    range: 5,
    action: useClosed,
  },
  {
    name: 'STATION',
    actionText: 'ENTER PLATFORM',
    position: stationPosition,
    range: 5.5,
    action: startStation,
  },
  {
    name: 'NOW',
    actionText: 'BOARD NOW',
    position: nowBoarding,
    range: 6,
    action: startNow,
  },
  {
    name: 'EXIT',
    actionText: 'LEAVE THE PARK',
    position: exitPosition,
    range: 5,
    action: leavePark,
  },
]

function updateInteraction() {
  let nearest: Interactable | null = null
  let best = Infinity

  for (const item of interactables) {
    const d = distanceXZ(camera.position, item.position)

    if (d < item.range && d < best) {
      best = d
      nearest = item
    }
  }

  currentInteractable = nearest

  if (!nearest) {
    interaction.classList.add('hidden')
    mobileUse.classList.remove('active')
    return
  }

  interactionName.textContent = nearest.name
  interactionAction.textContent = nearest.actionText

  interaction.classList.remove('hidden')

  if (isMobile) {
    mobileUse.textContent =
      nearest.actionText === 'BOARD NOW'
        ? 'BOARD'
        : nearest.actionText === 'ENTER PLATFORM'
          ? 'ENTER'
          : nearest.actionText.split(' ')[0]

    mobileUse.classList.add('active')
  }
}

function interact() {
  if (
    !entered ||
    mode !== 'walk' ||
    !currentInteractable
  ) {
    return
  }

  stopRoute()
  currentInteractable.action()
}

mobileUse.addEventListener('click', interact)

/* =========================================================
   WALK UI
   ========================================================= */

function hideWalkUi() {
  guide.classList.add('hidden')
  interaction.classList.add('hidden')
  reticle.classList.add('hidden')
  mobileUi.classList.add('hidden')
  closeGuide()
}

function restoreWalkUi() {
  guide.classList.remove('hidden')

  if (isMobile) {
    mobileUi.classList.remove('hidden')
  } else {
    reticle.classList.remove('hidden')
  }

  updateInteraction()
}

/* =========================================================
   WALK
   ========================================================= */

let walkPhase = 0

function updateMobileWalk(delta: number) {
  if (!autoWalking || !routeTarget) return false

  const waypoint = route[routeIndex]

  if (!waypoint) {
    stopRoute()
    return false
  }

  const direction = waypoint.clone().sub(camera.position)
  direction.y = 0

  const d = direction.length()

  if (d < .42) {
    routeIndex++

    if (routeIndex >= route.length) {
      camera.position.x = routeTarget.position.x
      camera.position.z = routeTarget.position.z

      const arrived = routeTarget
      stopRoute()

      showMessage('ARRIVED', arrived.name, 1800)
      updateInteraction()
    }

    return true
  }

  direction.normalize()

  const finalLeg = routeIndex === route.length - 1
  const speed = finalLeg && d < 5 ? 2.8 : 4.5

  camera.position.addScaledVector(
    direction,
    Math.min(speed * delta, d)
  )

  walkPhase += delta * speed * 1.7

  return true
}

function updateWalk(delta: number) {
  if (!entered || mode !== 'walk') return

  let moving = false

  if (isMobile) {
    moving = updateMobileWalk(delta)
  } else {
    let f = 0
    let s = 0

    if (movement.forward) f += 1
    if (movement.back) f -= 1
    if (movement.right) s += 1
    if (movement.left) s -= 1

    moving = f !== 0 || s !== 0

    if (moving) {
      const forward = new THREE.Vector3(
        -Math.sin(yaw),
        0,
        -Math.cos(yaw)
      )

      const right = new THREE.Vector3(
        Math.cos(yaw),
        0,
        -Math.sin(yaw)
      )

      const direction = new THREE.Vector3()
        .addScaledVector(forward, f)
        .addScaledVector(right, s)

      if (direction.lengthSq() > 1) {
        direction.normalize()
      }

      const speed = movement.run ? 8.5 : 5.1

      camera.position.addScaledVector(
        direction,
        speed * delta
      )

      walkPhase += delta * speed * 1.7
    }
  }

  camera.position.x = THREE.MathUtils.clamp(
    camera.position.x,
    -48,
    48
  )

  camera.position.z = THREE.MathUtils.clamp(
    camera.position.z,
    -210,
    20
  )

  const bob = moving
    ? Math.sin(walkPhase) * .035
    : 0

  camera.position.y = THREE.MathUtils.lerp(
    camera.position.y,
    1.72 + bob,
    .16
  )

  camera.rotation.set(pitch, yaw, 0)

  updateInteraction()
  updateGuide()
}

function updateGuide() {
  const stop = stops[guideIndex]
  if (!stop) return

  const from = new THREE.Vector3(
    camera.position.x,
    0,
    camera.position.z
  )

  const to = new THREE.Vector3(
    stop.position.x,
    0,
    stop.position.z
  )

  guideName.textContent = stop.name
  guideDistance.textContent = `${Math.round(from.distanceTo(to))}m`
  guideState.textContent = autoWalking ? 'WALKING' : 'OPEN'

  const dir = to.clone().sub(from).normalize()

  const forward = new THREE.Vector3(
    -Math.sin(yaw),
    0,
    -Math.cos(yaw)
  )

  const cross =
    forward.x * dir.z -
    forward.z * dir.x

  const dot = THREE.MathUtils.clamp(
    forward.dot(dir),
    -1,
    1
  )

  guideArrow.style.transform =
    `rotate(${Math.atan2(cross, dot)}rad)`
}

/* =========================================================
   BENCH
   ========================================================= */

let benchStarted = 0
let benchMessageA = false
let benchMessageB = false

function startBench() {
  mode = 'bench'
  rememberPlace('THE BENCH')
  stopRoute()
  clearMovement()

  if (document.pointerLockElement) {
    document.exitPointerLock()
  }

  benchStarted = performance.now()
  benchMessageA = false
  benchMessageB = false

  hideWalkUi()
  benchUi.classList.remove('hidden')

  benchNote.textContent =
    memory.benchSeconds > 1
      ? `PREVIOUS OCCUPANCY ${formatDuration(memory.benchSeconds)}`
      : 'PLEASE REMAIN SEATED'
}

function updateBench() {
  const elapsed = (performance.now() - benchStarted) / 1000

  camera.position.lerp(
    new THREE.Vector3(-10.5, 1.25, -50),
    .08
  )

  camera.lookAt(new THREE.Vector3(-1, 2, -88))

  benchTime.textContent = formatDuration(elapsed)

  if (elapsed > 10 && !benchMessageA) {
    benchMessageA = true

    showMessage(
      'PARK NOTICE 04',
      'PLEASE DO NOT LEAVE PERSONAL TIME UNATTENDED.',
      5000
    )

    audioPulse(280, .8, .035)
  }

  if (elapsed > 20 && !benchMessageB) {
    benchMessageB = true

    showMessage(
      'THE BENCH',
      memory.benchVisits > 0
        ? `PREVIOUS OCCUPANCY ${formatDuration(memory.benchSeconds)} / CLAIMANT: PRESENT`
        : 'OCCUPANCY RECORD CREATED.',
      5000
    )
  }

  if (elapsed >= 30) {
    stopBench()
  }
}

function stopBench() {
  if (mode !== 'bench') return

  const elapsed = (performance.now() - benchStarted) / 1000

  memory.benchSeconds += elapsed
  memory.benchVisits += 1
  saveMemory()

  benchUi.classList.add('hidden')
  mode = 'walk'

  camera.position.set(-10.5, 1.72, -47)
  yaw = Math.PI
  pitch = 0

  restoreWalkUi()

  if (isMobile) {
    setTimeout(openGuide, 800)
  }
}

/* =========================================================
   LOST & FOUND
   ========================================================= */

function useLostFound() {
  rememberPlace('LOST & FOUND')

  if (memory.foundItems.includes('ITEM 0317')) {
    showMessage(
      'ITEM 0317',
      'STATUS: CLAIMED / CLAIMANT: PRESENT',
      5000
    )
    return
  }

  memory.foundItems.push('ITEM 0317')
  saveMemory()

  if (lostItem) {
    scene.remove(lostItem)
    lostItem.geometry.dispose()
    lostItem = null
  }

  showMessage(
    'LOST & FOUND',
    'ITEM 0317 / STATUS: CLAIMED / CLAIMANT: PRESENT',
    5200
  )

  buildDestinationList()
}

/* =========================================================
   FERRIS
   ========================================================= */

let ferrisRotation = 0
let ferrisStart = 0
let ferrisBase = 0
let ferrisMidMessage = false
let currentCabin = 7

function startFerris() {
  mode = 'ferris'
  rememberPlace('FERRIS WHEEL')
  stopRoute()
  clearMovement()

  currentCabin =
    memory.ferrisCabins.length > 0
      ? memory.ferrisCabins[memory.ferrisCabins.length - 1]
      : 7

  memory.ferrisRides += 1
  memory.ferrisCabins.push(currentCabin)
  saveMemory()

  ferrisStart = performance.now()
  ferrisBase = ferrisRotation
  ferrisMidMessage = false

  cabinNumber.textContent =
    String(currentCabin).padStart(2, '0')

  ferrisSub.textContent =
    memory.ferrisRides > 1
      ? 'WELCOME BACK.'
      : 'ONE REVOLUTION.'

  hideWalkUi()
  ferrisUi.classList.remove('hidden')

  if (document.pointerLockElement) {
    document.exitPointerLock()
  }
}

function updateFerrisRide() {
  const elapsed = (performance.now() - ferrisStart) / 1000
  const duration = 42
  const progress = Math.min(elapsed / duration, 1)

  const angle =
    ferrisBase +
    progress * Math.PI * 2

  camera.position.set(
    ferrisCenter.x + .3,
    ferrisCenter.y + Math.cos(angle) * ferrisRadius - .2,
    ferrisCenter.z + Math.sin(angle) * ferrisRadius
  )

  camera.lookAt(new THREE.Vector3(0, 4, -105))

  ferrisHeight.textContent =
    `${Math.max(0, Math.round(camera.position.y))}m`

  if (progress > .47 && !ferrisMidMessage) {
    ferrisMidMessage = true

    showMessage(
      'FERRIS WHEEL',
      `DISTANCE FROM FIRST VISIT: ${Math.max(
        0,
        Math.floor(
          (Date.now() - new Date(memory.firstVisit).getTime()) /
          86400000
        )
      )} DAYS`,
      5200
    )

    audioPulse(190, 1.2, .03)
  }

  if (progress >= 1) {
    finishFerris()
  }
}

function finishFerris() {
  ferrisUi.classList.add('hidden')
  mode = 'walk'

  camera.position.set(-17, 1.72, -82)
  yaw = Math.PI
  pitch = 0

  restoreWalkUi()

  showMessage(
    'FERRIS WHEEL',
    `CABIN ${String(currentCabin).padStart(2, '0')} / ONE REVOLUTION COMPLETED.`,
    3500
  )

  if (isMobile) setTimeout(openGuide, 3800)
}

/* =========================================================
   CINEMA
   ========================================================= */

let cinemaStarted = 0
let cinemaStage = -1

function cinemaProgram() {
  const minute = new Date().getMinutes()
  const slot = Math.floor(minute / 10) % 3

  if (slot === 0) return 'BEFORE'
  if (slot === 1) return 'DURING'
  return 'AFTER'
}

function startCinema() {
  mode = 'cinema'
  rememberPlace('CINEMA')
  stopRoute()
  clearMovement()

  memory.cinemaSeen += 1
  saveMemory()

  cinemaStarted = performance.now()
  cinemaStage = -1

  hideWalkUi()
  cinemaUi.classList.remove('hidden')

  updateCinema(true)

  if (document.pointerLockElement) {
    document.exitPointerLock()
  }
}

function updateCinema(force = false) {
  const elapsed = (performance.now() - cinemaStarted) / 1000
  const stage = Math.floor(elapsed / 5)

  if (!force && stage === cinemaStage) return

  cinemaStage = stage

  const program = cinemaProgram()

  const scenes = [
    {
      kicker: 'TONIGHT',
      title: program,
      copy: `SCREENING ${String(memory.cinemaSeen).padStart(2, '0')} / PLEASE REMAIN UNTIL THE RECORD ENDS.`,
    },
    {
      kicker: 'CAMERA 01 / ENTRANCE',
      title: `VISIT ${String(memory.visitCount).padStart(2, '0')}`,
      copy: 'RECORDED BEFORE ADMISSION.',
    },
    {
      kicker: 'CAMERA 04 / THE BENCH',
      title: formatDuration(memory.benchSeconds),
      copy:
        memory.benchSeconds > 0
          ? 'OCCUPANCY FOUND.'
          : 'NO OCCUPANCY FOUND.',
    },
    {
      kicker: 'CAMERA 07 / LOST & FOUND',
      title: itemClaimed ? 'CLAIMED' : 'UNCLAIMED',
      copy: 'ITEM 0317.',
    },
    {
      kicker: 'CAMERA 12 / NOW',
      title: `${memory.nowRides} RIDES`,
      copy: 'THIS FILM WAS RECORDED DURING YOUR VISIT.',
    },
  ]

  const frame = scenes[Math.min(stage, scenes.length - 1)]

  filmKicker.textContent = frame.kicker
  filmTitle.textContent = frame.title
  filmCopy.textContent = frame.copy

  rememberSentence(`${frame.kicker}: ${frame.copy}`)
}

cinemaLeave.addEventListener('click', () => {
  cinemaUi.classList.add('hidden')
  mode = 'walk'

  camera.position.set(13.5, 1.72, -99)
  yaw = Math.PI
  pitch = 0

  restoreWalkUi()

  if (isMobile) setTimeout(openGuide, 600)
})

/* =========================================================
   HOTEL
   ========================================================= */

function updateHotelUi() {
  roomNumber.textContent = String(memory.hotelRoom)

  hotelLight.textContent =
    `LIGHT / ${memory.hotelLight ? 'ON' : 'OFF'}`

  hotelCurtain.textContent =
    `CURTAIN / ${memory.hotelCurtain ? 'OPEN' : 'CLOSED'}`

  hotelTV.textContent =
    `TELEVISION / ${memory.hotelTV ? 'ON' : 'OFF'}`

  hotelRecord.textContent =
    memory.visitCount > 1
      ? `ROOM ${memory.hotelRoom} WAS LEFT ${
          memory.hotelLight ? 'WITH THE LIGHT ON' : 'IN DARKNESS'
        }. THE ROOM HAS BEEN KEPT.`
      : `ROOM ${memory.hotelRoom}. CHECKOUT NOT REQUIRED.`

  if (memory.hotelTV) {
    hotelTVScreen.classList.remove('hidden')

    hotelTVScreen.textContent =
`CAMERA 04 / ENTRANCE

VISITOR ${String(memory.visitCount).padStart(2, '0')}
RECORDED: 6 MINUTES BEFORE ARRIVAL

LOST & FOUND: ${itemClaimed ? 'CLAIMED' : 'UNCLAIMED'}
NOW RIDES: ${memory.nowRides}
BENCH: ${formatDuration(memory.benchSeconds)}`
  } else {
    hotelTVScreen.classList.add('hidden')
  }
}

function startHotel() {
  mode = 'hotel'
  rememberPlace('THE HOTEL')
  stopRoute()
  clearMovement()

  hideWalkUi()
  hotelUi.classList.remove('hidden')

  updateHotelUi()

  if (document.pointerLockElement) {
    document.exitPointerLock()
  }
}

hotelLight.addEventListener('click', () => {
  memory.hotelLight = !memory.hotelLight
  saveMemory()
  updateHotelUi()
  audioPulse(memory.hotelLight ? 520 : 210, .12, .025)
})

hotelCurtain.addEventListener('click', () => {
  memory.hotelCurtain = !memory.hotelCurtain
  saveMemory()
  updateHotelUi()
})

hotelTV.addEventListener('click', () => {
  memory.hotelTV = !memory.hotelTV
  saveMemory()
  updateHotelUi()
  audioPulse(110, .3, .025)
})

hotelLeave.addEventListener('click', () => {
  hotelUi.classList.add('hidden')
  mode = 'walk'

  camera.position.set(17, 1.72, -121)
  yaw = Math.PI
  pitch = 0

  restoreWalkUi()

  showMessage(
    `ROOM ${memory.hotelRoom}`,
    'CHECKOUT NOT REQUIRED.',
    3000
  )

  if (isMobile) setTimeout(openGuide, 3300)
})

/* =========================================================
   CLOSED / 03:17
   ========================================================= */

function useClosed() {
  rememberPlace('CLOSED')

  if (!closedOpen) {
    showMessage(
      'CLOSED',
      'OPENING CONDITION: UNKNOWN',
      4200
    )
    return
  }

  const text =
    itemClaimed
      ? '03:17 / ITEM 0317 HAS BEEN HERE BEFORE YOU.'
      : '03:17 / NOTHING HAS BEEN CLAIMED YET.'

  showMessage(
    '03:17',
    text,
    6000
  )
}

/* =========================================================
   STATION
   ========================================================= */

function startStation() {
  mode = 'station'
  rememberPlace('STATION')
  stopRoute()
  clearMovement()

  hideWalkUi()
  stationUi.classList.remove('hidden')

  const now = new Date()

  homeTime.textContent =
    `${String(now.getHours()).padStart(2, '0')}:${String(
      (now.getMinutes() + 7) % 60
    ).padStart(2, '0')}`

  yesterdayTime.textContent =
    `${String(now.getHours()).padStart(2, '0')}:${String(
      (now.getMinutes() + 18) % 60
    ).padStart(2, '0')}`

  if (document.pointerLockElement) {
    document.exitPointerLock()
  }
}

stationLeave.addEventListener('click', () => {
  stationUi.classList.add('hidden')
  mode = 'walk'

  camera.position.set(14, 1.72, -171)
  yaw = Math.PI
  pitch = 0

  restoreWalkUi()

  if (isMobile) setTimeout(openGuide, 500)
})

document
  .querySelectorAll<HTMLButtonElement>('[data-train]')
  .forEach((button) => {
    button.addEventListener('click', () => {
      const train = button.dataset.train

      if (train === 'HOME') {
        memory.stationTrips += 1
        saveMemory()

        stationUi.classList.add('hidden')
        mode = 'walk'

        camera.position.set(0, 1.72, 4)
        yaw = Math.PI
        pitch = 0

        restoreWalkUi()

        showMessage(
          'HOME',
          'THIS TRAIN TERMINATES BEFORE THE EXIT.',
          4200
        )

        return
      }

      if (train === 'YESTERDAY') {
        if (memory.visitCount < 2) {
          showMessage(
            'STATION',
            'YESTERDAY HAS NOT ARRIVED YET.',
            4200
          )
          return
        }

        startYesterday()
        return
      }

      showMessage(
        'PLATFORM',
        'SERVICE INFORMATION NOT AVAILABLE.',
        4200
      )
    })
  })

/* =========================================================
   YESTERDAY
   ========================================================= */

let yesterdayStarted = 0

function startYesterday() {
  stationUi.classList.add('hidden')

  mode = 'yesterday'
  memory.stationTrips += 1
  memory.yesterdayTrips += 1
  saveMemory()

  yesterdayStarted = performance.now()
  yesterdayUi.classList.remove('hidden')

  audioPulse(90, 1.4, .05)
}

function updateYesterday() {
  const elapsed =
    (performance.now() - yesterdayStarted) / 1000

  const duration = 20
  const progress = Math.min(elapsed / duration, 1)

  const z = THREE.MathUtils.lerp(-177, 7, progress)

  camera.position.set(9.5, 2.4, z)
  camera.lookAt(new THREE.Vector3(0, 2, z - 12))

  if (elapsed < 5) {
    yesterdayRecord.textContent =
      `VISIT ${String(Math.max(1, memory.visitCount - 1)).padStart(2, '0')}`
  } else if (elapsed < 10) {
    yesterdayRecord.textContent =
      `THE BENCH / ${formatDuration(memory.benchSeconds)}`
  } else if (elapsed < 15) {
    yesterdayRecord.textContent =
      `ITEM 0317 / ${itemClaimed ? 'CLAIMED' : 'UNCLAIMED'}`
  } else {
    yesterdayRecord.textContent =
      `NOW / ${Math.max(0, memory.nowRides - 1)} RIDES`
  }

  if (progress >= 1) {
    yesterdayUi.classList.add('hidden')
    mode = 'walk'

    camera.position.set(0, 1.72, 5)
    yaw = Math.PI
    pitch = 0

    restoreWalkUi()

    showMessage(
      'STATION',
      'YESTERDAY TERMINATES HERE.',
      4000
    )

    if (isMobile) setTimeout(openGuide, 4300)
  }
}

/* =========================================================
   NOW
   ========================================================= */

let nowStarted = 0
let nowProgress = 0
let nowStage = -1

function startNow() {
  mode = 'now'
  rememberPlace('NOW')
  stopRoute()
  clearMovement()

  memory.nowRides += 1
  memory.nowRideRecords.push({
    visit: memory.visitCount,
    date: new Date().toISOString(),
  })
  saveMemory()

  nowStarted = performance.now()
  nowProgress = 0
  nowStage = -1

  hideWalkUi()
  nowUi.classList.remove('hidden')

  nowSub.textContent =
    memory.nowRides > 1
      ? `RIDE ${String(memory.nowRides).padStart(2, '0')} / PREVIOUS RECORD FOUND`
      : 'RESTRAINT LOCKED'

  if (document.pointerLockElement) {
    document.exitPointerLock()
  }

  audioPulse(70, 1.5, .06)
}

function nowReadout(elapsed: number) {
  if (elapsed < 3) return `${Math.round(8 + elapsed * 9)} km/h`
  if (elapsed < 6) return `${Math.round(35 + (elapsed - 3) * 12)} km/h`
  if (elapsed < 9) return `${Math.round(72 + (elapsed - 6) * 18)} km/h`
  if (elapsed < 12) return `${Math.round(126 + (elapsed - 9) * 29)} km/h`
  if (elapsed < 15) return `${Math.round(214 + (elapsed - 12) * 89)} km/h`
  if (elapsed < 16.2) return '—'
  if (elapsed < 18) return '3 SECONDS AGO'
  if (elapsed < 19.8) return '12 SECONDS AGO'
  if (elapsed < 21.6) return '2 MINUTES AGO'
  if (elapsed < 23.4) return 'BEFORE YOU ENTERED'
  if (elapsed < 25.2) return 'YESTERDAY'
  if (elapsed < 27) return `VISIT ${String(memory.visitCount).padStart(2, '0')}`
  return ''
}

function updateNow(delta: number) {
  const elapsed = (performance.now() - nowStarted) / 1000

  let speed = .017

  if (elapsed > 4) speed = .025
  if (elapsed > 8) speed = .038
  if (elapsed > 12) speed = .055
  if (elapsed > 16) speed = .078
  if (elapsed > 20) speed = .11

  nowProgress = (nowProgress + speed * delta) % 1

  const p = nowCurve.getPointAt(nowProgress)
  const ahead = nowCurve.getPointAt((nowProgress + .008) % 1)

  const shakeStrength =
    THREE.MathUtils.clamp((elapsed - 5) / 15, 0, 1)

  const shake =
    Math.sin(elapsed * 48) *
    .018 *
    shakeStrength

  camera.position.copy(p)
  camera.position.y += .72 + shake

  camera.lookAt(
    ahead.clone().add(new THREE.Vector3(0, .55, 0))
  )

  const targetFov =
    elapsed > 19
      ? 99
      : elapsed > 15
        ? 91
        : elapsed > 10
          ? 78
          : 64

  camera.fov = THREE.MathUtils.lerp(
    camera.fov,
    targetFov,
    .05
  )

  camera.updateProjectionMatrix()

  nowSpeed.textContent = nowReadout(elapsed)

  const stage = Math.floor(elapsed / 4)

  if (stage !== nowStage) {
    nowStage = stage
    audioPulse(
      80 + Math.min(stage, 8) * 35,
      .25,
      .035
    )
  }

  if (elapsed >= 27 && elapsed < 29.5) {
    nowUi.classList.add('hidden')
    nowFlash.classList.remove('hidden')
    nowFlash.style.opacity = '1'
    nowFlash.style.transform = 'scale(1)'
  }

  if (elapsed >= 29.5 && elapsed < 31.5) {
    const t = (elapsed - 29.5) / 2

    nowFlash.style.opacity = `${1 - t}`
    nowFlash.style.transform = `scale(${1 - t * .78})`
  }

  if (elapsed >= 31.5) {
    finishNow()
  }
}

function finishNow() {
  nowFlash.classList.add('hidden')
  nowUi.classList.add('hidden')

  mode = 'walk'

  camera.position.set(0, 1.72, -201)
  camera.fov = 64
  camera.updateProjectionMatrix()

  yaw = Math.PI
  pitch = 0

  restoreWalkUi()

  showMessage(
    'NOW',
    memory.nowRides > 1
      ? `RIDE ${String(memory.nowRides).padStart(2, '0')} REMEMBERS THE LAST ONE.`
      : 'THANK YOU FOR RIDING NOW. THE RIDE HAS ALREADY BEGUN.',
    6000
  )

  if (isMobile) setTimeout(openGuide, 6300)
}

/* =========================================================
   EXIT
   ========================================================= */

function leavePark() {
  mode = 'exit'
  rememberPlace('EXIT')
  stopRoute()
  clearMovement()

  if (document.pointerLockElement) {
    document.exitPointerLock()
  }

  hideWalkUi()
  parkId.classList.add('hidden')

  memory.exitTimes.push(new Date().toISOString())

  const seenThisLife = new Set(memory.placesSeen)

  const missed = ALL_PLACES.filter(
    (place) => !seenThisLife.has(place)
  )

  memory.placesMissed = Array.from(
    new Set([...memory.placesMissed, ...missed])
  )

  saveMemory()

  const seconds =
    (performance.now() - visitStartedAt) / 1000

  statVisit.textContent =
    String(memory.visitCount).padStart(2, '0')

  statSaw.textContent =
    String(memory.placesSeen.length).padStart(2, '0')

  statMissed.textContent =
    String(missed.length).padStart(2, '0')

  statTook.textContent =
    String(memory.foundItems.length).padStart(2, '0')

  statLeft.textContent =
    String(memory.droppedItems.length).padStart(2, '0')

  statTime.textContent = formatDuration(seconds)

  exitUi.classList.remove('hidden')
}

returnPark.addEventListener('click', () => {
  exitUi.classList.add('hidden')

  mode = 'walk'
  camera.position.set(0, 1.72, 4)
  yaw = Math.PI
  pitch = 0

  parkId.classList.remove('hidden')
  restoreWalkUi()

  showMessage(
    'PARK NOTICE',
    'DEPARTURE NOT CONFIRMED.',
    4200
  )

  if (isMobile) setTimeout(openGuide, 4500)
})

/* =========================================================
   ENTER
   ========================================================= */

function enterPark() {
  if (entered) return

  entered = true
  mode = 'walk'
  visitStartedAt = performance.now()

  startAudio()

  camera.position.set(0, 1.72, 17)
  yaw = 0
  pitch = 0

  arrival.classList.add('leaving')

  parkId.classList.remove('hidden')
  guide.classList.remove('hidden')

  if (isMobile) {
    mobileUi.classList.remove('hidden')
  } else {
    reticle.classList.remove('hidden')
  }

  const opening =
    memory.visitCount > 1
      ? 'THE PARK REMEMBERS THAT YOU CAME BACK.'
      : 'THE PARK IS OPEN.'

  showMessage(
    `VISIT ${String(memory.visitCount).padStart(2, '0')}`,
    opening,
    3500
  )

  setTimeout(() => {
    arrival.classList.add('hidden')

    if (isMobile) {
      setTimeout(openGuide, 350)
    }
  }, 950)
}

admit.addEventListener('click', enterPark)

/* =========================================================
   PARK CLOCK
   ========================================================= */

let lastDisplayedMinute = -1
let skippedMinute = false

function updateParkClock() {
  const first = new Date(memory.firstVisit).getTime()

  const elapsedDays =
    Math.floor((Date.now() - first) / 86400000)

  const drift =
    memory.parkClockOffset * 60000 +
    elapsedDays * 17 * 60000

  const parkNow = new Date(Date.now() + drift)

  let minute = parkNow.getMinutes()

  if (
    minute !== lastDisplayedMinute &&
    minute % 17 === 0 &&
    !skippedMinute
  ) {
    minute = (minute + 1) % 60
    skippedMinute = true
  } else if (minute % 17 !== 0) {
    skippedMinute = false
  }

  lastDisplayedMinute = parkNow.getMinutes()

  parkClock.textContent =
    `${String(parkNow.getHours()).padStart(2, '0')}:` +
    `${String(minute).padStart(2, '0')}:` +
    `${String(parkNow.getSeconds()).padStart(2, '0')}`
}

/* =========================================================
   PA SYSTEM
   ========================================================= */

let paPlayed = false
let enteredAt = 0

function updatePA() {
  if (!entered || paPlayed) return

  const elapsed = (performance.now() - enteredAt) / 1000

  if (elapsed > 75) {
    paPlayed = true

    showMessage(
      'PARK ANNOUNCEMENT',
      'THE PARK WILL REMAIN OPEN UNTIL ALL VISITORS HAVE LEFT. THERE ARE CURRENTLY NO VISITORS IN THE PARK.',
      9000
    )

    audioPulse(420, .5, .025)
  }
}

/* =========================================================
   AMBIENT MOTION
   ========================================================= */

function updateFerrisAmbient(delta: number) {
  ferrisRotation += delta * .04

  gondolas.forEach((gondola, index) => {
    const angle =
      (index / gondolas.length) * Math.PI * 2 +
      ferrisRotation

    gondola.position.set(
      0,
      Math.cos(angle) * ferrisRadius,
      Math.sin(angle) * ferrisRadius
    )

    gondola.rotation.set(0, 0, 0)
  })
}

function updateLights(time: number) {
  parkLights.forEach((light, index) => {
    if (index % 5 !== 0) return

    const flicker =
      Math.sin(time * .002 + index * 4.7) > .988
        ? .2
        : 1

    light.intensity = 6.5 * flicker
  })
}

/* =========================================================
   LOOP
   ========================================================= */

let last = performance.now()
let clockAccumulator = 0

function animate(time: number) {
  const delta = THREE.MathUtils.clamp(
    (time - last) / 1000,
    0,
    .04
  )

  last = time

  updateFerrisAmbient(delta)
  updateLights(time)

  if (mode === 'walk') updateWalk(delta)
  if (mode === 'bench') updateBench()
  if (mode === 'ferris') updateFerrisRide()
  if (mode === 'cinema') updateCinema()
  if (mode === 'yesterday') updateYesterday()
  if (mode === 'now') updateNow(delta)

  updatePA()

  clockAccumulator += delta

  if (clockAccumulator > .35) {
    clockAccumulator = 0
    updateParkClock()
  }

  renderer.render(scene, camera)
}

enteredAt = performance.now()
updateParkClock()
renderer.setAnimationLoop(animate)

/* =========================================================
   RESIZE
   ========================================================= */

window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()

  renderer.setSize(innerWidth, innerHeight)

  renderer.setPixelRatio(
    Math.min(devicePixelRatio, isMobile ? 1.2 : 1.5)
  )
})