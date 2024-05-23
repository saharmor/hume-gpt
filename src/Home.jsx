import { useState } from "react";

import { Bars } from "react-loader-spinner";
import { Button } from '@mui/material';

import "./App.css";

const SYSTEM_PROMPT = 'You are a helpful assistant.'
// `You will be analyzing a voice session to extract the emotions expressed at different points in time. Your task is to listen carefully to the session and identify the emotions conveyed by the speaker's tone and words.

// As you listen to the session, note down the timestamp (in "MM:SS" format) whenever you detect a change in the speaker's emotional state. For each timestamp, identify the corresponding emotion being expressed along with the words spoken in that emotion in a two elements JSON.

// Once you have finished analyzing the entire voice session, output your results in the following JSON format:

// <example>
// {
// "00:00": {"emotion": "Happy", "words": "It was so great seeing you last week"},
// "00:06": {"emotion": "Angry", "words": "But you kind of betrayed me with Sarah"},
// "00:15": {"emotion": "Disappointment", "words": "Why would you do that?"}
// }
// </example>

// In this example, the speaker starts with a happy tone for the first 6 seconds, then switches to an angry tone for the next 9 seconds, and finally ends with a confused tone.

// Please provide your output in the specified JSON format, with the keys being the timestamps and the values being the detected emotions and the spoken words for that emotion. Do not include any additional commentary or explanations in your output.

// I am going to start a new voice session with you. Ready? Output your results inside <result> tags.
// `

function Home() {
  const [currOutput, setCurrOutput] = useState({
    "00:00": { "emotion": "Happy", "words": "It was so great seeing you last week" },
    "00:06": { "emotion": "Angry", "words": "But you kind of betrayed me with Sarah" },
    "00:15": { "emotion": "Disappointment", "words": "Why would you do that?" }
  });
  const [responseText, setResponseText] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsListening(true);
    setResponseText('');

    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('API key not found. Please set OPENAI_API_KEY in your .env file.');
    }


    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: "What is the capital of France? Answer and provide a 50 words history of this city." }
          ],
          stream: true,
        }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.trim().startsWith('data:')) {
            const json = line.trim().replace('data: ', '');
            if (json !== '[DONE]') {
              const parsed = JSON.parse(json);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                result += content;
                setResponseText((prev) => prev + content);
              }
            }
          }
        }
      }
      setResponseText(result);

    } catch (error) {
      console.error('Error fetching data from OpenAI:', error);
    }
  };


  return (
    <div className="App">
      <div className="content">
        <h1 className="title">HumeGPT</h1>
        <p className="subtitle">
          An emotionally intelligent AI
        </p>

        {isListening && <Bars
          height="80"
          width="80"
          color="#A0C6FF"
          ariaLabel="bars-loading"
          wrapperStyle={{ marginRight: "20px", marginBottom: "20px" }}
          wrapperClass=""
          visible={true}
        />
        }

        {!isListening && <Button variant="contained" color="primary" onClick={handleSubmit}>
          Start session
        </Button>

        }
        {isListening &&
          <div>
            <Button variant="contained" color="warning" onClick={() => setIsListening(false)}>
              Stop session
            </Button>

            <div style={{ marginTop: "30px", marginBottom: "30px", maxWidth: "800px"}}>
              {responseText}
            </div>

            {Object.entries(currOutput).map(([timestamp, { emotion, words }], index) => (
              <div key={index}>
                <p>{timestamp} | {emotion}</p>
                <p>{words}</p>
                <br />
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}
export default Home;
