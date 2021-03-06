const { loadInput, fn } = require('./lib.js')
const { pipe, map, autoPartial: curry } = fn

// Day 10b
// Functional JS
// - only pure functions
// - no mutable state
// - no loops
// - ifs return from all branches (because no if expressions)
// This was hard. Static types wold have saved a lot of frustration..
// Pattern matching, Object spread and immutable Arrays would have for a cleaner solution
// Mutable state would have been a lot quicker!

// Part II adds a cleaner state update pattern (by bringing schedued
// actions into the state, the `settle` logic becomes trivial and the
// "did I take this action"? check becomes explicit), and adds the "output"
// part of the puzzle.

//
// Input
//
function parse (line) {
  // cheeky let because we don't have pattern matching
  /* eslint-disable no-cond-assign */
  let match
  if (match = line.match(/value (\d+) goes to bot (\d+)/)) {
    const [, value, bot] = match
    return { type: 'INPUT', bot, value: int(value) }
  } else if (match = line.match(/bot (\d+) gives low to (\w+) (\d+) and high to (\w+) (\d+)/)) {
    const [, bot, lowType, lowId, highType, highId] = match
    return { type: 'GIVE', bot, lowType, lowId: lowId, highType, highId: highId }
  } else {
    throw new Error(`Bad line: ${line}`)
  }
  /* eslint-enable */
}

//
// Utils
//
function int (intString) {
  return parseInt(intString, 10)
}

function assign (source, ...deltas) {
  return Object.assign({}, source, ...deltas)
}

//
// Bot logic
//

// The main state transfer function. Similar to Redux's reducers and Elm's foldp.
// This is an unusual case because the actions themselves are in state; we need to
//  save them for a future run if they could not be consumed (i.e. a GIVE action
// when the source bot has < 2 values).
// State -> Action -> State
function updateState (state, action) {
  switch (action.type) {
    case 'INPUT':
      return getInput(state, action)
    case 'GIVE':
      return give(state, action)
    default:
      throw new Error('bad action')
  }
}

// Actions -> Action -> Action
// return the list of actions with `completedAction` removed, to mark it as complete.
function consumeAction (actions, completedAction) {
  return actions.filter(a => a !== completedAction)
}

// execute the INPUT action and return the updated state
function getInput (state, action) {
  const updatedBot = set(getBot(state.bots, action.bot), action.value)
  const nextBots = assign(state.bots, { [updatedBot.id]: updatedBot })

  // we can always consume an INPUT action because the bot doesn't have to wait for any special state
  const actions = consumeAction(state.actions, action)
  return assign(state, { bots: nextBots, actions })
}

// execute the GIVE action and return the updated state
function give (state, action) {
  const { bots, outputs } = state
  const giver = getBot(bots, action.bot)

  if (giver.values.length < 2) {
    // console.log(`bot ${giver.id} does not have enough values to give`)
    // return the input state without consuming any actions
    return state
  }

  // distribute values to bots and outputs
  // TODO this part of the code is quite messy. Better pattern?

  const lowBot = (action.lowType === 'bot')
    ? giveFromIndex(giver, getBot(bots, action.lowId), 0)
    : null

  const highBot = (action.highType === 'bot')
    ? giveFromIndex(giver, getBot(bots, action.highId), 1)
    : null

  const lowOutput = (action.lowType === 'output')
    ? { [action.lowId]: giver.values[0] }
    : null

  const highOutput = (action.highType === 'output')
    ? { [action.highId]: giver.values[1] }
    : null

  // the giver always gives away both values
  const outGiver = assign(giver, { values: [] })

  // we met preconditions so we have consumed the "give away" action
  const nextActions = consumeAction(state.actions, action)

  const nextBots = assign(bots, { [giver.id]: outGiver }, lowBot, highBot)
  const nextOutputs = assign(outputs, lowOutput, highOutput)

  return assign(state, { bots: nextBots, actions: nextActions, outputs: nextOutputs })
}

// { id, low, high, history }
function createBot (id) {
  return { id, values: [], history: [] }
}

function getBot (bots, id) {
  return bots[id] || createBot(id)
}

// give a bot a new value, updating its low/high state. Return the new state.
function set (bot, value) {
  if (bot.values.length >= 2) {
    throw new Error(`bot ${bot.id} already has two values: ${bot.values}`)
  }

  const values = [...bot.values, value].sort((a, b) => a - b)
  const history = [...bot.history, value]

  return assign(bot, { values, history })
}

function giveFromIndex (giver, receiver, index) {
  const newReceiver = set(receiver, giver.values[index])
  return { [newReceiver.id]: newReceiver }
}

//
// Action processing logic
//
function getInitialState (actions) {
  return {
    actions: [...actions],
    bots: {},
    outputs: {}
  }
}

// process actions until we have dealt with all of them
function settle (state, iteration = 0) {
  // console.log(`SETTLE ${iteration}`, state)
  const { actions } = state

  // recursion depth sanity check
  if (actions.length === 0 || iteration > 100) {
    return state
  } else {
    const nextState = actions.reduce(updateState, state)
    return settle(nextState, iteration + 1)
  }
}

// Return the product of the last value in the outputs with the given ids
// - this is the solution for part 2
function productOutputs (outputIds, state) {
  return outputIds.reduce((product, id) => state.outputs[id] * product, 1)
}

// const input = `
// value 5 goes to bot 2
// bot 2 gives low to bot 1 and high to bot 0
// value 3 goes to bot 1
// bot 1 gives low to output 1 and high to bot 0
// bot 0 gives low to output 2 and high to output 0
// value 2 goes to bot 2`

const input = loadInput('10.txt').trim()

pipe(input.trim().split('\n'),
  map(parse),
  getInitialState,
  settle,
  curry(productOutputs)([0, 1, 2]),
  console.log
)
