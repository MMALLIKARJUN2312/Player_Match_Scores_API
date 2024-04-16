const express = require('express')
const app = express()

const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

app.use(express.json())

const dbPath = path.join(__dirname, 'cricketMatchDetails.db')

let db = null

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error : ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const convertDbObjectToPlayerObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

//Get Players API :

app.get('/players/', async (request, response) => {
  const getPlayersQuery = `
        SELECT * FROM player_details;`
  const playersArray = await db.all(getPlayersQuery)
  response.send(
    playersArray.map(eachPlayer => convertDbObjectToPlayerObject(eachPlayer)),
  )
})

//Get Player API :

app.get('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const getPlayerQuery = `
    SELECT * FROM player_details
    WHERE player_id = ${playerId};`
  const player = await db.get(getPlayerQuery)
  response.send(convertDbObjectToPlayerObject(player))
})

//Update Player API :

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const {playerName} = request.body
  const updatePlayerQuery = `
    UPDATE player_details
    SET player_name = '${playerName}'
    WHERE player_id = ${playerId};`
  const dbResponse = await db.run(updatePlayerQuery)
  const dbResponseId = dbResponse.lastID
  response.send('Player Details Updated')
})

const convertDbObjectToMatchObject = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

//Get Matches API :

app.get('/matches/:matchId/', async (request, response) => {
  const {matchId} = request.params
  const getMatchesQuery = `
    SELECT * FROM match_details
    WHERE match_id = ${matchId};`
  const matchDetails = await db.get(getMatchesQuery)
  response.send(convertDbObjectToMatchObject(matchDetails))
})

//Get Matches of Player API :

app.get('/players/:playerId/matches/', async (request, response) => {
  const {playerId} = request.params
  const getplayerMatchesQuery = `
    SELECT 
      match_id,
      match,  
      year 
     FROM match_details NATURAL JOIN player_match_score
    WHERE player_id = ${playerId};`
  const matchesArray = await db.all(getplayerMatchesQuery)
  response.send(
    matchesArray.map(eachMatch => convertDbObjectToMatchObject(eachMatch)),
  )
})

//Get Players Of Match API :

app.get('/matches/:matchId/players/', async (request, response) => {
  const {matchId} = request.params
  const getMatchPlayersQuery = `
    SELECT * FROM player_match_score 
    NATURAL JOIN player_details
    WHERE match_id = ${matchId};`
  const playersArray = await db.all(getMatchPlayersQuery)
  response.send(
    playersArray.map(eachPlayer => convertDbObjectToPlayerObject(eachPlayer)),
  )
})

const convertDbObjectToPlayerStatsObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    totalScore: dbObject.totalScore,
    totalFours: dbObject.totalFours,
    totalSixes: dbObject.totalSixes,
  }
}

//Get Statistics Of Player API :

app.get('/players/:playerId/playerScores', async (request, response) => {
  const {playerId} = request.params
  const getPlayerStatsQuery = `
    SELECT player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM player_match_score NATURAL JOIN 
    player_details
    WHERE player_id = ${playerId};`
  const playerStats = await db.get(getPlayerStatsQuery)
  response.send(playerStats)
})

module.exports = app
