import { Box, Button, TextField } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useContext } from 'react';
import { UserPrompts } from './UserPrompts';
import { Responses } from './Responses';
import { StickyInputBox } from './StickyInput';

// this can be the parent component and we can fetch the chat here and then send them as props to the children.
// if its a old chat that also we can fetch and show
// if new chat that too we can fetch from here and send.
// Good this is the same parnet compmpoennt then.
const chatData = [
  'User: Hi, how are you?',
  "Bot: ### I'm good, thank you! \n\nI'm here to assist you with whatever you need. Whether you have a question about the weather, books, or just need general help, feel free to ask. **I'm always ready to help!** 😊",
  'User: Can you tell me about the weather?',
  'Bot: The results of the query provide a detailed overview of COVID-19 statistics across various countries. Here are some key highlights:\n\n1. **Greece**:\n   - Total Cases: 5,123\n   - Total Deaths: 210\n   - Total Recovered: 1,374\n   - Active Cases: 3,539\n   - Total Tests: 619,393\n   - Population: 10,417,673 [1].\n\n2. **Libya**:\n   - Total Cases: 4,879\n   - Total Deaths: 107\n   - Total Recovered: 652\n   - Active Cases: 4,120\n   - Total Tests: 59,699\n   - Population: 6,880,353 [1].\n\n3. **Equatorial Guinea**:\n   - Total Cases: 4,821\n   - Total Deaths: 83\n   - Total Recovered: 2,182\n   - Active Cases: 2,556\n   - Total Tests: 44,356\n   - Population: 1,407,001 [1].\n\n4. **Maldives**:\n   - Total Cases: 4,680\n   - Total Deaths: 19\n   - Total Recovered: 2,725\n   - Active Cases: 1,936\n   - Total Tests: 85,587\n   - Population: 541,448 [1].\n\n5. **Hungary**:\n   - Total Cases: 4,597\n   - Total Deaths: 600\n   - Total Recovered: 3,463\n   - Active Cases: 534\n   - Total Tests: 352,546\n   - Population: 9,657,785 [1].\n\n6. **Germany**:\n   - Total Cases: 215,210\n   - Total Deaths: 9,252\n   - Total Recovered: 196,200\n   - Active Cases: 9,758\n   - Total Tests: 8,586,648\n   - Population: 83,811,260 [1].\n\n7. **France**:\n   - Total Cases: 195,633\n   - Total Deaths: 30,312\n   - Total Recovered: 82,460\n   - Active Cases: 82,861\n   - Total Tests: 3,992,206\n   - Population: 65,288,306 .\n\nThese statistics reflect the ongoing impact of COVID-19 across different regions, highlighting the number of cases, recoveries, deaths, and testing efforts.\n\n[1] warehouse_results.txt',
  'User: Great! What about tomorrow?',
  'Bot:The results of the query provide a detailed overview of COVID-19 statistics across various countries. Here are some key highlights:\n\n1. **Greece**:\n   - Total Cases: 5,123\n   - Total Deaths: 210\n   - Total Recovered: 1,374\n   - Active Cases: 3,539\n   - Total Tests: 619,393\n   - Population: 10,417,673 [1].\n\n2. **Libya**:\n   - Total Cases: 4,879\n   - Total Deaths: 107\n   - Total Recovered: 652\n   - Active Cases: 4,120\n   - Total Tests: 59,699\n   - Population: 6,880,353 [1].\n\n3. **Equatorial Guinea**:\n   - Total Cases: 4,821\n   - Total Deaths: 83\n   - Total Recovered: 2,182\n   - Active Cases: 2,556\n   - Total Tests: 44,356\n   - Population: 1,407,001 [1].\n\n4. **Maldives**:\n   - Total Cases: 4,680\n   - Total Deaths: 19\n   - Total Recovered: 2,725\n   - Active Cases: 1,936\n   - Total Tests: 85,587\n   - Population: 541,448 [1].\n\n5. **Saudi Arabia**:\n   - Total Cases: 284,226\n   - Total Deaths: 3,055\n   - Total Recovered: 247,089\n   - Active Cases: 34,082\n   - Total Tests: 3,635,705\n   - Population: 34,865,919 [1].\n\n6. **Germany**:\n   - Total Cases: 215,210\n   - Total Deaths: 9,252\n   - Total Recovered: 196,200\n   - Active Cases: 9,758\n   - Total Tests: 8,586,648\n   - Population: 83,811,260 [1].\n\n7. **France**:\n   - Total Cases: 195,633\n   - Total Deaths: 30,312\n   - Total Recovered: 82,460\n   - Active Cases: 82,861\n   - Total Tests: 3,992,206\n   - Population: 65,288,306 [1].\n\nThese statistics reflect the ongoing impact of COVID-19 across different regions, highlighting the number of cases, recoveries, and fatalities, as well as testing efforts and population data.\n\n[1] warehouse_results.txt',
  'User: Thanks for the info!',
  'Bot:The results of the query provide a detailed overview of COVID-19 statistics across various countries. Here are some key highlights:\n\n1. **Greece**:\n   - Total Cases: 5,123\n   - Total Deaths: 210\n   - Total Recovered: 1,374\n   - Active Cases: 3,539\n   - Total Tests: 619,393\n   - Population: 10,417,673 [1].\n\n2. **Libya**:\n   - Total Cases: 4,879\n   - Total Deaths: 107\n   - Total Recovered: 652\n   - Active Cases: 4,120\n   - Total Tests: 59,699\n   - Population: 6,880,353 [1].\n\n3. **Equatorial Guinea**:\n   - Total Cases: 4,821\n   - Total Deaths: 83\n   - Total Recovered: 2,182\n   - Active Cases: 2,556\n   - Total Tests: 44,356\n   - Population: 1,407,001 [1].\n\n4. **Maldives**:\n   - Total Cases: 4,680\n   - Total Deaths: 19\n   - Total Recovered: 2,725\n   - Active Cases: 1,936\n   - Total Tests: 85,587\n   - Population: 541,448 [1].\n\n5. **Hungary**:\n   - Total Cases: 4,597\n   - Total Deaths: 600\n   - Total Recovered: 3,463\n   - Active Cases: 534\n   - Total Tests: 352,546\n   - Population: 9,657,785 [1].\n\n6. **Germany**:\n   - Total Cases: 215,210\n   - Total Deaths: 9,252\n   - Total Recovered: 196,200\n   - Active Cases: 9,758\n   - Total Tests: 8,586,648\n   - Population: 83,811,260 [1].\n\n7. **France**:\n   - Total Cases: 195,633\n   - Total Deaths: 30,312\n   - Total Recovered: 82,460\n   - Active Cases: 82,861\n   - Total Tests: 3,992,206\n   - Population: 65,288,306 .\n\nThese statistics reflect the ongoing impact of COVID-19 in various regions, highlighting the number of cases, recoveries, deaths, and testing efforts.\n\n[1] warehouse_results.txt',
  'User: Can you suggest a good book to read?',
  "Bot: Absolutely! 📚 Have you read *The Alchemist* by Paulo Coelho? It's a thought-provoking story about following your dreams and finding your purpose in life. If you're into inspiring tales with deep meaning, this book is a must-read. Also, the writing style is beautifully simple yet profound.",
  'User: I have! Any other recommendations?',
  "Bot: Great to hear you've read that! Another fantastic recommendation is *Atomic Habits* by James Clear. 🚀 This book dives deep into how small habits can lead to big changes in life. It's packed with practical tips, **scientific insights**, and actionable advice. You'll walk away with a clear understanding of how to improve yourself, one step at a time.",
  "User: Awesome, I'll check it out.",
  "Bot: Fantastic! Let me know what you think once you've read it. If you need more suggestions, feel free to ask! Remember, there's always a new adventure waiting in the pages of a great book. 📖",
];

export const ChatInterface = () => {
  const globalContext = useContext(GlobalContext);
  const { control, setValue, watch, handleSubmit, reset } = useForm({
    defaultValues: {
      prompt: '',
    },
  });
  const selectedPrompt = watch('prompt');

  const onSubmit = () => {
    alert('hello ');
  };
  return (
    <>
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Top box will have chats  */}
        <Box sx={{}}>
          {chatData.map((chat, index) => {
            if (chat.includes('User')) {
              return <UserPrompts key={index} input={chat} />;
            } else {
              return <Responses key={index} input={chat} />;
            }
          })}
        </Box>
        {/* Bottom box will have user input fixed */}
        <Box></Box>
        <StickyInputBox handleSubmit={handleSubmit} onSubmit={onSubmit} control={control} />
      </Box>
    </>
  );
};
