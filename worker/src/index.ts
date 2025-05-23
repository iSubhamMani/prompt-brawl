import dotenv from "dotenv";
import RedisService from "./services/Redis";
import AiService from "./services/AiService";
dotenv.config();

const redis = new RedisService();
const ai = new AiService(redis);

function newRound(round: number) {
  if (round >= 3) return false;
  else return true;
}

interface JudgeResponse {
  winner?: string;
  reason?: string;
  newChallenge?: string;
}

redis.Subscriber.on("message", (channel, message) => {
  console.log("Received message: ", channel, message);
  switch (channel) {
    case "game:initialChallenge":
      generateInitialChallenge(message);
      break;
  }
});

async function generateInitialChallenge(matchId: string) {
  console.log("Generating initial challenge for match: ", matchId);
  try {
    console.log(typeof matchId);
    const matchDetails = await redis.Store.get(String(matchId));
    if (!matchDetails) {
      console.log("Match not found in store");
      return;
    }
    console.log("Match found for initial challenge: ", matchDetails);

    const parsedMatchDetails = JSON.parse(matchDetails);

    const res = await ai.generateChallenge(matchId as string);
    if (res) {
      await redis.Store.set(
        matchId,
        JSON.stringify({
          ...parsedMatchDetails,
          roundDetails: {
            1: {
              challenge: res.newChallenge,
              responses: {},
              winner: "",
            },
          },
          currentRound: 1,
        }),
        "KEEPTTL"
      );
    }

    console.log("Initial challenge generated: ", res.newChallenge);

    await redis.Publisher.publish("game:initialChallengeGenerated", matchId);
  } catch (error) {
    console.log(error);
  }
}

async function handleRoundJudging(
  matchDetails: string
): Promise<JudgeResponse> {
  const parsedMatchDetails = JSON.parse(matchDetails);
  const { currentRound, roundDetails, players, matchId } = parsedMatchDetails;

  const res = await ai.judgeRound(roundDetails[currentRound]);
  let responseToSend: JudgeResponse = {};

  if (newRound(currentRound)) {
    // generate new challenge(
    const newChallenge = await ai.generateChallenge(matchId as string);
    if (newChallenge) {
      responseToSend = {
        ...responseToSend,
        newChallenge: newChallenge.newChallenge,
      };
    }
  }

  if (res) {
    responseToSend = {
      ...responseToSend,
      ...res,
    };
  }

  return responseToSend;
}

async function listenToJudgeQueue() {
  while (true) {
    const message = await redis.Queue.blpop("game:judgeQueue", 0);
    if (message) {
      const matchId = message[1];
      const matchDetails = await redis.Store.get(matchId);

      if (!matchDetails) {
        console.log("Match not found in store");
        continue;
      }

      console.log("Match found for judging: ", matchId);

      const response = await handleRoundJudging(matchDetails);

      let { currentRound, roundDetails } = JSON.parse(matchDetails);

      // update match state
      roundDetails[currentRound].winner = response.winner;
      const newRound = currentRound + 1;
      currentRound = newRound;

      if (response.newChallenge) {
        roundDetails[newRound] = {
          challenge: response.newChallenge,
          responses: {},
          winner: "",
        };
      }

      await redis.Store.set(
        matchId,
        JSON.stringify({
          ...JSON.parse(matchDetails),
          roundDetails,
          currentRound,
        }),
        "KEEPTTL"
      );

      const responseToSend = {
        matchId,
        newRound,
        winner: response.winner,
        reason: response.reason,
        newChallenge: response.newChallenge,
      };

      redis.Publisher.publish(
        "game:judgeComplete",
        JSON.stringify(responseToSend)
      );
    }
  }
}

listenToJudgeQueue();
