"use client";

import { useState } from "react";

type Identity="학부생"|"대학원생"|"교직원";
const choices:{name:Identity;number:string;title:string;description:string;en:string}[]=[
  {name:"학부생",number:"01",title:"학부생",description:"과제·시험을 위한 자료 검색과 도서관 이용법을 배우고 싶어요.",en:"Undergraduate"},
  {name:"대학원생",number:"02",title:"대학원생",description:"논문 검색과 연구 과정에 필요한 학술정보 활용법을 배우고 싶어요.",en:"Graduate Student"},
  {name:"교직원",number:"03",title:"교직원",description:"수업과 연구를 지원하는 자료와 전문 서비스를 활용하고 싶어요.",en:"Faculty & Staff"},
];

export default function WelcomePage(){
  const [selected,setSelected]=useState<Identity|null>(null);
  const start=()=>{if(!selected)return;window.localStorage.setItem("hakjeonggwan.identity",selected);void fetch("/api/analytics/profile",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({identity:selected})});window.location.href="/#recommend"};
  return <main className="onboarding-page"><header><a className="brand" href="/welcome"><span className="brand-mark"><img src="/hyu-logo.png" alt="한양대학교"/></span><span>학정관 조각공부</span></a><span>WELCOME</span></header><section className="onboarding-shell"><div className="onboarding-copy"><p className="kicker">PERSONALIZED LEARNING</p><h1>당신에게 맞는 배움부터<br/><em>시작해 볼까요?</em></h1><p>신분에 따라 필요한 도서관 교육이 달라집니다.<br/>가장 알맞은 학습 경로를 위해 본인의 신분을 선택해 주세요.</p></div><div className="onboarding-select"><div className="onboarding-progress"><span>STEP 1 OF 1</span><i/></div><h2>현재 신분을 선택해 주세요</h2><div className="onboarding-options">{choices.map((item)=><button key={item.name} className={selected===item.name?"active":""} onClick={()=>setSelected(item.name)} aria-pressed={selected===item.name}><span className="choice-number">{item.number}</span><div><strong>{item.title}</strong><small>{item.en}</small><p>{item.description}</p></div><i>{selected===item.name?"✓":""}</i></button>)}</div><button className="onboarding-start" disabled={!selected} onClick={start}>맞춤 교육 시작하기 <span>→</span></button><p className="onboarding-note">선택한 정보는 이 기기에 저장되며, 맞춤 추천에만 사용됩니다.</p></div></section></main>;
}
