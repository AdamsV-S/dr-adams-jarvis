// ================= Virtual AI Teacher - Dr. Adams Jarvis =================
// Full standalone JS file (save as: teacher.js)
// Created by Adams Victor at age 16 by the power of God
//
// How to use:
// 1. Put this file in your project folder as teacher.js
// 2. In your index.html, load it AFTER all HTML elements:
//    <script src="teacher.js"></script>
// 3. For Netlify deployment (API key hidden from users):
//    - Create folder: netlify/functions/
//    - Create netlify/functions/ai.js with this exact code:
//
//      const Groq = require('groq-sdk');
//      exports.handler = async (event) => {
//        try {
//          const { messages } = JSON.parse(event.body);
//          const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
//          const completion = await groq.chat.completions.create({
//            messages: messages,
//            model: "llama-3.3-70b-versatile",
//            temperature: 0.75,
//            max_tokens: 1024
//          });
//          const reply = completion.choices[0].message.content;
//          return { statusCode: 200, body: JSON.stringify({ reply }) };
//        } catch (err) {
//          console.error(err);
//          return { statusCode: 500, body: JSON.stringify({ reply: "Sorry, the teacher is resting. Try again soon!" }) };
//        }
//      };
//
//    - In Netlify Dashboard → Environment variables → Add:
//      Key: GROQ_API_KEY
//      Value: your_gsk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
//    - Deploy. Users will NEVER see any API key.

(function () {
  window.addEventListener("DOMContentLoaded", () => {
    // ================= ELEMENTS =================
    const orb = document.getElementById("orb");
    const notesToggle = document.getElementById("notesToggle");
    const knowledgeBox = document.getElementById("knowledgeBox");
    const knowledgeInput = document.getElementById("knowledgeInput");
    const saveKnowledgeBtn = document.getElementById("saveKnowledgeBtn");
    const deleteKnowledgeBtn = document.getElementById("deleteKnowledgeBtn");
    const micBtn = document.getElementById("micBtn");
    const sendBtn = document.getElementById("sendBtn");
    const userInput = document.getElementById("userInput");
    const chat = document.getElementById("chat");
    const musicBtn = document.getElementById("musicBtn");
    const bgMusic = document.getElementById("bgMusic");
    const teachBtn = document.getElementById("teachBtn");
    const examBtn = document.getElementById("examBtn");
    const jarBtn = document.getElementById("jarBtn");
    const menuBtn = document.getElementById("menuBtn");
    const menuPanel = document.getElementById("menuPanel");
    const voiceToggleBtn = document.getElementById("voiceToggleBtn");
    const pomodoroBtn = document.getElementById("pomodoroBtn");
    const pomodoroPanel = document.getElementById("pomodoroPanel");
    const pomodoroTimerDisplay = document.getElementById("pomodoroTimer");
    const startPomodoroBtn = document.getElementById("startPomodoro");
    const resetPomodoroBtn = document.getElementById("resetPomodoro");

    // ================= STATE =================
    let notesVisible = false;
    let currentMode = "teach";
    let speaking = false;
    let blockMic = false;
    let examActive = false;
    let examQuestions = [];
    let currentExamIndex = 0;
    let examResults = [];
    let studySessions = [];
    let pomodoroInterval = null;
    let pomodoroTime = 25 * 60;
    let isBreak = false;
    let voiceRecognitionActive = false;
    let currentTopic = localStorage.getItem("currentTopic") || "";
    let selectedFemaleVoice = null;
    let recognition = null;
    let isProcessing = false;
    let ttsEnabled = true;
    let awaitingMusicSelection = false;
    let musicSelectionTimeout = null;
    let chatHistory = [];

    // ================= MUSIC LIBRARY =================
    const localMusicLibrary = {
      piano: "audio/piano.mp3",
      classical: "audio/classical.mp3",
      lofi: "audio/lofi.mp3",
      nature: "audio/nature.mp3"
    };

    // ================= CLEAN FOR SPEECH =================
    function cleanForSpeech(text) {
      if (!text) return "";
      return text
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
        .replace(/[*_#`~|[\](){}<>!?-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // ================= CHUNKED NATURAL TTS =================
    function speakText(fullText) {
      if (!fullText || !ttsEnabled) return;
      speechSynthesis.cancel();
      speaking = true;
      blockMic = true;
      setOrbState("speaking");
      const cleanText = cleanForSpeech(fullText);
      const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
      let index = 0;
      function speakNextSentence() {
        if (index >= sentences.length) {
          finishSpeaking();
          return;
        }
        const sentence = sentences[index].trim();
        if (!sentence) { index++; speakNextSentence(); return; }
        const u = new SpeechSynthesisUtterance(sentence);
        u.lang = "en-US";
        u.rate = 0.94;
        u.pitch = 1.03;
        u.volume = 0.93;
        if (selectedFemaleVoice) u.voice = selectedFemaleVoice;
        u.onend = () => {
          index++;
          setTimeout(speakNextSentence, 650);
        };
        u.onerror = finishSpeaking;
        speechSynthesis.speak(u);
      }
      function finishSpeaking() {
        speaking = false;
        blockMic = false;
        setOrbState("idle");
      }
      speakNextSentence();
    }
    function setOrbState(state){ if(orb) orb.className = state; }

    // ================= VOICES =================
    function loadVoices(){
      const voices = speechSynthesis.getVoices();
      selectedFemaleVoice = voices.find(v =>
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("susan") ||
        v.name.toLowerCase().includes("samantha")
      ) || voices[0];
    }
    speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    // ================= NOTES + VIDEO =================
    function loadNotesFromStorage(){
      try{ return JSON.parse(localStorage.getItem("kcseNotesJSON")) || {}; }catch{ return {}; }
    }
    function toggleNotes(){
      notesVisible = !notesVisible;
      knowledgeBox.classList.toggle("show", notesVisible);
      if(notesVisible){
        knowledgeInput.value = JSON.stringify(loadNotesFromStorage(), null, 2);
        if(!document.getElementById("videoSection")){
          const videoSection = document.createElement("div");
          videoSection.id = "videoSection";
          videoSection.innerHTML = `
            <h3 style="margin:15px 0 8px 0;">📹 Educational Videos (Mini VLC)</h3>
            <button id="loadVideoBtn" style="width:100%; padding:14px; background:#4a90e2; color:white; border:none; border-radius:8px; font-size:16px; cursor:pointer;">📂 Load Video from Your Device</button>
            <div id="videoContainer" style="display:none; margin-top:10px; background:#000; border-radius:12px; overflow:hidden;">
              <video id="player" controls autoplay style="width:100%; max-height:320px;"></video>
            </div>
          `;
          knowledgeBox.appendChild(videoSection);
          document.getElementById("loadVideoBtn").onclick = () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "video/*";
            input.onchange = e => {
              const file = e.target.files[0];
              if(!file) return;
              const url = URL.createObjectURL(file);
              const container = document.getElementById("videoContainer");
              const player = document.getElementById("player");
              player.src = url;
              container.style.display = "block";
              player.play();
              speakText("Video loaded. Enjoy your educational video!");
            };
            input.click();
          };
        }
      }
    }
    function saveNotes(){
      try{
        const data = JSON.parse(knowledgeInput.value.trim());
        localStorage.setItem("kcseNotesJSON", JSON.stringify(data));
        speakText("Notes saved successfully.");
      } catch{ speakText("Invalid JSON format."); }
    }
    function deleteNotes(){
      if(confirm("Delete all notes?")){
        localStorage.removeItem("kcseNotesJSON");
        if(knowledgeInput) knowledgeInput.value = "";
        speakText("All notes deleted.");
      }
    }

    // ================= CHAT + MEMORY =================
    function addMessage(text, from="user"){
      const div = document.createElement("div");
      div.className = `message ${from}`;
      div.textContent = text;
      if(chat){
        chat.appendChild(div);
        div.scrollIntoView({behavior:"smooth"});
      }
      chatHistory.push({ role: from === "user" ? "user" : "assistant", content: text });
    }

    // ================= EXAM MARKING =================
    function isAnswerClose(user, correct) {
      if (!user || !correct) return false;
      const u = user.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
      const c = correct.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
      if (u === c || u.includes(c) || c.includes(u)) return true;
      const userWords = u.split(/\s+/).filter(w => w.length > 1);
      const correctWords = c.split(/\s+/).filter(w => w.length > 1);
      if (userWords.length === 0 || correctWords.length === 0) return false;
      let matches = 0;
      correctWords.forEach(cw => {
        if (userWords.some(uw => uw.includes(cw) || cw.includes(uw) || uw === cw)) matches++;
      });
      return (matches / correctWords.length) >= 0.60;
    }

    // ================= OFFLINE RETRIEVAL =================
    function findInNotes(query) {
      const notes = loadNotesFromStorage();
      const lowerQuery = query.toLowerCase().trim();
      for (let key in notes) {
        const lowerKey = key.toLowerCase().trim();
        if (lowerKey === lowerQuery || lowerKey.includes(lowerQuery) || lowerQuery.includes(lowerKey)) {
          return notes[key];
        }
      }
      for (let key in notes) {
        const lowerValue = notes[key].toString().toLowerCase().trim();
        if (lowerValue.includes(lowerQuery)) {
          return notes[key];
        }
      }
      return null;
    }

    // ================= GROQ AI - NETLIFY HIDDEN KEY (NO CLIENT PROMPT) =================
    async function callGroqAI(promptText){
      const systemPrompt = `You are Virtual AI Teacher - a friendly KCSE teacher in Kenya.
Use simple English and motivate students.
You can use emojis in text but never speak them.
If asked your name you say "Dr. Adams Jarvis, created by Adams Victor at age 16 by the power of God."`;

      const messages = [
        { role:"system", content: systemPrompt },
        ...chatHistory.slice(-10),
        { role:"user", content: promptText }
      ];

      try{
        const res = await fetch("/.netlify/functions/ai",{
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({ messages })
        });
        const data = await res.json();
        return data.reply || "AI could not respond.";
      }catch(err){
        console.error(err);
        return "Connection error. Please check your internet.";
      }
    }

    // ================= MAIN QUERY HANDLER =================
    async function handleUserQuery(text){
      if(!text || !text.trim() || isProcessing) return;
      isProcessing = true;
      text = text.trim();
      addMessage(text,"user");
      setOrbState("thinking");

      let answer;
      const isOnline = navigator.onLine;

      if (currentMode === "teach") {
        answer = findInNotes(text);
        if (!answer && isOnline) {
          answer = await callGroqAI(text);
        } else if (!answer) {
          answer = "Sorry, I'm offline and couldn't find that in the notes.";
        }
      } else {
        if (isOnline) {
          answer = await callGroqAI(text);
        } else {
          answer = findInNotes(text) || "Sorry, I'm offline. I can only answer from notes.";
        }
      }

      addMessage(answer,"teacher");
      speakText(answer);
      setOrbState("idle");
      isProcessing = false;
    }

    // ================= EXAM =================
    const sampleKCSEQuestions = {
      "What is photosynthesis?":"Process where plants make food using sunlight.",
      "Define gravity":"Force that attracts objects toward each other.",
      "State Newton's First Law":"An object in motion stays in motion unless acted on by a force.",
      "What is the capital of Kenya?":"Nairobi",
      "Explain evaporation":"Process where liquid changes to vapor."
    };
    function startExam(){
      const notes=loadNotesFromStorage();
      const keys=Object.keys(notes).length ? Object.keys(notes) : Object.keys(sampleKCSEQuestions);
      if(!keys.length){ addMessage("No notes found.","teacher"); speakText("No notes found."); return; }
      examQuestions = keys.sort(()=>0.5-Math.random()).slice(0,5);
      currentExamIndex=0;
      examResults=[];
      examActive=true;
      addMessage("📝 Exam started!","teacher");
      speakText("Exam started. Try your best!");
      askNextExamQuestion();
    }
    function askNextExamQuestion(){
      if(!examActive || currentExamIndex>=examQuestions.length){ examActive=false; showExamSummary(); return; }
      const q=examQuestions[currentExamIndex];
      addMessage(`Q${currentExamIndex+1}: ${q}`,"teacher");
    }
    function submitExamAnswer(answer){
      if(!examActive || isProcessing) return;
      isProcessing = true;
      const question=examQuestions[currentExamIndex];
      const notes=loadNotesFromStorage();
      const correctAnswer=(notes[question]||sampleKCSEQuestions[question]||"").toString();
      const correct = isAnswerClose(answer, correctAnswer);
      examResults.push({question,yourAnswer:answer,correct,correctAnswer});
      const feedback = correct ? "Correct! Well done." : `Not quite. Correct answer: ${correctAnswer}`;
      addMessage(feedback,"teacher");
      speakText(feedback);
      currentExamIndex++;
      isProcessing = false;
      setTimeout(()=>askNextExamQuestion(),700);
    }
    function showExamSummary(){
      let correctCount=0;
      examResults.forEach(r=>{ if(r.correct) correctCount++; });
      const percent = Math.round(correctCount / examResults.length * 100);
      const summary=`📝 Exam finished! You scored ${correctCount} out of ${examResults.length} (${percent}%)`;
      addMessage(summary,"teacher");
      speakText(`Your score is ${correctCount} out of ${examResults.length}. ${percent} percent.`);
    }

    // ================= MODES =================
    function setMode(mode){
      if (mode !== "exam" && examActive) {
        examActive = false;
        addMessage("Exam stopped.","teacher");
        speakText("Exam stopped.");
      }
      currentMode=mode;
      [teachBtn,examBtn,jarBtn].forEach(b=>{ if(b) b.classList.remove("active"); });
      const el=document.getElementById(mode+"Btn");
      if(el) el.classList.add("active");
      addMessage(`Mode switched to ${mode.toUpperCase()}`,"teacher");
      speakText(`Mode switched to ${mode}`);
      if(mode==="exam") startExam();
      if(mode==="teach"||mode==="jar"){ 
        studySessions.push({mode,timestamp:new Date().toISOString()}); 
        localStorage.setItem("studySessions",JSON.stringify(studySessions)); 
      }
    }

    // ================= MUSIC =================
    function handleMusicButton(){
      if (bgMusic && !bgMusic.paused) {
        bgMusic.pause(); bgMusic.currentTime = 0;
        if(musicBtn) musicBtn.classList.remove("active");
        speakText("Music stopped.");
        awaitingMusicSelection = false;
        return;
      }
      if(awaitingMusicSelection){ speakText("Music selection is already active."); return; }
      awaitingMusicSelection=true;
      const tracks = Object.keys(localMusicLibrary);
      speakText(`Music activated. Available tracks: ${tracks.join(", ")}. Please say the track name or type it.`);
      musicSelectionTimeout = setTimeout(()=>{ awaitingMusicSelection=false; speakText("Music selection cancelled."); }, 15000);
    }
    function handleMusicSelection(input){
      if(!awaitingMusicSelection) return false;
      clearTimeout(musicSelectionTimeout);
      const track = Object.keys(localMusicLibrary).find(t=>t.toLowerCase()===input.toLowerCase());
      if(track){
        if(bgMusic){ bgMusic.src = localMusicLibrary[track]; bgMusic.play().catch(()=>speakText("Cannot play music.")); if(musicBtn) musicBtn.classList.add("active"); }
        speakText(`Playing ${track}`);
      } else {
        speakText(`Track not found. Available tracks: ${Object.keys(localMusicLibrary).join(", ")}`);
      }
      awaitingMusicSelection=false;
      return true;
    }
    function handleStopMusic(text) {
      const lower = text.toLowerCase().trim();
      if (lower.includes("stop music") || lower.includes("stop the music") || lower === "stop" || lower === "pause") {
        if (bgMusic) { bgMusic.pause(); bgMusic.currentTime = 0; if(musicBtn) musicBtn.classList.remove("active"); }
        speakText("Music stopped.");
        awaitingMusicSelection = false;
        return true;
      }
      return false;
    }

    // ================= POMODORO =================
    function updatePomodoroDisplay(){ 
      const m=Math.floor(pomodoroTime/60); 
      const s=pomodoroTime%60; 
      if(pomodoroTimerDisplay) pomodoroTimerDisplay.textContent=`${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`; 
    }
    function startPomodoro(){ 
      if(pomodoroInterval) return; 
      speakText("Pomodoro started."); 
      pomodoroInterval=setInterval(()=>{ 
        pomodoroTime--; 
        updatePomodoroDisplay(); 
        if(pomodoroTime<=0){ 
          clearInterval(pomodoroInterval); 
          pomodoroInterval=null; 
          if(!isBreak){ 
            speakText("Break time."); 
            pomodoroTime=5*60; 
            isBreak=true; 
          } else{ 
            speakText("Back to focus."); 
            pomodoroTime=25*60; 
            isBreak=false; 
          } 
          updatePomodoroDisplay(); 
        }
      },1000); 
    }
    function resetPomodoro(){ 
      if(pomodoroInterval) clearInterval(pomodoroInterval); 
      pomodoroInterval=null; 
      pomodoroTime=25*60; 
      isBreak=false; 
      updatePomodoroDisplay(); 
      speakText("Pomodoro reset."); 
    }

    // ================= ONE-SHOT VOICE =================
    function startVoiceOnce(){
      speechSynthesis.cancel();
      speaking = false;
      blockMic = false;
      if(voiceRecognitionActive) return;
      if(!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)){ alert("Speech Recognition not supported"); return; }
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onstart = ()=>{ voiceRecognitionActive=true; setOrbState("listening"); };
      recognition.onerror = ()=>{ stopVoiceOnce(); };
      recognition.onend = ()=>{ stopVoiceOnce(); };
      recognition.onresult = (e)=>{ 
        const transcript = e.results[0][0].transcript.trim(); 
        if(transcript) handleUserInput(transcript); 
      };
      recognition.start();
    }
    function stopVoiceOnce(){
      if(recognition) recognition.stop();
      voiceRecognitionActive = false;
      setOrbState("idle");
    }

    // ================= INPUT HANDLER =================
    function handleUserInput(text){
      if(!text || isProcessing) return;
      text = text.trim();
      speechSynthesis.cancel();
      speaking = false;
      blockMic = false;
      if (handleStopMusic(text)) return;
      if(awaitingMusicSelection){ if(handleMusicSelection(text)) return; }
      if(examActive){ submitExamAnswer(text); } else { handleUserQuery(text); }
      currentTopic = text;
      localStorage.setItem("currentTopic", currentTopic);
    }

    // ================= BUTTON BINDINGS (exact wiring from original) =================
    if(notesToggle) notesToggle.onclick = toggleNotes;
    if(saveKnowledgeBtn) saveKnowledgeBtn.onclick = saveNotes;
    if(deleteKnowledgeBtn) deleteKnowledgeBtn.onclick = deleteNotes;
    if(teachBtn) teachBtn.onclick = () => setMode("teach");
    if(examBtn) examBtn.onclick = () => setMode("exam");
    if(jarBtn) jarBtn.onclick = () => setMode("jar");
    if(sendBtn) sendBtn.onclick = ()=>{ const t=userInput?userInput.value.trim():""; if(t){ handleUserInput(t); userInput.value=""; } };
    if(userInput) userInput.addEventListener("keydown",e=>{ if(e.key==="Enter"){ e.preventDefault(); if(sendBtn) sendBtn.click(); } });
    if(musicBtn) musicBtn.onclick = handleMusicButton;
    if(micBtn) micBtn.onclick = () => startVoiceOnce();
    if(voiceToggleBtn) voiceToggleBtn.onclick = () => {
      ttsEnabled = !ttsEnabled;
      if(ttsEnabled){ speakText("Voice output enabled."); voiceToggleBtn.textContent = "🔊 Voice On"; }
      else { speechSynthesis.cancel(); speakText("Voice output disabled. I will type only."); voiceToggleBtn.textContent = "🔇 Voice Off"; }
    };
    if(menuBtn) menuBtn.onclick = () => menuPanel&&menuPanel.classList.toggle("show");
    if(pomodoroBtn) pomodoroBtn.onclick = () => pomodoroPanel&&pomodoroPanel.classList.toggle("show");
    if(startPomodoroBtn) startPomodoroBtn.onclick = startPomodoro;
    if(resetPomodoroBtn) resetPomodoroBtn.onclick = resetPomodoro;

    // ================= INIT =================
    examResults = JSON.parse(localStorage.getItem("kcseExamResults")||"[]");
    studySessions = JSON.parse(localStorage.getItem("studySessions")||"[]");
    updatePomodoroDisplay();
    setOrbState("idle");
    if(currentTopic) speakText(`Welcome back! Last topic: ${currentTopic}`);
    console.log("🚀 Virtual AI Teacher - Dr. Adams Jarvis - Netlify hidden API ready!");
  });
})();