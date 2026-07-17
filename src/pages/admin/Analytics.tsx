import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '../../components/layout';
import { StatCard } from '../../components/ui';
import { callGas, isGasConfigured } from '../../lib/gasApi';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, Users, MousePointerClick, FileText, AlertCircle } from 'lucide-react';

// -------------------------------------------------------
// 型定義
// -------------------------------------------------------
interface AnalyticsSummary {
  totalPageViews: number;
  totalUniqueVisitors: number;
  totalCtaClicks: number;
  ctaClickRate: number;
  totalFormViews: number;
  totalFormStarts: number;
  totalFormSubmits: number;
  formAbandonRate: number;
  cvr: number;
}

interface DailyTrend {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
  ctaClicks: number;
  formSubmits: number;
}

interface SourceAnalytics {
  utmSource: string;
  utmMedium: string;
  pageViews: number;
  formSubmits: number;
  cvr: number;
}

interface PartnerAnalytics {
  partnerId: string;
  partnerName: string;
  pageViews: number;
  formSubmits: number;
  cvr: number;
}

interface DeviceAnalytics {
  deviceType: string;
  pageViews: number;
  formSubmits: number;
  cvr: number;
}

interface SectionViewAnalytics {
  sectionKey: string;
  sectionName: string;
  viewCount: number;
  viewRate: number;
}

// -------------------------------------------------------
// ダミーデータ（GAS未設定時）
// -------------------------------------------------------
const DUMMY_SUMMARY: AnalyticsSummary = {
  totalPageViews: 1248,
  totalUniqueVisitors: 876,
  totalCtaClicks: 312,
  ctaClickRate: 25.0,
  totalFormViews: 198,
  totalFormStarts: 156,
  totalFormSubmits: 43,
  formAbandonRate: 72.4,
  cvr: 3.4,
};

const DUMMY_DAILY: DailyTrend[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return {
    date: `${d.getMonth() + 1}/${d.getDate()}`,
    pageViews: Math.floor(30 + Math.random() * 60),
    uniqueVisitors: Math.floor(20 + Math.random() * 40),
    ctaClicks: Math.floor(5 + Math.random() * 20),
    formSubmits: Math.floor(0 + Math.random() * 5),
  };
});

const DUMMY_SOURCES: SourceAnalytics[] = [
  { utmSource: 'line', utmMedium: 'message', pageViews: 456, formSubmits: 18, cvr: 3.9 },
  { utmSource: 'instagram', utmMedium: 'dm', pageViews: 312, formSubmits: 11, cvr: 3.5 },
  { utmSource: 'email', utmMedium: 'message', pageViews: 189, formSubmits: 8, cvr: 4.2 },
  { utmSource: 'qr', utmMedium: 'offline', pageViews: 142, formSubmits: 4, cvr: 2.8 },
  { utmSource: 'sns', utmMedium: 'post', pageViews: 98, formSubmits: 2, cvr: 2.0 },
  { utmSource: '(direct)', utmMedium: '—', pageViews: 51, formSubmits: 0, cvr: 0 },
];

const DUMMY_PARTNERS: PartnerAnalytics[] = [
  { partnerId: 'p1', partnerName: '山田花子', pageViews: 387, formSubmits: 15, cvr: 3.9 },
  { partnerId: 'p2', partnerName: '田中一郎', pageViews: 261, formSubmits: 9, cvr: 3.4 },
  { partnerId: 'p3', partnerName: '佐藤美咲', pageViews: 198, formSubmits: 7, cvr: 3.5 },
];

const DUMMY_DEVICES: DeviceAnalytics[] = [
  { deviceType: 'mobile', pageViews: 874, formSubmits: 31, cvr: 3.5 },
  { deviceType: 'desktop', pageViews: 312, formSubmits: 10, cvr: 3.2 },
  { deviceType: 'tablet', pageViews: 62, formSubmits: 2, cvr: 3.2 },
];

const DUMMY_SECTIONS: SectionViewAnalytics[] = [
  { sectionKey: 'hero', sectionName: 'ファーストビュー', viewCount: 1248, viewRate: 100 },
  { sectionKey: 'chapel', sectionName: 'チャペル訴求', viewCount: 986, viewRate: 79.0 },
  { sectionKey: 'surprise', sectionName: 'サプライズ演出', viewCount: 812, viewRate: 65.1 },
  { sectionKey: 'features', sectionName: '演出でできること', viewCount: 698, viewRate: 55.9 },
  { sectionKey: 'pricing', sectionName: '料金', viewCount: 623, viewRate: 49.9 },
  { sectionKey: 'flow', sectionName: '相談の流れ', viewCount: 521, viewRate: 41.7 },
  { sectionKey: 'voices', sectionName: 'お客様の声', viewCount: 412, viewRate: 33.0 },
  { sectionKey: 'gallery', sectionName: 'ギャラリー', viewCount: 356, viewRate: 28.5 },
  { sectionKey: 'faq', sectionName: 'FAQ', viewCount: 298, viewRate: 23.9 },
  { sectionKey: 'cta_final', sectionName: '最終CTA', viewCount: 234, viewRate: 18.8 },
];

const COLORS = ['#C9A96E', '#B8936A', '#A67C52', '#E5D5B7', '#8B6914'];
const DEVICE_LABELS: Record<string, string> = { mobile: 'モバイル', desktop: 'デスクトップ', tablet: 'タブレット' };

// -------------------------------------------------------
// コンポーネント
// -------------------------------------------------------
export default function AdminAnalytics() {
  const [summary, setSummary] = useState<AnalyticsSummary>(DUMMY_SUMMARY);
  const [daily, setDaily] = useState<DailyTrend[]>(DUMMY_DAILY);
  const [sources, setSources] = useState<SourceAnalytics[]>(DUMMY_SOURCES);
  const [partners, setPartners] = useState<PartnerAnalytics[]>(DUMMY_PARTNERS);
  const [devices, setDevices] = useState<DeviceAnalytics[]>(DUMMY_DEVICES);
  const [sections, setSections] = useState<SectionViewAnalytics[]>(DUMMY_SECTIONS);
  const [tab, setTab] = useState<'overview' | 'source' | 'partner' | 'section'>('overview');
  const [isGas] = useState(isGasConfigured());

  useEffect(() => {
    if (!isGas) return;
    Promise.all([
      callGas<AnalyticsSummary>('getAnalyticsSummary', {}).then((r) => r.data && setSummary(r.data)),
      callGas<DailyTrend[]>('getDailyAccessTrend', {}).then((r) => r.data && setDaily(r.data)),
      callGas<SourceAnalytics[]>('getSourceAnalytics', {}).then((r) => r.data && setSources(r.data)),
      callGas<PartnerAnalytics[]>('getPartnerAnalytics', {}).then((r) => r.data && setPartners(r.data)),
      callGas<DeviceAnalytics[]>('getDeviceAnalytics', {}).then((r) => r.data && setDevices(r.data)),
      callGas<SectionViewAnalytics[]>('getSectionViewAnalytics', {}).then((r) => r.data && setSections(r.data)),
    ]);
  }, [isGas]);

  const deviceData = useMemo(() =>
    devices.map((d) => ({ name: DEVICE_LABELS[d.deviceType] || d.deviceType, value: d.pageViews })),
    [devices]
  );

  return (
    <AdminLayout title="LP分析">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">LP分析</h1>
            <p className="page-subtitle">プロポーズLPのアクセス・CVR・離脱状況</p>
          </div>
          {!isGas && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-pending)', background: 'var(--color-pending-bg)', border: '1px solid var(--color-pending-border)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
              <AlertCircle size={14} />
              ダミーデータ表示中（GAS未接続）
            </div>
          )}
        </div>
      </div>

      {/* サマリーカード */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard label="総アクセス数" value={summary.totalPageViews.toLocaleString()} icon={<Users size={18} />} />
        <StatCard label="ユニーク訪問者" value={summary.totalUniqueVisitors.toLocaleString()} icon={<Users size={18} />} />
        <StatCard label="CTAクリック数" value={summary.totalCtaClicks.toLocaleString()} icon={<MousePointerClick size={18} />} />
        <StatCard label="CTAクリック率" value={`${summary.ctaClickRate.toFixed(1)}%`} icon={<TrendingUp size={18} />} />
        <StatCard label="フォーム送信" value={summary.totalFormSubmits.toLocaleString()} icon={<FileText size={18} />} />
        <StatCard label="相談申込率(CVR)" value={`${summary.cvr.toFixed(1)}%`} icon={<TrendingUp size={18} />} accent />
        <StatCard label="フォーム離脱率" value={`${summary.formAbandonRate.toFixed(1)}%`} icon={<TrendingUp size={18} />} />
      </div>

      {/* タブ */}
      <div className="filter-bar" style={{ marginBottom: '1.5rem' }}>
        {[
          { key: 'overview', label: '概要・推移' },
          { key: 'source', label: '流入元別' },
          { key: 'partner', label: '紹介者別' },
          { key: 'section', label: 'セクション別' },
        ].map((t) => (
          <button
            key={t.key}
            className={`btn ${tab === t.key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setTab(t.key as typeof tab)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 概要・推移 */}
      {tab === 'overview' && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.9375rem' }}>日別アクセス推移（30日）</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pageViews" name="アクセス数" stroke="#C9A96E" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="uniqueVisitors" name="ユニーク" stroke="#8B6914" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ctaClicks" name="CTAクリック" stroke="#6B8E6E" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="formSubmits" name="フォーム送信" stroke="#E5705A" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.9375rem' }}>デバイス別アクセス</div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={deviceData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                    {deviceData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.9375rem' }}>ファネル</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'LPアクセス', value: summary.totalPageViews, rate: 100 },
                  { label: 'CTAクリック', value: summary.totalCtaClicks, rate: summary.ctaClickRate },
                  { label: 'フォーム到達', value: summary.totalFormViews, rate: summary.totalPageViews ? (summary.totalFormViews / summary.totalPageViews * 100) : 0 },
                  { label: 'フォーム送信', value: summary.totalFormSubmits, rate: summary.cvr },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>{item.label}</span>
                      <span style={{ fontWeight: 600 }}>{item.value.toLocaleString()} <span style={{ color: 'var(--color-accent)', fontWeight: 400 }}>({item.rate.toFixed(1)}%)</span></span>
                    </div>
                    <div style={{ background: 'var(--color-bg)', borderRadius: 4, height: 6 }}>
                      <div style={{ background: 'var(--color-accent)', height: 6, borderRadius: 4, width: `${item.rate}%`, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* 流入元別 */}
      {tab === 'source' && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.9375rem' }}>流入元別CVR</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sources}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="utmSource" tick={{ fontSize: 11 }} />
                <YAxis unit="%" tick={{ fontSize: 11 }} />
                <Bar dataKey="cvr" name="CVR" fill="#C9A96E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>流入元</th>
                  <th>媒体</th>
                  <th>アクセス数</th>
                  <th>フォーム送信</th>
                  <th>CVR</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500 }}>{s.utmSource}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{s.utmMedium}</td>
                    <td>{s.pageViews.toLocaleString()}</td>
                    <td>{s.formSubmits}</td>
                    <td style={{ fontWeight: 600, color: 'var(--color-accent-dark)' }}>{s.cvr.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* 紹介者別 */}
      {tab === 'partner' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>紹介者名</th>
                <th>アクセス数</th>
                <th>フォーム送信</th>
                <th>CVR</th>
              </tr>
            </thead>
            <tbody>
              {partners.map((p) => (
                <tr key={p.partnerId}>
                  <td style={{ fontWeight: 500 }}>{p.partnerName}</td>
                  <td>{p.pageViews.toLocaleString()}</td>
                  <td>{p.formSubmits}</td>
                  <td style={{ fontWeight: 600, color: 'var(--color-accent-dark)' }}>{p.cvr.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* セクション別 */}
      {tab === 'section' && (
        <div className="card">
          <div style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.9375rem' }}>セクション別閲覧率</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {sections.map((s) => (
              <div key={s.sectionKey}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{s.sectionName}</span>
                  <span style={{ fontWeight: 600 }}>{s.viewCount.toLocaleString()} <span style={{ color: 'var(--color-accent)', fontWeight: 400 }}>({s.viewRate.toFixed(1)}%)</span></span>
                </div>
                <div style={{ background: 'var(--color-bg)', borderRadius: 4, height: 6 }}>
                  <div style={{ background: `hsl(${s.viewRate}, 50%, 55%)`, height: 6, borderRadius: 4, width: `${s.viewRate}%`, transition: 'width 0.5s' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
