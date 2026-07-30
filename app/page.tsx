"use client";

import { useMemo, useState } from "react";

type Video = {
  title: string;
  topic: string;
  level: "입문" | "기초" | "심화";
  audience: string[];
  minutes: number;
  color: string;
  mark: string;
  description: string;
};

const videos: Video[] = [
  { title: "도서관, 처음이라면", topic: "도서관 이용", level: "입문", audience: ["학부생", "대학원생", "교직원", "지역주민"], minutes: 7, color: "mint", mark: "01", description: "대출부터 좌석 예약까지, 꼭 필요한 이용법만 빠르게 익혀요." },
  { title: "과제 자료를 더 잘 찾는 법", topic: "자료검색", level: "기초", audience: ["학부생"], minutes: 12, color: "blue", mark: "02", description: "주제어 만들기와 통합검색 활용법을 실제 과제로 연습해요." },
  { title: "학술 DB 검색 전략", topic: "학술정보", level: "심화", audience: ["대학원생", "교직원"], minutes: 18, color: "violet", mark: "03", description: "검색식을 설계하고 국내외 학술 DB를 효율적으로 탐색해요." },
  { title: "표절 없이 인용하기", topic: "연구윤리", level: "기초", audience: ["학부생", "대학원생"], minutes: 10, color: "coral", mark: "04", description: "직접·간접 인용과 참고문헌 작성의 핵심을 알아봐요." },
  { title: "논문 작성을 위한 EndNote", topic: "연구도구", level: "심화", audience: ["대학원생", "교직원"], minutes: 22, color: "yellow", mark: "05", description: "서지정보 수집부터 참고문헌 자동 생성까지 따라 해요." },
  { title: "전자책과 오디오북 즐기기", topic: "전자자료", level: "입문", audience: ["학부생", "지역주민"], minutes: 6, color: "green", mark: "06", description: "모바일에서도 편하게 전자자료를 이용하는 방법을 안내해요." },
];

const identities = [
  { name: "학부생", icon: "✦", text: "과제와 시험을 위한 자료 찾기" },
  { name: "대학원생", icon: "⌁", text: "논문 검색과 연구 도구 활용" },
  { name: "교직원", icon: "◫", text: "수업·연구 지원 자료 활용" },
  { name: "지역주민", icon: "○", text: "생활 속 독서와 전자자료 이용" },
];

const topics = ["전체", "도서관 이용", "자료검색", "학술정보", "연구윤리", "연구도구", "전자자료"];

export default function Home() {
  const [identity, setIdentity] = useState("학부생");
  const [level, setLevel] = useState<Video["level"]>("입문");
  const [interest, setInterest] = useState("자료검색");
  const [topic, setTopic] = useState("전체");
  const [showResult, setShowResult] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);

  const recommendation = useMemo(() => {
    return [...videos].sort((a, b) => {
      const score = (v: Video) => (v.audience.includes(identity) ? 3 : 0) + (v.level === level ? 2 : 0) + (v.topic === interest ? 4 : 0);
      return score(b) - score(a);
    }).slice(0, 3);
  }, [identity, level, interest]);

  const filtered = topic === "전체" ? videos : videos.filter((video) => video.topic === topic);

  const runRecommendation = () => {
    setShowResult(true);
    requestAnimationFrame(() => document.querySelector("#results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const toggleSave = (title: string) => setSaved((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title]);

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="배움서재 홈">
          <span className="brand-mark"><i /><i /><i /></span>
          <span>배움서재</span>
        </a>
        <nav aria-label="주요 메뉴">
          <a href="#recommend">맞춤 추천</a>
          <a href="#archive">영상 보관함</a>
          <a href="#guide">이용 안내</a>
        </nav>
        <button className="my-learning" onClick={() => alert(saved.length ? `저장한 영상 ${saved.length}개가 있어요.` : "아직 저장한 영상이 없어요.")}>내 학습 <span>{saved.length}</span></button>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span>●</span> LIBRARY LEARNING COMMONS</p>
          <h1>오늘의 궁금증이<br /><em>내일의 지식</em>이 되도록.</h1>
          <p className="hero-description">누구에게나 같은 교육이 아닌, 지금의 나에게 꼭 맞는 도서관 이용자 교육을 만나보세요.</p>
          <a className="primary-button" href="#recommend">나에게 맞는 교육 찾기 <span>↗</span></a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="sun" />
          <div className="book book-back"><b>RESEARCH</b></div>
          <div className="book book-mid"><b>DISCOVER</b></div>
          <div className="book book-front"><b>LEARN</b></div>
          <div className="spark spark-one">✦</div>
          <div className="spark spark-two">✦</div>
          <div className="orbit">⌁</div>
        </div>
        <div className="hero-note"><strong>48</strong><span>개의 교육 영상이<br />당신을 기다려요</span></div>
      </section>

      <section className="recommend-section" id="recommend">
        <div className="section-heading">
          <div><p className="kicker">PERSONALIZED PATH</p><h2>나를 알려주면,<br />배움의 길을 찾아드려요.</h2></div>
          <p>세 가지 질문이면 충분해요.<br />답변에 꼭 맞는 교육을 골라드릴게요.</p>
        </div>

        <div className="selector-panel">
          <div className="selector-step">
            <div className="step-title"><span>01</span><div><strong>어떤 분이신가요?</strong><small>나의 신분을 선택해주세요</small></div></div>
            <div className="identity-grid">
              {identities.map((item) => <button key={item.name} className={identity === item.name ? "identity-card active" : "identity-card"} onClick={() => { setIdentity(item.name); setShowResult(false); }}><span className="identity-icon">{item.icon}</span><strong>{item.name}</strong><small>{item.text}</small><i>{identity === item.name ? "✓" : ""}</i></button>)}
            </div>
          </div>
          <div className="selector-row">
            <div className="mini-step">
              <div className="step-title"><span>02</span><div><strong>나의 이용 수준은?</strong><small>현재 익숙한 정도를 골라주세요</small></div></div>
              <div className="segmented">{(["입문", "기초", "심화"] as const).map((item) => <button key={item} className={level === item ? "active" : ""} onClick={() => { setLevel(item); setShowResult(false); }}>{item}<small>{item === "입문" ? "처음이에요" : item === "기초" ? "조금 알아요" : "능숙해요"}</small></button>)}</div>
            </div>
            <div className="mini-step">
              <div className="step-title"><span>03</span><div><strong>무엇이 궁금한가요?</strong><small>가장 필요한 주제를 골라주세요</small></div></div>
              <select value={interest} onChange={(e) => { setInterest(e.target.value); setShowResult(false); }} aria-label="관심 주제">
                {topics.slice(1).map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
          </div>
          <button className="recommend-button" onClick={runRecommendation}>맞춤 교육 추천받기 <span>→</span></button>
        </div>
      </section>

      {showResult && <section className="result-section" id="results">
        <div className="result-intro"><p className="kicker">JUST FOR YOU</p><h2>{identity}인 당신을 위한<br />첫 번째 학습 경로예요.</h2><p><b>{level}</b> 수준과 <b>{interest}</b> 관심사를 바탕으로 골랐어요. 순서대로 보면 약 {recommendation.reduce((sum, video) => sum + video.minutes, 0)}분이 걸려요.</p></div>
        <div className="path-list">{recommendation.map((video, index) => <VideoCard key={video.title} video={video} index={index + 1} saved={saved.includes(video.title)} onSave={() => toggleSave(video.title)} />)}</div>
      </section>}

      <section className="archive-section" id="archive">
        <div className="section-heading archive-heading">
          <div><p className="kicker">VIDEO ARCHIVE</p><h2>필요한 배움을<br />한곳에서 꺼내보세요.</h2></div>
          <p>짧고 명확한 교육 영상으로<br />궁금한 순간 바로 시작할 수 있어요.</p>
        </div>
        <div className="topic-tabs" role="tablist" aria-label="영상 주제">{topics.map((item) => <button role="tab" aria-selected={topic === item} className={topic === item ? "active" : ""} onClick={() => setTopic(item)} key={item}>{item}</button>)}</div>
        <div className="video-grid">{filtered.map((video, index) => <VideoCard key={video.title} video={video} index={index + 1} saved={saved.includes(video.title)} onSave={() => toggleSave(video.title)} />)}</div>
      </section>

      <section className="guide-section" id="guide">
        <div><p className="kicker">START SMALL, GROW DEEP</p><h2>하나의 영상에서<br />시작되는 더 깊은 탐구.</h2></div>
        <ol><li><span>1</span><div><strong>나를 선택해요</strong><p>신분과 현재 수준, 관심 주제를 알려주세요.</p></div></li><li><span>2</span><div><strong>학습 경로를 받아요</strong><p>지금 필요한 영상을 알맞은 순서로 추천해요.</p></div></li><li><span>3</span><div><strong>내 속도로 배워요</strong><p>저장하고 이어 보며 배움의 기록을 쌓아보세요.</p></div></li></ol>
      </section>

      <footer><a className="brand" href="#top"><span className="brand-mark"><i /><i /><i /></span><span>배움서재</span></a><p>도서관과 사람 사이, 배움의 길을 잇습니다.</p><span>© 2026 LIBRARY LEARNING COMMONS</span></footer>
    </main>
  );
}

function VideoCard({ video, index, saved, onSave }: { video: Video; index: number; saved: boolean; onSave: () => void }) {
  return <article className="video-card">
    <div className={`thumbnail ${video.color}`}>
      <span className="thumbnail-number">{video.mark}</span>
      <button className="play" aria-label={`${video.title} 재생`} onClick={() => alert(`‘${video.title}’ 영상은 콘텐츠 연결 후 재생됩니다.`)}>▶</button>
      <span className="duration">{video.minutes}:00</span>
      <div className="thumb-lines"><i /><i /><i /></div>
    </div>
    <div className="video-info"><div className="tags"><span>{video.topic}</span><span>{video.level}</span></div><h3>{video.title}</h3><p>{video.description}</p><div className="card-bottom"><span>{video.audience.slice(0, 2).join(" · ")}</span><button className={saved ? "save active" : "save"} aria-label={saved ? "저장 취소" : "영상 저장"} onClick={onSave}>{saved ? "♥" : "♡"}</button></div></div>
  </article>;
}
