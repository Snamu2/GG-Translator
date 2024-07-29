const express = require('express')
const http = require('http');
const socketIo = require('socket.io');
const app = express()
const server = http.createServer(app);
const io = socketIo(server);
const helmet = require('helmet');
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { MongoClient, ObjectId } = require('mongodb');
const methodOverride = require('method-override')
const axios = require('axios');
const qs = require('qs');
const fs = require('fs');
const path = require('path');
var session = require('express-session')
require('dotenv').config();
app.use(methodOverride('_method'))
app.use(express.static(__dirname + '/public'))
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(helmet());

function generateNonce(req, res, next) {
  res.locals.nonce = uuidv4();
  next();
}
app.use(generateNonce);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://cdn.socket.io", (req, res) => `'nonce-${res.locals.nonce}'`],
        "style-src": ["'self'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", (req, res) => `'nonce-${res.locals.nonce}'`],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "img-src": ["'self'", "https://cdn.jsdelivr.net"],
      },
    },
  })
);

(function() {
  const originalLog = console.log;
  const prefix = "\x1b[1m\x1b[36m[GG]\x1b[0m";

  console.log = function(...args) {
    originalLog.apply(console, [prefix, ...args]);
  };
})();

// const openai = new OpenAI({
//     apiKey: process.env.OPENAI_API_KEY
// });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const port = process.env.PORT;

const authDB = 'authDB(Experiment)';
const authDB_post = 'post';
const mainDB = 'mainDB(Experiment)';
const mainDB_post = 'post';

// let db;
// const url = process.env.DB_URL;
// new MongoClient(url).connect().then((client)=>{
//     console.log('## DB연결성공')
//     db = client.db(authDB);
//     console.log(`## ${authDB} ✔`)
//     app.listen(port, function() {
//         console.log(`server running on port ${port}`)
//     });
// }).catch((err)=>{
//     console.log(err)
// })
server.listen(port, () => {
  console.log(`Server and Socket.io running on port ${port}`);
});


function validateName(req, res, next) {
    const { name } = req.body;

    // SQL Injection prevention
    const sqlInjectionPattern = /('|"|\;|--|\/\*|\*\/)/;
    if (sqlInjectionPattern.test(name)) {
        return res.status(400).json({ error: 'Invalid characters detected.' });
    }

    // XSS prevention
    const xssPattern = /(<script.*?>.*?<\/script>|<.*?javascript:.*?>)/i;
    if (xssPattern.test(name)) {
        return res.status(400).json({ error: 'Invalid content detected.' });
    }

    if (!name.trim()) { // 공백 칸 확인
        return res.status(400).json({ error: 'Name cannot be only whitespace.' });
    }

    if (name.length < 2 || name.length > 53) {
        return res.status(400).json({ error: 'Name must be between 2 and 50 characters long.' });
    }

    const regexSpecialChars = /[^a-zA-Z가-힣\s.]/; // 영문자, 한글, 공백, 점만 허용
    if (regexSpecialChars.test(name)) {
        return res.status(400).json({ error: 'Name cannot contain special characters or numbers.' });
    }

    const regexWhitespace = /^\s+|\s+$/; // 문자열 시작과 끝에 공백 확인
    if (regexWhitespace.test(name)) {
        return res.status(400).json({ error: 'Name cannot start or end with whitespace.' });
    }

    const regexMultipleSpaces = /\s{2,}/; // 연속된 공백 2칸 이상 확인
    if (regexMultipleSpaces.test(name)) {
        return res.status(400).json({ error: 'Name cannot have consecutive spaces.' });
    }

    console.log('## validateName Passed');

    next();
}

function isAuthCodeValid(authCodeInput) {

    // 입력 유효성 검사
    if (typeof authCodeInput !== 'string' || authCodeInput.trim() === '' || authCodeInput.length !== codeLength) {
        return false;
    }

    // if (!/^\d{6}$/.test(authCodeInput)) { // 인증 코드 형식 검증 (숫자로만 구성되어 있는지 확인)
    //     return false;
    // }

    // const { code, createdAt } = getAuthCodeFromDatabase(userId); // DB 정보

    // if (authCodeInput !== code) {
    //     return false;
    // }

    // // 인증 코드 만료 시간 검증 (예: 10분)
    // const expirationTime = 10 * 60 * 1000; // 10분을 밀리초로 변환
    // if (new Date() - createdAt > expirationTime) {
    //     return false;
    // }

    return true;
}

const codeLength = 6;

app.post('/generate-auth-code', validateName, async (req, res) => {
    const { name } = req.body;
    console.log('Name:', name);
    const uuid = uuidv4();
    console.log('Generated uuid:', uuid);
    const authCode = uuid.replace(/-/g, '').slice(0, codeLength).toUpperCase();
    console.log('Generated authentication code:', authCode);
    res.json({ authCode });
})

app.post('/check-duplicate', async (req, res, next) => {
    try {
        const { DisplayedauthCode } = req.body;

        // 입력 유효성 검사
        if (typeof DisplayedauthCode !== 'string' || DisplayedauthCode.trim() === '' || DisplayedauthCode.length !== codeLength) {
            throw new BadRequestError('Invalid DisplayedauthCode data');
        }

        // const count = await db.collection('mycollection').countDocuments({ value: DisplayedauthCode });
        const count = 0; // 임시
        res.json({ isDuplicate: count > 0 });
    } catch (error) {
        next(error);
    }
});

app.post('/verify-auth-code', async (req, res, next) => {
    const { authCodeInput } = req.body;
    try {
        if (isAuthCodeValid(authCodeInput)) {
            res.json('Authentication successful.'); // TODO : 세션 생성 + html 날리기, DB에 기록
        } else {
            throw new BadRequestError('Invalid Authentication Code. Please try again.');
        }
    } catch (error) {
        next(error);
    }
});

// 중앙화된 에러 처리 미들웨어
app.use((err, req, res, next) => {
    if (err instanceof BadRequestError) {
        return res.status(400).send({ error: err.message });
    }
    console.error('## Error:', err);
    res.status(500).send({ error: 'Internal server error' });
});

class BadRequestError extends Error {
    constructor(message) {
        super(message);
        this.name = 'BadRequestError';
    }
}


app.get('/pet', function(req, res){
    res.send('>_<');
});

app.get('/animation', (req, res) => {
    res.render('animation.ejs')
})

app.get('/list', async (req, res) => {
    let result = await db.collection(authDB_post).find().toArray()
    // res.send(result[0].title)
    res.render('list.ejs', { 글목록 : result, nonce : res.locals.nonce })
})

app.get('/write', (req, res) => {
    res.render('write.ejs')
})

app.post('/add', async (req, res) => {

    try {
        if (Object.keys(req.body).length !== 2) {
            res.send('예상하지 못한 정보가 누락 혹은 포함되어 있습니다.')
        } else if (!req.body.hasOwnProperty('title') || !req.body.hasOwnProperty('content')) {
            res.send('필수 정보가 누락되었습니다.')
        } else if (req.body.title == ''){
            res.send('작성할 제목을 입력해주세요')
        } else if (req.body.content == '') {
            res.send('작성할 내용을 입력해주세요')
        } else {
            let result = await db.collection('post').insertOne({ title : req.body.title, content : req.body.content })
            console.log(`## 새로운 document(_id : ${result.insertedId})가 다음과 같이 작성되었습니다.\ntitle : ${req.body.title}\ncontent : ${req.body.content}`)
            res.redirect('/list')
        }
    } catch (e) {
        console.log('## Error:', e.message)
        res.status(500).send('서버에러')
    }

})

app.get('/detail/:id', async (req, res) => {
    try {
        let result = await db.collection('post').findOne({ _id : new ObjectId(req.params.id) })
        // console.log(result)
        if (result == null) {
            res.status(404).send('이상한 url 입력함')
        }
        res.render('detail.ejs', { result : result })
    } catch (e) {
        console.log('## Error:', e.message)
        res.status(404).send('이상한 url 입력함')
    }
})

app.get('/edit/:id', async (req, res) => {
    try {
        let result = await db.collection('post').findOne({ _id : new ObjectId(req.params.id) })
        // console.log(result)
        if (result == null) {
            res.status(404).send('이상한 url 입력함')
        }
        res.render('edit.ejs', { result : result })
    } catch (e) {
        console.log('## Error:', e.message)
        res.status(404).send('이상한 url 입력함')
    }
})

app.put('/edit', async (req, res) => {

    try {
        if (Object.keys(req.body).length !== 3) {
            res.send('예상하지 못한 정보가 누락 혹은 포함되어 있습니다.')
        } else if (!req.body.hasOwnProperty('id') || !req.body.hasOwnProperty('title') || !req.body.hasOwnProperty('content')) {
            res.send('필수 정보가 누락되었습니다.')
        } else if (!ObjectId.isValid(req.body.id)) {
            res.send(`(${req.body.id}) 유효하지 않은 ID입니다.`)
        } else if (req.body.title == ''){
            res.send('수정할 제목을 입력해주세요')
        } else if (req.body.content == '') {
            res.send('수정할 내용을 입력해주세요')
        } else {
            let result = await db.collection('post').updateOne({ _id : new ObjectId(req.body.id) }, {$set : { title : req.body.title, content : req.body.content }})
            console.log(`## 기존 ${result.modifiedCount}개의 document(_id : ${req.body.id})가 다음과 같이 수정되었습니다.\ntitle : ${req.body.title}\ncontent : ${req.body.content}`)
            res.redirect('/list')
        }
    } catch (e) {
        console.log('## Error:', e.message)
        res.status(500).send('서버에러')
    }

})

app.delete('/delete', async (req, res) => {
    
    try {
        if (Object.keys(req.query).length !== 3) {
            res.send('예상하지 못한 정보가 누락 혹은 포함되어 있습니다.')
        } else if (!req.query.hasOwnProperty('docid') || !req.query.hasOwnProperty('doctitle') || !req.query.hasOwnProperty('doccontent')) {
            res.send('필수 정보가 누락되었습니다.')
        } else if (!ObjectId.isValid(req.query.docid)) {
            res.send(`(${req.query.docid}) 유효하지 않은 ID입니다.`)
        } else {
            let result = await db.collection('post').deleteOne({ _id : new ObjectId(req.query.docid) })
            if (result.deletedCount === 0) {
                return res.status(404).send('삭제할 문서를 찾을 수 없습니다.');
            }
            console.log(`## 기존 ${result.deletedCount}개의 다음 내용을 포함한 document(_id : ${req.query.docid})가 삭제되었습니다.\ntitle : ${req.query.doctitle}\ncontent : ${req.query.doccontent}`)
            res.send('삭제완료')
        }
    } catch (e) {
        console.log('## Error:', e.message)
        res.status(500).send('서버에러')
    }

})

app.get('/auth', (req, res) => {
    res.render('auth.ejs')
})

app.get('/auth/list', async (req, res) => {
    let result = await db.collection(authDB_post).find().toArray()
    res.render('auth_list.ejs', { 글목록 : result })
})

app.get('/time', (req, res) => {
    res.render('time.ejs', { data : new Date() })
})

app.get('/uuid/creator', (req, res) => {
    res.render('uuid_creator.ejs')
})

// app.get('/404', (req, res) => {
//     res.render('404.ejs')
// })

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

// app.get('/feedback', function(req, res){
//     res.sendFile(__dirname + '/feedback.html')
// })

app.post('/feedback/confirm', function(req, res){
    res.sendFile(__dirname + '/confirm.html')
    var date = new Date();
    var year = date.getFullYear();
    var month = ("0" + (date.getMonth()+1)).slice(-2);
    var day = ("0" + date.getDate()).slice(-2);
    var hours = ("0" + date.getHours()).slice(-2);
    var minutes = ("0" + date.getMinutes()).slice(-2);
    var seconds = ("0" + date.getSeconds()).slice(-2);
    
    var today = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    console.log(today)
    console.log(req.body.username)
    console.log(req.body.content)

    db.collection('Feedback (Experimental Version)').insertOne({ 날짜 : today, 유저명 : req.body.username, 내용 : req.body.content }, (err, result) => {
        console.log('## Feedback 데이터 저장완료');
    });
});


let Languages = '';

Languages += 'KOR(한국어): ' + '\n';
Languages += 'ENG(영어): ' + '\n';
Languages += 'JPN(일본어): ' + '\n';
Languages += 'CHS(중국어 간체): ' + '\n';
Languages += 'CHT(중국어 번체): ' + '\n';
Languages += 'VIE(베트남어): ' + '\n';
Languages += 'IND(인도네시아어): ' + '\n';
Languages += 'THA(태국어): ' + '\n';
Languages += 'DEU(독일어): ' + '\n';
Languages += 'RUS(러시아어): ' + '\n';
Languages += 'SPA(스페인어): ' + '\n';
Languages += 'ITA(이탈리아어): ' + '\n';
Languages += 'FRA(프랑스어): ' + '\n';
Languages += 'HIN(힌디어): ' + '\n';
Languages += 'ARA(아랍어): ' + '\n';
Languages += 'POR(포르투갈어): ' + '\n';
Languages += 'TUR(튀르키예어): ';

const SetLanguage = Languages;
console.log('## 언어설정 완료');

let selectedModel = 'gemini-1.5-flash-latest';

let translationResults = [];
let lastSentResults = [];

app.post('/', (req, res) => {
    let param = req.body.param;
    let model = req.query.model;
    // console.log(param);
    // console.log(SetLanguage);
    // console.log(model);
    if (model === 'gpt-3.5-turbo' || model === 'gpt-4' || model === 'gemini-1.5-flash-latest') {
        if (model === 'gpt-4') {
            selectedModel = model;
            console.log('SelectedModel: ' + selectedModel + '(임시 폐쇄)')
            console.log('txtInput: ' + param);
            return res.status(400).json({ error: 'GPT-4 Mode Temporary Closure (Causes: Function, Price)' });
        } else if (model === 'gpt-3.5-turbo') {
            return res.status(400).json({ error: 'Gemini API Dev' });
        }
        selectedModel = model;
        console.log('SelectedModel: ' + selectedModel);
    } else {
        return res.status(400).json({ error: 'Invalid model' });
    }
    if (!param || typeof param !== 'string' || param.length > 30) {
        return res.status(400).json({ error: '잘못된 입력 데이터' });
    } else {
        console.log('txtInput: ' + param);
    }

    if (model === 'gpt-3.5-turbo' || model === 'gpt-4') {
        try {
            openai.chat.completions.create({
                model: selectedModel,
                messages: [
                    { "role": "system", "content": "You are the best translator in the world. Please translate what you Languages correctly. Only send out the translated results. Detect Language -> \n\n" + SetLanguage + "\n\nBe sure to follow this form. Please maintain the fixed order."},
                    { "role": "user", "content": param }
                ],
                temperature: 0.7,
                max_tokens: 256,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
            }).then(result => {
                console.log('response:', result.choices[0].message);
                translationResults.push({ input: param, output: result.choices[0].message.content });
                res.json(result.choices[0].message.content);
                // return res.status(200).json({ success: true });
            })
        } catch (error) {
            if (error instanceof OpenAI.APIError) {
              console.error(error.status);  // e.g. 401
              console.error(error.message); // e.g. The authentication token you passed was invalid...
              console.error(error.code);  // e.g. 'invalid_api_key'
              console.error(error.type);  // e.g. 'invalid_request_error'
            } else {
              // Non-API error
              console.log(error);
            }
        }
    } else if (model === 'gemini-1.5-flash-latest') {
        const model = genAI.getGenerativeModel({
            model: selectedModel,
            systemInstruction: "You are the best translator in the world. Please translate what you Languages correctly. Only send out the translated results. Detect Language -> \n\n" + SetLanguage + "\n\nBe sure to follow this form. Please maintain the fixed order.",
        });

        model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: param,
                }
              ],
            }
          ],
          generationConfig: {
            maxOutputTokens: 256,
            temperature: 0.7,
          },
        }).then(result => {
            const response = result.response;
            const text = response.text();
            // console.log(text);
            translationResults.push({ input: param, output: text });
            res.json(text);
            // return res.status(200).json({ success: true });
        })
    } else {
        return res.status(400).json({ error: 'Invalid model' });
    }
})

app.get('/view_only', (req, res) => {
  if (translationResults.length > 0) {
    const output = translationResults[translationResults.length - 1].output || 'Null';
    res.render('view_only.ejs', { AIResult: output });
  } else {
    res.render('view_only.ejs', { AIResult: 'No results available' });
  }
});

// 클라이언트에게 번역 결과를 실시간으로 전송
io.on('connection', (socket) => {
  console.log('New client connected');

  // 클라이언트 연결 시 이전 결과 전송
  const sendInitialTranslation = () => {
    if (translationResults.length > 0) {
      const output = translationResults[translationResults.length - 1].output || 'Null';
      socket.emit('translation update', { AIResult: output });
      lastSentResults = [...translationResults];  // 초기 전송 결과 저장
    }
  };
  sendInitialTranslation();
  
  // 새로운 번역 결과가 있을 때 클라이언트에 전송
  const sendTranslation = () => {
    if (translationResults.length > 0 && !arraysEqual(lastSentResults, translationResults)) {
      const output = translationResults[translationResults.length - 1].output || 'Null';
      socket.emit('translation update', { AIResult : output });
      lastSentResults = [...translationResults];  // 전송한 결과 저장
    }
  };

  // 배열 비교 함수
  function arraysEqual(arr1, arr2) {
    return JSON.stringify(arr1) === JSON.stringify(arr2);
  }

  // 일정 간격으로 번역 결과 체크
  const interval = setInterval(sendTranslation, 700);

  socket.on('disconnect', () => {
    clearInterval(interval);
    console.log('Client disconnected');
  });
});


//
// For Discord App <==
//
app.get('/discord_selector', (req, res) => {
  res.render('discord_selector.ejs')
});

const { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder, ContextMenuCommandBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, DiscordjsErrorCodes } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const REDIRECT_URI = 'http://localhost:3000/app/discord/GGT';
// const REDIRECT_URI = 'https://ggglobaltrans.com/app/discord/GGT';

// Discord OAuth2 인증 라우트
app.get('/auth/discord/app', (req, res) => {
  const scope = 'identify+messages.read+applications.commands+dm_channels.messages.read+dm_channels.messages.write+guilds.members.read'
  const DISCORD_BOT_OAUTH2_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&integration_type=1&scope=${scope}`
  res.redirect(DISCORD_BOT_OAUTH2_URL)
});
app.get('/auth/discord/server', (req, res) => {
  const scope = 'identify+bot+applications.commands'
  const DISCORD_BOT_OAUTH2_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&permissions=563226978888768&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&integration_type=0&scope=${scope}`
  res.redirect(DISCORD_BOT_OAUTH2_URL)
});

// Discord OAuth2 콜백 라우트
app.get('/app/discord/GGT', async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.send('No code provided');
  }

  try {
    const tokenResponse = await axios.post(
      'https://discord.com/api/oauth2/token',
      qs.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, token_type } = tokenResponse.data;

    // 사용자 정보 가져오기
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        authorization: `${token_type} ${access_token}`,
      },
    });

    res.send(userResponse.data);
  } catch (error) {
    console.error('Error getting access token:', error);
    res.send('Error during authentication');
  }
});

const quotesFilePath = path.join(__dirname, 'public', 'txt', 'quotes.txt');

const LANGUAGES = [
  { name: 'Korean (KOR)', value: 'KOR' },
  { name: 'English (ENG)', value: 'ENG' },
  { name: 'Japanese (JPN)', value: 'JPN' },
  { name: 'Chinese Simplified (CHS)', value: 'CHS' },
  { name: 'Chinese Traditional (CHT)', value: 'CHT' },
  { name: 'Vietnamese (VIE)', value: 'VIE' },
  { name: 'Indian (IND)', value: 'IND' },
  { name: 'Thai (THA)', value: 'THA' },
  { name: 'German (DEU)', value: 'DEU' },
  { name: 'Russian (RUS)', value: 'RUS' },
  { name: 'Spanish (SPA)', value: 'SPA' },
  { name: 'Italian (ITA)', value: 'ITA' },
  { name: 'French (FRA)', value: 'FRA' },
  { name: 'Hindi (HIN)', value: 'HIN' },
  { name: 'Arabic (ARA)', value: 'ARA' },
  { name: 'Portuguese (POR)', value: 'POR' },
  { name: 'Turkish (TUR)', value: 'TUR' },
];

// 📜 Register Application Commands
// Slash Commands
const commands = [
  new SlashCommandBuilder()
    .setName('translate')
    .setDescription('Translate the Text 🌐')
    .addStringOption(option =>
      option
        .setName('language')
        .setDescription('Target language for translation 🔄')
        .setRequired(true)
        .addChoices(...LANGUAGES)
    )
    .addStringOption(option =>
      option
        .setName('text')
        .setDescription('Input Text')
        .setRequired(true)
    ),
  // new ContextMenuCommandBuilder()
  //   .setName('User Information')
  //   .setType(ApplicationCommandType.User),
  // new ContextMenuCommandBuilder()
  //   .setName('Message Information')
  //   .setType(ApplicationCommandType.Message),
];

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

async function registerCommands() {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands,
    });

    console.log('Successfully reloaded application (/) commands.\n');
  } catch (error) {
    console.error(error);
  }
}

// 🌟 Bot Ready Event
client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}!`);
  // 📜 Register Commands
  registerCommands();
  logGuilds();
});
client.on(Events.GuildCreate, guild => {
  console.log(`Joined new guild: ${guild.id} - ${guild.name}`);
  logGuilds();
});
client.on(Events.GuildDelete, guild => {
  console.log(`Removed from guild: ${guild.id} - ${guild.name}`);
  logGuilds();
});
async function logGuilds() {
  const guilds = await Promise.all(client.guilds.cache.map(async guild => {
    const owner = await guild.fetchOwner();
    return {
      id: guild.id,
      name: guild.name,
      ownerId: owner.id,
      ownerName: owner.user.tag,
    };
  }));
  
  console.log('Connected to the following guilds:');
  console.table(guilds);
}

// Function to delete the reply after a delay
async function deleteAfterDelay(interaction, info = null, delay = 60000) {
  setTimeout(async () => {
    try {
      // Check if the message still exists before attempting to delete
      const message = await interaction.fetchReply();
      if (message) {
        await interaction.deleteReply();
      }
      // If info message is provided, send it
      if (info) {
        await interaction.followUp(info);
      }
    } catch (e) {
      if (e.code !== 10008) { // Ignore "Unknown Message" error
        console.error('❌ Failed to delete reply:', e);
      }
    }
  }, delay);
}

const translationsMap = new Map();

// Define the function to handle the button interactions directly
async function handleButtonInteraction(interaction, translatedText) {
  try {
    if (interaction.customId.startsWith('confirm')) {
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setDescription(translatedText)
        .setTimestamp()
        .setFooter({ text: '💬 Translated Message' });
      
      await interaction.channel.send({ embeds: [embed] });
      console.log(`ID(${interaction.id}): ✅ Message sent!\n`);
      await interaction.update({ content: '✅ Message sent!', components: [] });
    } else if (interaction.customId.startsWith('dismiss')) {
      console.log(`ID(${interaction.id}): ❌ Message not sent.\n`);
      await interaction.update({ content: '❌ Message not sent.', components: [] });
    }
    deleteAfterDelay(interaction)
  } catch (e) {
    console.error(`❌ Error updating interaction:`, e);
    await interaction.reply({
      content: '⚠️ Error: Unable to process the interaction.',
      ephemeral: true,
    });
    deleteAfterDelay(interaction)
  }
}

// Define the function to handle the translation confirmation
async function handleTranslationConfirmation(interaction, translatedText, targetLanguage) {
  const interactionId = interaction.id;
  translationsMap.set(interactionId, { translatedText, targetLanguage });
  
  // Confirm with user before sending `✔️ || ❌`
  const confirmButton = new ButtonBuilder()
    .setCustomId(`confirm_${interactionId}`)
    .setLabel('Confirm ✔️')
    .setStyle(ButtonStyle.Success);

  const dismissButton = new ButtonBuilder()
    .setCustomId(`dismiss_${interactionId}`)
    .setLabel('Dismiss ❌')
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder()
    .addComponents(confirmButton, dismissButton);

  // 💬 Send translated result
  await interaction.reply({
    content: `### 🌐 Translation Result\n||*Translated [${targetLanguage}]*||\n## ${translatedText}\n\n__\n**Are you sure you want to send this Text?**`,
    components: [row],
    ephemeral: true,
  });

  deleteAfterDelay(interaction)
}

// 🛠️ Slash Command Interaction Handler
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.channel || interaction.channel.type === 'DM') {
    await interaction.reply({
      content: 'Currently, Cannot use commands in DM. ❌',
      ephemeral: true,
    });
    deleteAfterDelay(interaction)
    return;
  }
  if (interaction.isChatInputCommand()) {
    console.log(`Received command: ${interaction.commandName}`);

    // Log user ID, channel ID, and interaction ID
    console.log(`User ID: ${interaction.user.id}`);
    console.log(`Channel ID: ${interaction.channel.id}`);
    console.log(`Interaction ID: ${interaction.id}`);

    const { commandName, options } = interaction;
  
    if (commandName === 'translate') {
      const language = options.getString('language');
      const text = options.getString('text');
  
      console.log(`Requested text: ${text}`);
      console.log(`Requested translation to: ${language}`);

      if (!LANGUAGES.some(lang => lang.value === language)) {
        await interaction.reply({
          content: 'Unsupported language. Please check available languages. 📜',
          ephemeral: true,
        });
        deleteAfterDelay(interaction)
        return;
      }

      try {
        // 🌐 Call Translation API
        const translationResult = await translateText(text, language);
        const { translatedText, targetLanguage } = translationResult;

        console.log(`Translated text: ${translatedText}`);

        if (typeof translatedText !== 'string' || !translatedText) {
          throw new Error('ℹ️ Translation result is invalid or empty.');
        }

        await handleTranslationConfirmation(interaction, translatedText, targetLanguage);
        
      } catch (e) {
        console.error(`❌ ID(${interaction.id}) Error handling command:`, e);
        if (e.includes('SAFETY')) {
          await interaction.reply({
            content: '⚠️ Safety-related translation error.',
            ephemeral: true,
          });
          deleteAfterDelay(interaction)
          return
        }
        await interaction.reply({
          content: 'An error occurred during translation. ❌',
          ephemeral: true,
        });
        deleteAfterDelay(interaction)
      }
    }
  }
  else if (interaction.isButton()) {
    const interactionId = interaction.customId.split('_')[1];
    const translationData = translationsMap.get(interactionId);
    
    if (translationData) {
      const { translatedText, targetLanguage } = translationData;
      await handleButtonInteraction(interaction, translatedText);
    } else {
      await interaction.reply({
        content: '⚠️ Error: Translated text not found.',
        ephemeral: true,
      });
      deleteAfterDelay(interaction)
    }
  }
  else if (interaction.isContextMenuCommand()) {
    if (interaction.isUserContextMenuCommand()) {
      const { username } = interaction.targetUser;
      await interaction.reply(`User's username: ${username}`);
    }
    else if (interaction.isMessageContextMenuCommand()) {
      const { content } = interaction.targetMessage;
      await interaction.reply(`Message content: ${content}`);
    }
  }
  else if (DiscordjsErrorCodes.InteractionAlreadyReplied) {
    return
  }
  else {
    await interaction.reply({
      content: '❌ Not Command or AppContextMenu.',
      ephemeral: true,
    });
    deleteAfterDelay(interaction)
  }
});

// 🔄 Translation Function
const translateText = async (text, targetLanguage) => {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash-latest',
    systemInstruction: "You are the best translator(Advanced Translator) in the world. Please translate what you Languages correctly. Only send out the translated results. Detect Language -> " + targetLanguage + "\n\nBe sure to follow this form. Please maintain the fixed order." + `\n\nPlease make sure to output in ${targetLanguage}.`,
  });

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: text,
            }
          ],
        }
      ],
      generationConfig: {
        maxOutputTokens: 256,
        temperature: 0.7,
      },
    })

    const response = result.response;
    const translatedText = response.text();
    return {
      translatedText: translatedText,
      targetLanguage: targetLanguage
    };

  } catch (e) {
      console.error('❌ Error generating content:', e.response.candidates[0]);
      throw e.response.candidates[0].finishReason;
    }
}

// 📚 Read Quotes File
let quotes = [];

fs.readFile(quotesFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('❌ An error occurred while reading the quotes file:', err);
    return;
  }
  quotes = data.split('\n').filter(quote => quote.trim() !== '');
});

// 📝 Respond to Mentions with Quotes
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (message.channel.type === 'DM') {
    // DM messages are ignored
    return;
  }
  if (message.mentions.has(client.user)) {
    if (quotes.length === 0) {
      await message.reply('An error occurred while fetching the quotes. ❌');
      return;
    }
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    await message.reply(randomQuote);
  }
});

// 봇 로그인
client.login(DISCORD_TOKEN);

//
// ==>
//


// const moment = require('moment');
// const multer = require('multer');
// const path = require('path');

// const storage = multer.diskStorage({
//   destination: './public/uploads/',
//   filename: function(req, file, cb){
//     const Timestamp = new Date().getTime();
//     const Timenow = moment().format('YYYY-MM-DD HH:mm:ss:SSS');
//     cb(null, file.fieldname + '-' + Timestamp + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage: storage
// }).single('image');

// app.post('/upload', (req, res) => {
//   upload(req, res, (err) => {
//     if(err){
//       res.redirect('/error');
//     } else {
//       res.redirect('/success');
//     }
//   });
// });


app.use((req, res, next) => {
  const decodedUrl = decodeURIComponent(req.originalUrl);
  console.error(`## 404 Error: ${req.originalUrl}`);
  console.error(`## 404 Error(Decoded): ${decodedUrl}`);
  res.status(404).render('404.ejs');
});