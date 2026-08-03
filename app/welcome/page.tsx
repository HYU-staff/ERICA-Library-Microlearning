"use client";

import { useEffect, useState } from "react";

type Identity="학부생"|"대학원생"|"교직원";
const choices:{name:Identity;number:string;title:string;description:string;en:string}[]=[
  {name:"학부생",number:"01",title:"학부생",description:"과제·시험을 위한 자료 검색과 도서관 이용법을 배우고 싶어요.",en:"Undergraduate"},
  {name:"대학원생",number:"02",title:"대학원생",description:"논문 검색과 연구 과정에 필요한 학술정보 활용법을 배우고 싶어요.",en:"Graduate Student"},
  {name:"교직원",number:"03",title:"교직원",description:"수업과 연구를 지원하는 자료와 전문 서비스를 활용하고 싶어요.",en:"Faculty & Staff"},
];
const affiliations=["공학대학","소프트웨어융합대학","약학대학","첨단융합대학","글로벌문화통상대학","커뮤니케이션&컬처대학","경상대학","디자인대학","예체능대학","LIONS칼리지","기타"];

export default function WelcomePage(){
  const [selected,setSelected]=useState<Identity|null>(null);
  const [affiliation,setAffiliation]=useState("");
  useEffect(()=>{const identity=window.localStorage.getItem("hakjeonggwan.identity") as Identity|null;if(identity&&choices.some((item)=>item.name===identity))setSelected(identity);setAffiliation(window.localStorage.getItem("hakjeonggwan.affiliation")??"")},[]);
  const start=()=>{if(!selected||!affiliation)return;window.localStorage.setItem("hakjeonggwan.identity",selected);window.localStorage.setItem("hakjeonggwan.affiliation",affiliation);void fetch("/api/analytics/profile",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({identity:selected,affiliation})});window.location.href="/#recommend"};
  return <main className="onboarding-page"><header><a className="brand" href="/welcome"><span className="brand-mark"><img src="/hyu-logo.png" alt="한양대학교"/></span><span>학정관 조각공부</span></a><span>WELCOME</span></header><section className="onboarding-shell"><div className="onboarding-copy"><p className="kicker">PERSONALIZED LEARNING</p><h1>당신에게 맞는 배움부터<br/><em>시작해 볼까요?</em></h1><p>신분과 소속에 따라 필요한 도서관 교육이 달라집니다.<br/>가장 알맞은 학습 경로를 위해 정보를 선택해 주세요.</p></div><div className="onboarding-select"><div className="onboarding-progress"><span>STEP 1–2 OF 2</span><i/></div><h2>신분과 소속을 선택해 주세요</h2><h3 className="onboarding-field-title"><span>01</span> 현재 신분</h3><div className="onboarding-options">{choices.map((item)=><button key={item.name} className={selected===item.name?"active":""} onClick={()=>setSelected(item.name)} aria-pressed={selected===item.name}><span className="choice-number">{item.number}</span><div><strong>{item.title}</strong><small>{item.en}</small><p>{item.description}</p></div><i>{selected===item.name?"✓":""}</i></button>)}</div><label className="affiliation-field"><span><b>02</b> 소속 대학</span><select value={affiliation} onChange={(event)=>setAffiliation(event.target.value)}><option value="">소속을 선택해 주세요</option>{affiliations.map((item)=><option key={item} value={item}>{item}</option>)}</select></label><button className="onboarding-start" disabled={!selected||!affiliation} onClick={start}>맞춤 교육 시작하기 <span>→</span></button><p className="onboarding-note">선택한 정보는 이 기기에 저장되며, 맞춤 추천에만 사용됩니다.</p></div></section></main>;
}
