"use client";

import { useEffect, useState } from "react";

type Dashboard = {
  metrics: { users:number; accesses:number; videoViews:number; activeToday:number };
  users: { email:string; name:string|null; firstSeen:string; lastSeen:string; accessCount:number; videoViews:number; lastVideo:string|null }[];
  popularVideos: { title:string; views:number }[];
  adminEmail: string;
};

const formatDate = (value:string) => new Intl.DateTimeFormat("ko-KR", { dateStyle:"medium", timeStyle:"short" }).format(new Date(value));

export default function AdminPage() {
  const [data,setData] = useState<Dashboard|null>(null);
  const [error,setError] = useState("");
  const [loading,setLoading] = useState(true);
  const load = async()=>{ setLoading(true); setError(""); try { const response=await fetch("/api/analytics/summary",{cache:"no-store"}); if(!response.ok) throw new Error(response.status===403?"관리자만 접근할 수 있습니다.":"통계를 불러오지 못했습니다."); setData(await response.json()); } catch(err){ setError(err instanceof Error?err.message:String(err)); } finally { setLoading(false); } };
  useEffect(()=>{ void load(); },[]);

  return <main className="admin-page"><header><a className="brand" href="/"><span className="brand-mark"/><span>학정관 조각공부</span></a><div><span>ADMIN</span><a href="/">사이트로 돌아가기 ↗</a></div></header><section className="admin-shell"><div className="admin-heading"><div><p className="kicker">LEARNING ANALYTICS</p><h1>이용 현황</h1><p>접근과 영상 열람 기록은 이 화면을 만든 시점부터 누적됩니다.</p></div><button onClick={load} disabled={loading}>{loading?"불러오는 중…":"새로고침"}</button></div>{error&&<div className="admin-error">{error}</div>}{data&&<><div className="metric-grid"><Metric label="전체 이용자" value={data.metrics.users} suffix="명"/><Metric label="누적 접근" value={data.metrics.accesses} suffix="회"/><Metric label="영상 열람" value={data.metrics.videoViews} suffix="건"/><Metric label="최근 24시간 이용자" value={data.metrics.activeToday} suffix="명"/></div><div className="admin-grid"><section className="user-panel"><div className="panel-title"><div><p>USER DIRECTORY</p><h2>이용자 목록</h2></div><span>{data.users.length}명</span></div><div className="table-wrap"><table><thead><tr><th>이용자</th><th>최근 접속</th><th>접근</th><th>영상 열람</th><th>최근 열람 영상</th></tr></thead><tbody>{data.users.length?data.users.map((user)=><tr key={user.email}><td><strong>{user.name||user.email.split("@")[0]}</strong><small>{user.email}</small></td><td>{formatDate(user.lastSeen)}</td><td>{user.accessCount}회</td><td>{user.videoViews}건</td><td>{user.lastVideo||"—"}</td></tr>):<tr><td colSpan={5} className="empty-cell">아직 기록된 이용자가 없습니다.</td></tr>}</tbody></table></div></section><aside className="popular-panel"><div className="panel-title"><div><p>POPULAR CONTENT</p><h2>인기 영상</h2></div></div>{data.popularVideos.length?<ol>{data.popularVideos.map((video,index)=><li key={video.title}><span>{String(index+1).padStart(2,"0")}</span><strong>{video.title}</strong><b>{video.views}회</b></li>)}</ol>:<div className="empty-chart"><i>▶</i><p>영상 열람 기록이 쌓이면<br/>순위가 표시됩니다.</p></div>}<footer>관리자 · {data.adminEmail}</footer></aside></div></>}</section></main>;
}

function Metric({label,value,suffix}:{label:string;value:number;suffix:string}){ return <article className="metric-card"><span>{label}</span><strong>{value.toLocaleString()}<small>{suffix}</small></strong><i>↗</i></article>; }
