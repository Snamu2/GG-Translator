// ToDo IN SSH => Disable dotenv, Change discord callback redirect URL
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
const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const admin = require('firebase-admin');
// const { MongoClient, ObjectId } = require('mongodb');
const methodOverride = require('method-override')
const axios = require('axios');
const qs = require('qs');
const fs = require('fs');
const path = require('path');
// var session = require('express-session')
require('dotenv').config();
app.use(methodOverride('_method'))
app.use(express.static(__dirname + '/public'))
app.use('/dictionary', express.static(path.join(__dirname, 'client/build')));
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(helmet());

const EventEmitter = require('events');
global.ee = new EventEmitter();

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
        "connect-src": ["'self'", "https://*.googleapis.com", "https://www.google-analytics.com"],
        "script-src": ["'self'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://cdn.socket.io", "https://www.gstatic.com", "https://www.googletagmanager.com", "https://www.google.com", (req, res) => `'nonce-${res.locals.nonce}'`],
        "style-src": ["'self'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", (req, res) => `'nonce-${res.locals.nonce}'`],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "img-src": ["'self'", "https://cdn.jsdelivr.net", "https://www.googletagmanager.com"],
        "media-src": ["'self'", 'blob:'],
        "frame-src": ["'self'", "https://www.google.com"],
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

// === FireBase Admin Init ===
// 서비스 계정 키 JSON 파일 경로
const serviceAccount = require(path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS));

// Firebase Admin 초기화
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ===
//

const port = process.env.PORT;

// const authDB = 'authDB(Experiment)';
// const authDB_post = 'post';
// const mainDB = 'mainDB(Experiment)';
// const mainDB_post = 'post';

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
  res.status(503).send('This feature is currently unavailable.');
  // let result = await db.collection(authDB_post).find().toArray()
  // // res.send(result[0].title)
  // res.render('list.ejs', { 글목록 : result, nonce : res.locals.nonce })
})

app.get('/write', (req, res) => {
    res.render('write.ejs')
})

app.post('/add', async (req, res) => {
  res.status(503).send('This feature is currently unavailable.');

  // try {
  //     if (Object.keys(req.body).length !== 2) {
  //         res.send('예상하지 못한 정보가 누락 혹은 포함되어 있습니다.')
  //     } else if (!req.body.hasOwnProperty('title') || !req.body.hasOwnProperty('content')) {
  //         res.send('필수 정보가 누락되었습니다.')
  //     } else if (req.body.title == ''){
  //         res.send('작성할 제목을 입력해주세요')
  //     } else if (req.body.content == '') {
  //         res.send('작성할 내용을 입력해주세요')
  //     } else {
  //         let result = await db.collection('post').insertOne({ title : req.body.title, content : req.body.content })
  //         console.log(`## 새로운 document(_id : ${result.insertedId})가 다음과 같이 작성되었습니다.\ntitle : ${req.body.title}\ncontent : ${req.body.content}`)
  //         res.redirect('/list')
  //     }
  // } catch (e) {
  //     console.log('## Error:', e.message)
  //     res.status(500).send('서버에러')
  // }

})

app.get('/detail/:id', async (req, res) => {
  res.status(503).send('This feature is currently unavailable.');
  // try {
  //     let result = await db.collection('post').findOne({ _id : new ObjectId(req.params.id) })
  //     // console.log(result)
  //     if (result == null) {
  //         res.status(404).send('이상한 url 입력함')
  //     }
  //     res.render('detail.ejs', { result : result })
  // } catch (e) {
  //     console.log('## Error:', e.message)
  //     res.status(404).send('이상한 url 입력함')
  // }
})

app.get('/edit/:id', async (req, res) => {
  res.status(503).send('This feature is currently unavailable.');
  // try {
  //     let result = await db.collection('post').findOne({ _id : new ObjectId(req.params.id) })
  //     // console.log(result)
  //     if (result == null) {
  //         res.status(404).send('이상한 url 입력함')
  //     }
  //     res.render('edit.ejs', { result : result })
  // } catch (e) {
  //     console.log('## Error:', e.message)
  //     res.status(404).send('이상한 url 입력함')
  // }
})

app.put('/edit', async (req, res) => {
  res.status(503).send('This feature is currently unavailable.');

  // try {
  //     if (Object.keys(req.body).length !== 3) {
  //         res.send('예상하지 못한 정보가 누락 혹은 포함되어 있습니다.')
  //     } else if (!req.body.hasOwnProperty('id') || !req.body.hasOwnProperty('title') || !req.body.hasOwnProperty('content')) {
  //         res.send('필수 정보가 누락되었습니다.')
  //     } else if (!ObjectId.isValid(req.body.id)) {
  //         res.send(`(${req.body.id}) 유효하지 않은 ID입니다.`)
  //     } else if (req.body.title == ''){
  //         res.send('수정할 제목을 입력해주세요')
  //     } else if (req.body.content == '') {
  //         res.send('수정할 내용을 입력해주세요')
  //     } else {
  //         let result = await db.collection('post').updateOne({ _id : new ObjectId(req.body.id) }, {$set : { title : req.body.title, content : req.body.content }})
  //         console.log(`## 기존 ${result.modifiedCount}개의 document(_id : ${req.body.id})가 다음과 같이 수정되었습니다.\ntitle : ${req.body.title}\ncontent : ${req.body.content}`)
  //         res.redirect('/list')
  //     }
  // } catch (e) {
  //     console.log('## Error:', e.message)
  //     res.status(500).send('서버에러')
  // }

})

app.delete('/delete', async (req, res) => {
  res.status(503).send('This feature is currently unavailable.');
    
  // try {
  //     if (Object.keys(req.query).length !== 3) {
  //         res.send('예상하지 못한 정보가 누락 혹은 포함되어 있습니다.')
  //     } else if (!req.query.hasOwnProperty('docid') || !req.query.hasOwnProperty('doctitle') || !req.query.hasOwnProperty('doccontent')) {
  //         res.send('필수 정보가 누락되었습니다.')
  //     } else if (!ObjectId.isValid(req.query.docid)) {
  //         res.send(`(${req.query.docid}) 유효하지 않은 ID입니다.`)
  //     } else {
  //         let result = await db.collection('post').deleteOne({ _id : new ObjectId(req.query.docid) })
  //         if (result.deletedCount === 0) {
  //             return res.status(404).send('삭제할 문서를 찾을 수 없습니다.');
  //         }
  //         console.log(`## 기존 ${result.deletedCount}개의 다음 내용을 포함한 document(_id : ${req.query.docid})가 삭제되었습니다.\ntitle : ${req.query.doctitle}\ncontent : ${req.query.doccontent}`)
  //         res.send('삭제완료')
  //     }
  // } catch (e) {
  //     console.log('## Error:', e.message)
  //     res.status(500).send('서버에러')
  // }

})

app.get('/authentication', (req, res) => {
  res.render('authentication.ejs')
})

app.get('/auth', (req, res) => {
    res.render('auth.ejs')
})

app.get('/auth/list', async (req, res) => {
  res.status(503).send('This feature is currently unavailable.');
  // let result = await db.collection(authDB_post).find().toArray()
  // res.render('auth_list.ejs', { 글목록 : result })
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
  res.status(503).send('This feature is currently unavailable.');
  // res.sendFile(__dirname + '/confirm.html')
  // var date = new Date();
  // var year = date.getFullYear();
  // var month = ("0" + (date.getMonth()+1)).slice(-2);
  // var day = ("0" + date.getDate()).slice(-2);
  // var hours = ("0" + date.getHours()).slice(-2);
  // var minutes = ("0" + date.getMinutes()).slice(-2);
  // var seconds = ("0" + date.getSeconds()).slice(-2);
  
  // var today = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  // console.log(today)
  // console.log(req.body.username)
  // console.log(req.body.content)

  // db.collection('Feedback (Experimental Version)').insertOne({ 날짜 : today, 유저명 : req.body.username, 내용 : req.body.content }, (err, result) => {
  //     console.log('## Feedback 데이터 저장완료');
  // });
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
// let lastSentResults = [];

// 인증 미들웨어
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.split('Bearer ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Invalid authorization header format' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };

    // 사용자 정보 업데이트
    const userInfo = {
      email: decodedToken.email,
      // displayName: decodedToken.name,
      // ...
    };
    await updateUserInfo(decodedToken.uid, userInfo);

    next();
  } catch (error) {
    console.error('Error verifying auth token:', error);
    res.status(401).json({ error: 'Invalid auth token' });
  }
};

// Firebase Firestore에 사용자별 번역 결과 저장
async function saveTranslationToFirestore(userId, input, output, model) {
  if (!userId) {
    console.error("User ID is missing");
    throw new Error("User ID is required");
  }

  try {
    const userDocRef = db.collection('users').doc(userId);
    const translationsCol = userDocRef.collection('translations');
    const docRef = await translationsCol.add({
      input: input,
      output: output,
      model: model,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log("Translation saved for user:", userId);

    // 새 번역 결과 저장 시 이벤트 발생
    global.ee.emit('newTranslation', userId, { input, output, model });

    return docRef.id;
  } catch (error) {
    console.error("Error saving translation: ", error);
    throw error;
  }
}

// 사용자별 최신 번역 결과 가져오기 함수
async function getLatestTranslationForUser(userId) {
  try {
    const userDocRef = db.collection('users').doc(userId);
    const translationsCol = userDocRef.collection('translations');
    const querySnapshot = await translationsCol
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
    return null;
  } catch (error) {
    console.error("Error getting latest translation: ", error);
    return null;
  }
}

async function updateUserInfo(userId, userInfo) {
  if (!userId) {
    console.error("User ID is missing");
    throw new Error("User ID is required");
  }

  try {
    const userDocRef = db.collection('users').doc(userId);
    
    // 기존 정보와 병합
    await userDocRef.set({
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      ...userInfo
    }, { merge: true });

    console.log("User info updated for user:", userId);
  } catch (error) {
    console.error("Error updating user info: ", error);
    throw error;
  }
}

app.post('/api/update-user-info', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userInfo = {
      email: req.user.email,
      // displayName: req.user.displayName,
      // photoURL: req.user.photoURL,
      // 필요한 다른 정보들...
    };

    await updateUserInfo(userId, userInfo);
    res.status(200).json({ message: "User info updated successfully" });
  } catch (error) {
    console.error("Error in update-user-info route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/', authenticateUser, async (req, res) => {
    const userId = req.user.uid;
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
            maxOutputTokens: 512,
            temperature: 0.7,
          },
        }).then(async (result) => {
          const response = result.response;
          const text = response.text();
          // console.log(text);
          
          try {
            // Firestore에 번역 결과 저장
            await saveTranslationToFirestore(userId, param, text, selectedModel);
            res.json(text);
          } catch (error) {
            console.error("Error in translation process:", error);
            res.status(500).json({ error: "Internal server error" });
          }
        })
        .catch(error => {
          console.error("Error in Gemini model:", error);
          res.status(500).json({ error: "Error processing translation" });
        });
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

// 새로운 라우트: 사용자별 최신 번역 결과 가져오기
app.get('/api/latest-translation', authenticateUser, async (req, res) => {
  try {
    const latestTranslation = await getLatestTranslationForUser(req.user.uid);
    if (latestTranslation) {
      res.json(latestTranslation);
    } else {
      res.status(404).json({ error: 'No translation found' });
    }
  } catch (error) {
    console.error('Error fetching latest translation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    socket.user = {
      uid: decodedToken.uid,
      email: decodedToken.email
    };
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

// 클라이언트에게 번역 결과를 실시간으로 전송
io.on('connection', (socket) => {
  console.log('New client connected:', socket.user.uid);

  // 최신 번역 결과 전송 함수
  const sendLatestTranslation = async () => {
    try {
      const latestTranslation = await getLatestTranslationForUser(socket.user.uid);
      if (latestTranslation) {
        socket.emit('translation update', { AIResult: latestTranslation.output });
      }
    } catch (error) {
      console.error('Error sending translation:', error);
    }
  };

  // 연결 시 자동으로 최신 번역 전송
  sendLatestTranslation();

  // 클라이언트 요청 시 최신 번역 전송
  socket.on('requestLatestTranslation', sendLatestTranslation);

  // 새로운 번역 결과 전송 함수
  const sendNewTranslation = (userId, translationResult) => {
    if (socket.user.uid === userId) {
      socket.emit('translation update', { AIResult: translationResult.output });
    }
  };

  // 전역 이벤트 리스너 등록
  global.ee.on('newTranslation', sendNewTranslation);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.user.uid);
    // 이벤트 리스너 제거
    global.ee.removeListener('newTranslation', sendNewTranslation);
  });
});

// TTS Text-to-Speech
const ttsClient = new TextToSpeechClient();

// 언어별 음성 타입 매핑
const voiceTypeMap = {
  'en-US': 'en-US-Journey-F',
  'ko-KR': 'ko-KR-Neural2-C',
  'ja-JP': 'ja-JP-Neural2-B',
  'zh-CN': 'cmn-CN-Wavenet-D',
  'zh-TW': 'cmn-TW-Wavenet-A',
  'vi-VN': 'vi-VN-Wavenet-A',
  'id-ID': 'id-ID-Wavenet-D',
  'th-TH': 'th-TH-Neural2-C',
  'de-DE': 'de-DE-Neural2-B',
  'ru-RU': 'ru-RU-Wavenet-D',
  'es-ES': 'es-ES-Neural2-F',
  'it-IT': 'it-IT-Neural2-A',
  'fr-FR': 'fr-FR-Neural2-A',
  'hi-IN': 'hi-IN-Neural2-B',
  'ar-XA': 'ar-XA-Wavenet-B',
  'pt-PT': 'pt-PT-Wavenet-C',
  'tr-TR': 'tr-TR-Wavenet-B'
};

app.post('/api/tts', authenticateUser, async (req, res) => {
  try {
    const { text, languageCode } = req.body;

    const voiceName = voiceTypeMap[languageCode] || voiceTypeMap['en-US'];
    
    const request = {
      input: { text },
      voice: { languageCode, name: voiceName },
      audioConfig: { 
        audioEncoding: 'LINEAR16',
        effectsProfileId: ['small-bluetooth-speaker-class-device'],
        pitch: 0,
        speakingRate: 1
      },
    };

    const [response] = await ttsClient.synthesizeSpeech(request);
    
    res.set('Content-Type', 'audio/wav');
    res.send(response.audioContent);
  } catch (error) {
    console.error('Error in TTS:', error);
    res.status(500).json({ error: 'Failed to synthesize speech' });
  }
});

//
// React GG Dictionary
app.get('/dictionary', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Firestore For Cache
const dictionaryCache = db.collection('dictionary_cache');

// Dictionary API Endpoint
app.post('/api/dictionary', authenticateUser, async (req, res) => {
  const { word } = req.body;
  const userId = req.user.uid;

  try {
    const userLanguage = await getUserLanguagePreference(userId);

    // Checking in Cache
    const cachedResult = await getCachedDefinition(word, userLanguage);
    if (cachedResult) {
      await addToSearchHistory(userId, word, cachedResult.definitions, userLanguage);
      return res.json(cachedResult);
    }

    // Gemini: def & ex
    const definitions = await getDefinitionsFromGemini(word, userLanguage);

    // Caching the result
    await cacheDefinition(word, definitions, userLanguage);

    // Adding in user's search history
    await addToSearchHistory(userId, word, definitions, userLanguage);

    res.json({ definitions });
  } catch (error) {
    console.error('Dictionary API error:', error);
    res.status(500).json({ error: 'Failed to fetch definition' });
  }
});

async function getCachedDefinition(word, language) {
  const cacheDoc = await dictionaryCache.doc(`${word.toLowerCase()}_${language}`).get();
  if (cacheDoc.exists) {
    return cacheDoc.data();
  }
  return null;
}

async function cacheDefinition(word, definitions, language) {
  await dictionaryCache.doc(`${word.toLowerCase()}_${language}`).set({
    definitions,
    language,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function addToSearchHistory(userId, word, definitions, requestLanguage) {
  try {
    await db.collection('users').doc(userId).collection('search_history').add({
      word,
      definitions,
      requestLanguage,
      isHidden: false,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Search history added for user ${userId}: ${word} in ${requestLanguage}`);
  } catch (error) {
    console.error('Error adding to search history:', error);
  }
}

app.post('/api/clear-search-history', authenticateUser, async (req, res) => {
  const userId = req.user.uid;
  try {
    // 사용자의 검색 기록에 'isHidden' 필드를 true로 설정
    const historyRef = db.collection('users').doc(userId).collection('search_history');
    const batch = db.batch();
    const snapshot = await historyRef.get();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { isHidden: true });
    });
    await batch.commit();
    res.json({ message: 'Search history hidden successfully' });
  } catch (error) {
    console.error('Error hiding search history:', error);
    res.status(500).json({ error: 'Failed to hide search history' });
  }
});

async function getDefinitionsFromGemini(word, language) {
  const modelName = 'gemini-1.5-flash-latest';
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: `Define the word "${word}" in ${language} and provide multiple meanings if applicable. For each definition, include a short example sentence. Format the response STRICTLY as a JSON array of objects, each containing 'definition' and 'example' keys. DO NOT include any additional text or explanations outside of the JSON structure. The response should be a valid JSON that can be parsed without any modifications. Example format:
  [
    {
      "definition": "First definition here",
      "example": "Example sentence for the first definition"
    },
    {
      "definition": "Second definition here (if applicable)",
      "example": "Example sentence for the second definition"
    }
  ]`,
  });

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: word,
            }
          ],
        }
      ],
      generationConfig: {
        maxOutputTokens: 516,
        temperature: 0.7,
      },
    });

    const response = result.response;
    let rawContent = response.text().trim();

    // JSON 파싱 시도
    let definitions;
    try {
      definitions = JSON.parse(rawContent);
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      console.error('Raw content:', rawContent);
      
      // JSON 파싱 실패 시 텍스트를 단순 객체로 변환
      definitions = [{
        definition: "Unable to parse the response. Please try again.",
        example: "No example available"
      }];
    }

    // 결과가 배열이 아닌 경우 처리
    if (!Array.isArray(definitions)) {
      definitions = [definitions];
    }

    // 결과 정제
    return definitions.map((def, index) => ({
      id: `${word}_${index}`,
      word,
      definition: def.definition || 'No definition available',
      example: def.example || 'No example available'
    }));
  } catch (e) {
    console.error('❌ Error generating content:', e.response?.candidates[0] || e);
    throw e.response?.candidates[0]?.finishReason || 'Error fetching definitions';
  }
}

// 사용자 언어 설정 저장
app.post('/api/user/language-preference', authenticateUser, async (req, res) => {
  const { language } = req.body;
  const userId = req.user.uid;

  try {
    await db.collection('users').doc(userId).set({
      preferredLanguage: language
    }, { merge: true });
    res.json({ message: 'Language preference updated successfully' });
  } catch (error) {
    console.error('Error updating language preference:', error);
    res.status(500).json({ error: 'Failed to update language preference' });
  }
});

// 사용자 언어 설정 가져오기
async function getUserLanguagePreference(userId) {
  const userDoc = await db.collection('users').doc(userId).get();
  if (userDoc.exists) {
    return userDoc.data().preferredLanguage || 'en'; // 기본값은 영어
  }
  return 'en';
}


//
// For Discord App <==
//
app.get('/discord_selector', (req, res) => {
  res.render('discord_selector.ejs')
});

const { Client, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder, ContextMenuCommandBuilder, ApplicationCommandType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, DiscordjsErrorCodes } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const REDIRECT_URI = 'http://localhost:3000/app/discord/GGT';
// const REDIRECT_URI = 'https://snamu2.com/app/discord/GGT';

// Discord OAuth2 인증 라우트
app.get('/auth/discord/app', (req, res) => {
  res.send("Go to `Add to Server`")
  // const scope = 'identify+messages.read+applications.commands+guilds.members.read'
  // const DISCORD_BOT_OAUTH2_URL = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&integration_type=1&scope=${scope}`
  // res.redirect(DISCORD_BOT_OAUTH2_URL)
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

    res.render('user_display', userResponse.data);

  } catch (error) {
    console.error('Error getting access token:', error);

    // 사용자에게 적절한 오류 메시지 반환
    if (error.response) {
      // 서버가 응답을 반환한 경우
      res.status(error.response.status).send(`Error during authentication: ${error.response.data.error_description || 'Unknown error'}`);
    } else if (error.request) {
      // 서버로 요청이 전송되었으나 응답이 없는 경우
      res.status(500).send('Error during authentication: No response from server');
    } else {
      // 요청을 설정하는 중 발생한 오류
      res.status(500).send('Error during authentication: Request setup error');
    }
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
// Context Menu Commands
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

  new ContextMenuCommandBuilder()
    .setName('Translate to locale')
    .setType(ApplicationCommandType.User),

  new ContextMenuCommandBuilder()
    .setName('Translate to locale')
    .setType(ApplicationCommandType.Message),
];

const rest = new REST().setToken(DISCORD_TOKEN);

// 📜 Register Commands
(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    const data = await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands,
    });

    console.log(`✔️  Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();

// 🌟 Bot Ready Event
client.once(Events.ClientReady, () => {
  console.log(`Logged in as ${client.user.tag}!`);
  // 상태 메시지 설정
  // client.user.setPresence({
  //   activities: [{ name: '/translate || Right-click on a User/Message' }],
  //   status: 'online'  // online, idle, dnd
  // });
  // 📜 logging Guilds Info
  logGuilds();
  syncAllGuilds(); // sync with db
});
// 주기적인 동기화 (6시간마다)
setInterval(syncAllGuilds, 6 * 60 * 60 * 1000);

async function syncAllGuilds() {
  try {
    const guilds = client.guilds.cache;
    const promises = guilds.map(guild => saveGuildInfoToFirestore(guild));
    await Promise.all(promises);
    console.log(`Synchronized ${guilds.size} guilds`);
  } catch (error) {
    console.error("Error syncing guilds:", error);
  }
}

// Discord 서버 정보를 Firestore에 저장
async function saveGuildInfoToFirestore(guild) {
  try {
    const owner = await guild.fetchOwner();
    const docRef = db.collection('discordGuilds').doc(guild.id);
    await docRef.set({
      id: guild.id,
      name: guild.name,
      ownerId: owner.id,
      ownerName: owner.user.tag,
      memberCount: guild.memberCount,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      joinedAt: guild.joinedTimestamp ? new Date(guild.joinedTimestamp) : null
    }, { merge: true });
    console.log(`📜✔️  Guild info saved for ${guild.name} (ID: ${guild.id})`);
  } catch (error) {
    console.error(`❌ Error saving guild info for ${guild.id}: `, error);
    // console.error('Guild object:', JSON.stringify(guild, null, 2));
  }
}

client.on(Events.GuildCreate, async guild => {
  console.log(`📜✔️  Joined new guild: ${guild.id} - ${guild.name}`);
  await saveGuildInfoToFirestore(guild);
  logGuilds();
});

client.on(Events.GuildDelete, async guild => {
  console.log(`📜❌ Removed from guild: ${guild.id} - ${guild.name}`);
  try {
    await db.collection('discordGuilds').doc(guild.id).delete();
    console.log(`📜❌ Guild info deleted for ${guild.name} (ID: ${guild.id})`);
  } catch (error) {
    console.error(`❌ Error deleting guild info for ${guild.id}: `, error);
  }
  logGuilds();
});

async function logGuilds() {
  const guilds = await Promise.all(client.guilds.cache.map(async guild => {
    const owner = await guild.fetchOwner();
    const memberCount = guild.memberCount;
    return {
      id: guild.id,
      name: guild.name,
      ownerId: owner.id,
      ownerName: owner.user.tag,
      memberCount: memberCount,
    };
  }));
  
  console.log('📜 Connected to the following guilds:');
  console.table(guilds);
  console.log(`====================\n`);
}

// Firestore에 사용자 정보 저장 또는 업데이트
async function saveOrUpdateUserInfo(user, locale) {
  try {
    const userRef = db.collection('discordUsers').doc(user.id);
    const userData = {
      id: user.id,
      tag: user.tag,
      username: user.username,
      locale: locale ?? null,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };

    await userRef.set(userData, { merge: true });
    console.log(`User info saved/updated for ${user.tag}`);
  } catch (error) {
    console.error("Error saving/updating user info: ", error);
  }
}

// Function to delete the reply after a delay
async function deleteAfterDelay(interaction, info = null, delay = 60000) {
  setTimeout(async () => {
    try {
      // Check if the message still exists before attempting to delete
      const message = await interaction.fetchReply();
      if (message) {
        await interaction.deleteReply();
        await handleInteractionTimeout(interaction);
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

async function saveButtonInteractionResult(userId, interactionId, action) {
  try {
    const resultData = {
      interactionId: interactionId,
      action: action, // 'confirm', 'dismiss', or 'timeout'
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('DiscordApp').doc(userId).collection('button_interactions').add(resultData);
    console.log(`📜✔️  Button interaction result saved for user ${userId}: ${action}`);
  } catch (error) {
    console.error("❌ Error saving button interaction result: ", error);
  }
}

async function handleInteractionTimeout(interaction) {
  try {
    const userId = interaction.user.id;
    const interactionId = interaction.id;

    await saveButtonInteractionResult(userId, interactionId, 'timeout');

    // 메시지가 여전히 존재하는지 확인
    const message = await interaction.fetchReply().catch(() => null);
    if (message) {
      await interaction.editReply({
        content: "⏳ Time's up! The interaction has expired.",
        components: []
      });
    } else {
      console.log(`ID(${interactionId}): Message no longer exists, skipping edit.`);
    }

    console.log(`ID(${interactionId}): ⏳ Interaction timed out.`);
  } catch (error) {
    if (error.code === 10008) {
      console.log(`ID(${interaction.id}): Interaction already handled or message deleted.`);
    } else {
      console.error(`❌ Error handling interaction timeout:`, error);
    }
  }
}

// Define the function to handle the button interactions directly
async function handleButtonInteraction(interaction, translatedText) {
  try {
    const userId = interaction.user.id;
    const interactionId = interaction.customId.split('_')[1];
    let action;
    
    if (interaction.customId.startsWith('confirm')) {
      action = 'confirm';
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
      action = 'dismiss';
      console.log(`ID(${interaction.id}): ❌ Message not sent.\n`);
      await interaction.update({ content: '❌ Message not sent.', components: [] });
    }
    
    // Save the button interaction result
    await saveButtonInteractionResult(userId, interactionId, action);

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
  // 모든 상호작용에 대해 사용자 정보 업데이트
  await saveOrUpdateUserInfo(interaction.user, interaction.locale);

  // Handle invalid channel
  if (!interaction.channel || interaction.channel.type === 'DM') {
    await interaction.reply({
      content: 'Currently, Cannot use commands in DM. ❌',
      ephemeral: true,
    });
    deleteAfterDelay(interaction)
    return;
  }
  
  // Function to log interaction details
  const logInteractionDetails = (interaction) => {
    console.log(`📝 Interaction Type: ${interaction.type}`);
    console.log(`📝 Received command: ${interaction.commandName}`);
    console.log(`📝 User ID: ${interaction.user.id}`);
    console.log(`📝 Guild ID: ${interaction.guild.id}`);
    console.log(`📝 Channel ID: ${interaction.channel.id}`);
    console.log(`📝 Interaction ID: ${interaction.id}`);
    console.log(`📝 User locale: ${interaction.locale}`);
  };

  // Function to handle errors
  const handleError = async (interaction, e) => {
    console.error(`❌ ID(${interaction.id}) Error handling command:`, e);
    if (e.includes('SAFETY')) {
      await interaction.reply({
        content: '⚠️ Safety-related translation error.',
        ephemeral: true,
      });
      deleteAfterDelay(interaction);
      return;
    }
    await interaction.reply({
      content: 'An error occurred during translation. ❌',
      ephemeral: true,
    });
    deleteAfterDelay(interaction);
  };

  // Common translation handling function
  const handleTranslation = async (interaction, text, language) => {
    try {
      // 🌐 Call Translation API
      const translationResult = await translateText(interaction, text, language);
      const { translatedText, targetLanguage } = translationResult;

      console.log(`Translated text: ${translatedText}`);

      if (typeof translatedText !== 'string' || !translatedText) {
        throw new Error('ℹ️ Translation result is invalid or empty.');
      }

      await handleTranslationConfirmation(interaction, translatedText, targetLanguage);
    } catch (e) {
      await handleError(interaction, e);
    }
  };

  if (interaction.isChatInputCommand()) {
    logInteractionDetails(interaction);

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
      
      await handleTranslation(interaction, text, language);
    }
  }
  else if (interaction.isContextMenuCommand()) {
    logInteractionDetails(interaction);

    const { commandName, locale } = interaction;
    let text = ``;
    
    if (commandName === 'Translate to locale') {
      if (interaction.isUserContextMenuCommand()) {
        const { nickname, user } = interaction.targetMember;
        const username = nickname || user.username;
        text = `${username}`
        
        console.log(`Target user: ${username}`);
      }
      else if (interaction.isMessageContextMenuCommand()) {
        const { content } = interaction.targetMessage;
        text = `${content}`

        console.log(`Target message: ${content}`);
      }

      console.log(`Requested text: ${text}`);
      console.log(`Requested translation to: ${locale}`);

      if (!text) {
        console.log(`Invalid`)
        return
      };

      await handleTranslation(interaction, text, locale);
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

// Firestore에 번역 요청 저장
async function saveTranslationRequestToFirestore(interaction, text, targetLanguage, modelName) {
  try {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const guildName = interaction.guild.name;
    const commandName = interaction.commandName;
    const userTag = interaction.user.tag;
    const userLocale = interaction.locale ?? null;

    let commandType;
    if (interaction.isChatInputCommand()) {
      commandType = 1; // CHAT_INPUT
    } else if (interaction.isUserContextMenuCommand()) {
      commandType = 2; // USER
    } else if (interaction.isMessageContextMenuCommand()) {
      commandType = 3; // MESSAGE
    } else {
      commandType = 0; // Unknown type
    }

    let targetId, targetTag, targetMessage;
    if (interaction.isUserContextMenuCommand()) {
      targetId = interaction.targetUser.id;
      targetTag = interaction.targetUser.tag;
      targetMessage = null;
    } else if (interaction.isMessageContextMenuCommand()) {
      targetId = interaction.targetMessage.author.id;
      targetTag = interaction.targetMessage.author.tag;
      targetMessage = interaction.targetMessage.content;
    } else {
      targetId = null;
      targetTag = null;
      targetMessage = text;
    }

    const requestData = {
      guildId: guildId,
      guildName: guildName,
      commandName: commandName,
      commandType: commandType,
      requesterId: userId,
      requesterTag: userTag,
      requesterLocale: userLocale,
      targetId: targetId,
      targetTag: targetTag,
      targetMessage: targetMessage,
      targetLanguage: targetLanguage,
      modelName: modelName,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    // 사용자 정보 업데이트
    await saveOrUpdateUserInfo(interaction.user, interaction.locale);

    const docRef = await db.collection('DiscordApp').doc(userId).collection('translation_requests').add(requestData);
    console.log(`Translation request saved for user ${userId}`);
    return docRef;
  } catch (error) {
    console.error("Error saving translation request: ", error);
  }
}

// Firestore에 번역 결과 저장
async function saveTranslationResultToFirestore(userId, requestId, translatedText, modelName) {
  try {
    const resultData = {
      requestId: requestId,
      translatedText: translatedText,
      modelName: modelName,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('DiscordApp').doc(userId).collection('translation_results').add(resultData);
    console.log(`Translation result saved for user ${userId}`);
  } catch (error) {
    console.error("Error saving translation result: ", error);
  }
}

// 🔄 Translation Function
const translateText = async (interaction, text, targetLanguage) => {
  const modelName = 'gemini-1.5-flash-latest';
  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: "You are the best translator(Advanced Translator) in the world. Please translate what you Languages correctly. Only send out the translated results. Detect Language -> " + targetLanguage + "\n\nBe sure to follow this form. Please maintain the fixed order." + `\n\nPlease make sure to output in ${targetLanguage}.`,
  });

  try {
    // 번역 요청 저장
    const requestDocRef = await saveTranslationRequestToFirestore(interaction, text, targetLanguage, modelName)

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

    // 번역 결과 저장
    await saveTranslationResultToFirestore(interaction.user.id, requestDocRef.id, translatedText, modelName)

    return {
      translatedText: translatedText,
      targetLanguage: targetLanguage,
      modelName: modelName
    };

  } catch (e) {
    console.error('❌ Error generating content:', e.response?.candidates[0] || e);
    throw e.response?.candidates[0]?.finishReason || 'Unknown error';
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

app.use((err, req, res, next) => {
  if (req) {
    const decodedUrl = decodeURIComponent(req.originalUrl);
    console.error(`## 500 Error: ${req.originalUrl}`);
    console.error(`## 500 Error(Decoded): ${decodedUrl}`);
  }
  console.error(err.stack)
  res.status(500).send('Something broke!')
});