"use client";

import { useEffect, useMemo, useState } from "react";

type Lang = "ko" | "en";
type Video = { title: string; topic: string; level: "입문" | "기초" | "심화"; audience: string[]; minutes: number; color: string; mark: string; description: string };

const videos: Video[] = [
  { title:"도서관, 처음이라면", topic:"도서관 이용", level:"입문", audience:["학부생","대학원생","교직원","지역주민"], minutes:7, color:"mint", mark:"01", description:"대출부터 좌석 예약까지, 꼭 필요한 이용법만 빠르게 익혀요." },
  { title:"과제 자료를 더 잘 찾는 법", topic:"자료검색", level:"기초", audience:["학부생"], minutes:12, color:"blue", mark:"02", description:"주제어 만들기와 통합검색 활용법을 실제 과제로 연습해요." },
  { title:"학술 DB 검색 전략", topic:"학술정보", level:"심화", audience:["대학원생","교직원"], minutes:18, color:"violet", mark:"03", description:"검색식을 설계하고 국내외 학술 DB를 효율적으로 탐색해요." },
  { title:"표절 없이 인용하기", topic:"연구윤리", level:"기초", audience:["학부생","대학원생"], minutes:10, color:"coral", mark:"04", description:"직접·간접 인용과 참고문헌 작성의 핵심을 알아봐요." },
  { title:"논문 작성을 위한 EndNote", topic:"연구도구", level:"심화", audience:["대학원생","교직원"], minutes:22, color:"yellow", mark:"05", description:"서지정보 수집부터 참고문헌 자동 생성까지 따라 해요." },
  { title:"전자책과 오디오북 즐기기", topic:"전자자료", level:"입문", audience:["학부생","지역주민"], minutes:6, color:"green", mark:"06", description:"모바일에서도 편하게 전자자료를 이용하는 방법을 안내해요." },
];

const enVideo: Record<string, { title:string; description:string }> = {
  "도서관, 처음이라면":{ title:"New to the Library?", description:"Learn the essentials—from borrowing books to reserving a study seat." },
  "과제 자료를 더 잘 찾는 법":{ title:"Find Better Sources for Assignments", description:"Practice building keywords and using integrated search with a real assignment." },
  "학술 DB 검색 전략":{ title:"Academic Database Search Strategies", description:"Design search queries and explore domestic and international databases efficiently." },
  "표절 없이 인용하기":{ title:"Cite Sources Without Plagiarism", description:"Master direct and indirect citations and the basics of reference lists." },
  "논문 작성을 위한 EndNote":{ title:"EndNote for Academic Writing", description:"Collect bibliographic data and generate reference lists automatically." },
  "전자책과 오디오북 즐기기":{ title:"Enjoy E-books & Audiobooks", description:"Access and enjoy the library's digital collection on your mobile device." },
};

const topicNames: Record<string,string> = { "전체":"All", "도서관 이용":"Library Basics", "자료검색":"Searching", "학술정보":"Academic Research", "연구윤리":"Research Ethics", "연구도구":"Research Tools", "전자자료":"Digital Resources" };
const identityNames: Record<string,string> = { "학부생":"Undergraduate", "대학원생":"Graduate Student", "교직원":"Faculty & Staff", "지역주민":"Community Member" };
const levelNames: Record<string,string> = { "입문":"Starter", "기초":"Beginner", "심화":"Advanced" };
const identities = [
  { name:"학부생", icon:"✦", ko:"과제와 시험을 위한 자료 찾기", en:"Find sources for assignments and exams" },
  { name:"대학원생", icon:"⌁", ko:"논문 검색과 연구 도구 활용", en:"Search papers and use research tools" },
  { name:"교직원", icon:"◫", ko:"수업·연구 지원 자료 활용", en:"Find resources for teaching and research" },
  { name:"지역주민", icon:"○", ko:"생활 속 독서와 전자자료 이용", en:"Enjoy reading and digital resources" },
];
const topics = ["전체","도서관 이용","자료검색","학술정보","연구윤리","연구도구","전자자료"];

const copy = {
  ko:{ brand:"배움서재", navRecommend:"맞춤 추천", navArchive:"영상 보관함", navGuide:"이용 안내", myLearning:"내 학습", savedAlert:(n:number)=>n?`저장한 영상 ${n}개가 있어요.`:"아직 저장한 영상이 없어요.", heroA:"오늘의 궁금증이", heroB:"내일의 지식", heroC:"이 되도록.", heroDesc:"누구에게나 같은 교육이 아닌, 지금의 나에게 꼭 맞는 도서관 이용자 교육을 만나보세요.", heroCta:"나에게 맞는 교육 찾기", videoCount:"개의 교육 영상이\n당신을 기다려요", recommendTitle:"나를 알려주면,\n배움의 길을 찾아드려요.", recommendDesc:"세 가지 질문이면 충분해요.\n답변에 꼭 맞는 교육을 골라드릴게요.", q1:"어떤 분이신가요?", q1sub:"나의 신분을 선택해주세요", q2:"나의 이용 수준은?", q2sub:"현재 익숙한 정도를 골라주세요", q3:"무엇이 궁금한가요?", q3sub:"가장 필요한 주제를 골라주세요", levelSubs:["처음이에요","조금 알아요","능숙해요"], getRecommendation:"맞춤 교육 추천받기", resultTitle:(who:string)=>`${who}인 당신을 위한\n첫 번째 학습 경로예요.`, resultDesc:(lv:string,tp:string,min:number)=>`${lv} 수준과 ${tp} 관심사를 바탕으로 골랐어요. 순서대로 보면 약 ${min}분이 걸려요.`, archiveTitle:"필요한 배움을\n한곳에서 꺼내보세요.", archiveDesc:"짧고 명확한 교육 영상으로\n궁금한 순간 바로 시작할 수 있어요.", guideTitle:"하나의 영상에서\n시작되는 더 깊은 탐구.", guides:[["나를 선택해요","신분과 현재 수준, 관심 주제를 알려주세요."],["학습 경로를 받아요","지금 필요한 영상을 알맞은 순서로 추천해요."],["내 속도로 배워요","저장하고 이어 보며 배움의 기록을 쌓아보세요."]], footer:"도서관과 사람 사이, 배움의 길을 잇습니다.", play:(title:string)=>`‘${title}’ 영상은 콘텐츠 연결 후 재생됩니다.`, playLabel:(title:string)=>`${title} 재생`, save:"영상 저장", unsave:"저장 취소" },
  en:{ brand:"Learning Library", navRecommend:"For You", navArchive:"Video Library", navGuide:"How It Works", myLearning:"My Learning", savedAlert:(n:number)=>n?`You have ${n} saved video${n>1?"s":""}.`:"You haven't saved any videos yet.", heroA:"Let today's questions", heroB:"become tomorrow's knowledge", heroC:".", heroDesc:"Skip one-size-fits-all training. Discover library lessons tailored to who you are and what you need now.", heroCta:"Find my learning path", videoCount:"learning videos\nare waiting for you", recommendTitle:"Tell us about yourself.\nWe'll map your learning path.", recommendDesc:"Three quick answers are all it takes.\nWe'll select the right lessons for you.", q1:"Who are you?", q1sub:"Choose the role that best describes you", q2:"How familiar are you?", q2sub:"Choose your current experience level", q3:"What do you want to learn?", q3sub:"Select the topic you need most", levelSubs:["Brand new","Some experience","Confident"], getRecommendation:"Get my recommendations", resultTitle:(who:string)=>`A first learning path,\nselected for ${who.toLowerCase()}s.`, resultDesc:(lv:string,tp:string,min:number)=>`Selected for your ${lv.toLowerCase()} level and interest in ${tp.toLowerCase()}. It takes about ${min} minutes in order.`, archiveTitle:"Every lesson you need,\nready in one place.", archiveDesc:"Short, focused videos help you start\nthe moment a question comes up.", guideTitle:"One video can begin\na deeper exploration.", guides:[["Tell us about you","Choose your role, experience level, and area of interest."],["Get a learning path","We'll recommend the right videos in a useful order."],["Learn at your pace","Save videos, continue later, and build your learning record."]], footer:"Connecting people and libraries through learning.", play:(title:string)=>`“${title}” will play once video content is connected.`, playLabel:(title:string)=>`Play ${title}`, save:"Save video", unsave:"Remove saved video" },
};

export default function Home() {
  const [lang,setLang] = useState<Lang>("ko");
  const [identity,setIdentity] = useState("학부생");
  const [level,setLevel] = useState<Video["level"]>("입문");
  const [interest,setInterest] = useState("자료검색");
  const [topic,setTopic] = useState("전체");
  const [showResult,setShowResult] = useState(false);
  const [saved,setSaved] = useState<string[]>([]);
  const t = copy[lang];
  const displayIdentity = (value:string)=>lang==="ko"?value:identityNames[value];
  const displayLevel = (value:string)=>lang==="ko"?value:levelNames[value];
  const displayTopic = (value:string)=>lang==="ko"?value:topicNames[value];
  useEffect(()=>{ document.documentElement.lang=lang; },[lang]);

  const recommendation = useMemo(()=>[...videos].sort((a,b)=>{ const score=(v:Video)=>(v.audience.includes(identity)?3:0)+(v.level===level?2:0)+(v.topic===interest?4:0); return score(b)-score(a); }).slice(0,3),[identity,level,interest]);
  const filtered = topic==="전체"?videos:videos.filter((video)=>video.topic===topic);
  const toggleSave=(title:string)=>setSaved((current)=>current.includes(title)?current.filter((item)=>item!==title):[...current,title]);
  const chooseLang=(next:Lang)=>{ setLang(next); setShowResult(false); };
  const runRecommendation=()=>{ setShowResult(true); requestAnimationFrame(()=>document.querySelector("#results")?.scrollIntoView({behavior:"smooth",block:"start"})); };

  return <main className="dark-site">
    <header className="site-header">
      <a className="brand" href="#top" aria-label={`${t.brand} home`}><span className="brand-mark"><i/><i/><i/></span><span>{t.brand}</span></a>
      <nav aria-label={lang==="ko"?"주요 메뉴":"Main menu"}><a href="#recommend">{t.navRecommend}</a><a href="#archive">{t.navArchive}</a><a href="#guide">{t.navGuide}</a></nav>
      <div className="header-actions"><div className="language-switch" role="group" aria-label={lang==="ko"?"언어 선택":"Language selector"}><button className={lang==="ko"?"active":""} onClick={()=>chooseLang("ko")} aria-pressed={lang==="ko"}>한국어</button><button className={lang==="en"?"active":""} onClick={()=>chooseLang("en")} aria-pressed={lang==="en"}>English</button></div><button className="my-learning" onClick={()=>alert(t.savedAlert(saved.length))}>{t.myLearning} <span>{saved.length}</span></button></div>
    </header>

    <section className="hero" id="top"><div className="hero-copy"><p className="eyebrow"><span>●</span> LIBRARY LEARNING COMMONS</p><h1>{t.heroA}<br/><em>{t.heroB}</em>{t.heroC}</h1><p className="hero-description">{t.heroDesc}</p><a className="primary-button" href="#recommend">{t.heroCta} <span>↗</span></a></div><div className="hero-art" aria-hidden="true"><div className="sun"/><div className="book book-back"><b>RESEARCH</b></div><div className="book book-mid"><b>DISCOVER</b></div><div className="book book-front"><b>LEARN</b></div><div className="spark spark-one">✦</div><div className="spark spark-two">✦</div><div className="orbit">⌁</div></div><div className="hero-note"><strong>48</strong><span>{t.videoCount.split("\n").map((line,i)=><span key={line}>{line}{i===0&&<br/>}</span>)}</span></div></section>

    <section className="recommend-section" id="recommend"><div className="section-heading"><div><p className="kicker">PERSONALIZED PATH</p><h2>{t.recommendTitle.split("\n").map((line,i)=><span key={line}>{line}{i===0&&<br/>}</span>)}</h2></div><p>{t.recommendDesc.split("\n").map((line,i)=><span key={line}>{line}{i===0&&<br/>}</span>)}</p></div><div className="selector-panel"><div className="selector-step"><div className="step-title"><span>01</span><div><strong>{t.q1}</strong><small>{t.q1sub}</small></div></div><div className="identity-grid">{identities.map((item)=><button key={item.name} className={identity===item.name?"identity-card active":"identity-card"} onClick={()=>{setIdentity(item.name);setShowResult(false)}}><span className="identity-icon">{item.icon}</span><strong>{displayIdentity(item.name)}</strong><small>{lang==="ko"?item.ko:item.en}</small><i>{identity===item.name?"✓":""}</i></button>)}</div></div><div className="selector-row"><div className="mini-step"><div className="step-title"><span>02</span><div><strong>{t.q2}</strong><small>{t.q2sub}</small></div></div><div className="segmented">{(["입문","기초","심화"] as const).map((item,index)=><button key={item} className={level===item?"active":""} onClick={()=>{setLevel(item);setShowResult(false)}}>{displayLevel(item)}<small>{t.levelSubs[index]}</small></button>)}</div></div><div className="mini-step"><div className="step-title"><span>03</span><div><strong>{t.q3}</strong><small>{t.q3sub}</small></div></div><select value={interest} onChange={(e)=>{setInterest(e.target.value);setShowResult(false)}} aria-label={t.q3}>{topics.slice(1).map((item)=><option key={item} value={item}>{displayTopic(item)}</option>)}</select></div></div><button className="recommend-button" onClick={runRecommendation}>{t.getRecommendation} <span>→</span></button></div></section>

    {showResult&&<section className="result-section" id="results"><div className="result-intro"><p className="kicker">JUST FOR YOU</p><h2>{t.resultTitle(displayIdentity(identity)).split("\n").map((line,i)=><span key={line}>{line}{i===0&&<br/>}</span>)}</h2><p>{t.resultDesc(displayLevel(level),displayTopic(interest),recommendation.reduce((sum,video)=>sum+video.minutes,0))}</p></div><div className="path-list">{recommendation.map((video)=><VideoCard key={video.title} video={video} lang={lang} saved={saved.includes(video.title)} onSave={()=>toggleSave(video.title)}/>)}</div></section>}

    <section className="archive-section" id="archive"><div className="section-heading archive-heading"><div><p className="kicker">VIDEO ARCHIVE</p><h2>{t.archiveTitle.split("\n").map((line,i)=><span key={line}>{line}{i===0&&<br/>}</span>)}</h2></div><p>{t.archiveDesc.split("\n").map((line,i)=><span key={line}>{line}{i===0&&<br/>}</span>)}</p></div><div className="topic-tabs" role="tablist" aria-label={lang==="ko"?"영상 주제":"Video topics"}>{topics.map((item)=><button role="tab" aria-selected={topic===item} className={topic===item?"active":""} onClick={()=>setTopic(item)} key={item}>{displayTopic(item)}</button>)}</div><div className="video-grid">{filtered.map((video)=><VideoCard key={video.title} video={video} lang={lang} saved={saved.includes(video.title)} onSave={()=>toggleSave(video.title)}/>)}</div></section>

    <section className="guide-section" id="guide"><div><p className="kicker">START SMALL, GROW DEEP</p><h2>{t.guideTitle.split("\n").map((line,i)=><span key={line}>{line}{i===0&&<br/>}</span>)}</h2></div><ol>{t.guides.map((guide,index)=><li key={guide[0]}><span>{index+1}</span><div><strong>{guide[0]}</strong><p>{guide[1]}</p></div></li>)}</ol></section>
    <footer><a className="brand" href="#top"><span className="brand-mark"><i/><i/><i/></span><span>{t.brand}</span></a><p>{t.footer}</p><span>© 2026 LIBRARY LEARNING COMMONS</span></footer>
  </main>;
}

function VideoCard({video,lang,saved,onSave}:{video:Video;lang:Lang;saved:boolean;onSave:()=>void}){
  const t=copy[lang]; const translated=enVideo[video.title]; const title=lang==="ko"?video.title:translated.title; const description=lang==="ko"?video.description:translated.description;
  return <article className="video-card"><div className={`thumbnail ${video.color}`}><span className="thumbnail-number">{video.mark}</span><button className="play" aria-label={t.playLabel(title)} onClick={()=>alert(t.play(title))}>▶</button><span className="duration">{video.minutes}:00</span><div className="thumb-lines"><i/><i/><i/></div></div><div className="video-info"><div className="tags"><span>{lang==="ko"?video.topic:topicNames[video.topic]}</span><span>{lang==="ko"?video.level:levelNames[video.level]}</span></div><h3>{title}</h3><p>{description}</p><div className="card-bottom"><span>{video.audience.slice(0,2).map((item)=>lang==="ko"?item:identityNames[item]).join(" · ")}</span><button className={saved?"save active":"save"} aria-label={saved?t.unsave:t.save} onClick={onSave}>{saved?"♥":"♡"}</button></div></div></article>;
}
