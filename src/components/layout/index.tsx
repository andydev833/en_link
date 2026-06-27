import { type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  DollarSign,
  Settings,
  Menu,
  LogOut,
} from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { usePartnerStore } from '../../store/partnerStore';
import { useReferralStore } from '../../store/referralStore';

// ============================================================
// 管理者レイアウト
// ============================================================
export function AdminLayout({ children, title }: { children: ReactNode; title: string }) {
  const navigate = useNavigate();
  const { adminLogout } = useSettingsStore();
  const { partners } = usePartnerStore();
  const { referrals } = useReferralStore();

  const pendingPartners = partners.filter((p) => p.status === 'pending').length;
  const pendingApproval = referrals.filter((r) => r.status === 'paid').length;

  const handleLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-logo">
          <div className="admin-sidebar-logo-title">En Link</div>
          <div className="admin-sidebar-logo-sub">スタジオうえじ 管理システム</div>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-nav-section">
            <div className="admin-nav-section-label">メイン</div>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `admin-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <LayoutDashboard size={16} />
              ダッシュボード
            </NavLink>
          </div>

          <div className="admin-nav-section">
            <div className="admin-nav-section-label">管理</div>
            <NavLink
              to="/admin/partners"
              className={({ isActive }) =>
                `admin-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Users size={16} />
              紹介者管理
              {pendingPartners > 0 && (
                <span className="admin-nav-badge">{pendingPartners}</span>
              )}
            </NavLink>
            <NavLink
              to="/admin/referrals"
              className={({ isActive }) =>
                `admin-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <FileText size={16} />
              紹介案件
              {pendingApproval > 0 && (
                <span className="admin-nav-badge">{pendingApproval}</span>
              )}
            </NavLink>
            <NavLink
              to="/admin/rewards"
              className={({ isActive }) =>
                `admin-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <DollarSign size={16} />
              報酬管理
            </NavLink>
          </div>

          <div className="admin-nav-section">
            <div className="admin-nav-section-label">設定</div>
            <NavLink
              to="/admin/menus"
              className={({ isActive }) =>
                `admin-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Menu size={16} />
              メニュー管理
            </NavLink>
            <NavLink
              to="/admin/settings"
              className={({ isActive }) =>
                `admin-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <Settings size={16} />
              基本設定
            </NavLink>
          </div>
        </nav>

        <div style={{ padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            className="admin-nav-item"
            onClick={handleLogout}
            style={{ width: '100%', color: 'rgba(255,255,255,0.4)' }}
          >
            <LogOut size={16} />
            ログアウト
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <h1 className="admin-topbar-title">{title}</h1>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-tertiary)' }}>
            admin@ueji.jp
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}

// ============================================================
// 紹介者レイアウト
// ============================================================
export function PartnerLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { partnerLogout } = usePartnerStore();

  const handleLogout = () => {
    partnerLogout();
    navigate('/partner/login');
  };

  return (
    <div className="partner-layout">
      <header className="partner-header">
        <div
          className="partner-header-logo"
          onClick={() => navigate('/partner/dashboard')}
          style={{ cursor: 'pointer' }}
        >
          スタジオうえじ <span>En Link</span>
        </div>
        <nav className="partner-header-nav">
          <NavLink
            to="/partner/dashboard"
            className={({ isActive }) =>
              `partner-nav-link ${isActive ? 'active' : ''}`
            }
          >
            マイページ
          </NavLink>
          <NavLink
            to="/partner/referrals"
            className={({ isActive }) =>
              `partner-nav-link ${isActive ? 'active' : ''}`
            }
          >
            紹介実績
          </NavLink>
          <NavLink
            to="/partner/materials"
            className={({ isActive }) =>
              `partner-nav-link ${isActive ? 'active' : ''}`
            }
          >
            紹介素材
          </NavLink>
          <NavLink
            to="/partner/payment"
            className={({ isActive }) =>
              `partner-nav-link ${isActive ? 'active' : ''}`
            }
          >
            振込先
          </NavLink>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleLogout}
          >
            <LogOut size={14} />
          </button>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
