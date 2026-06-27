import { useState } from 'react';
import { useMenuStore } from '../../store/menuStore';
import { AdminLayout } from '../../components/layout';
import { ToastContainer, Modal } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { Plus, Edit2 } from 'lucide-react';
import type { Menu, RewardType } from '../../types';

export default function AdminMenus() {
  const { menus, addMenu, updateMenu, toggleActive } = useMenuStore();
  const { toasts, addToast, removeToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);

  const blankForm = {
    menuName: '',
    slug: '',
    isActive: true,
    isReferralTarget: true,
    lpUrl: '',
    rewardType: 'fixed' as RewardType,
    fixedRewardAmount: 0,
    percentageRate: 0,
    consultationFee: 0,
    consultationFeeEnabled: false,
    consultationFeeCreditable: false,
  };

  const [form, setForm] = useState(blankForm);

  const openCreate = () => {
    setEditingMenu(null);
    setForm(blankForm);
    setShowModal(true);
  };

  const openEdit = (menu: Menu) => {
    setEditingMenu(menu);
    setForm({
      menuName: menu.menuName,
      slug: menu.slug,
      isActive: menu.isActive,
      isReferralTarget: menu.isReferralTarget,
      lpUrl: menu.lpUrl || '',
      rewardType: menu.rewardType,
      fixedRewardAmount: menu.fixedRewardAmount || 0,
      percentageRate: menu.percentageRate || 0,
      consultationFee: menu.consultationFee,
      consultationFeeEnabled: menu.consultationFeeEnabled,
      consultationFeeCreditable: menu.consultationFeeCreditable,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.menuName || !form.slug) {
      addToast('メニュー名とスラッグは必須です', 'error');
      return;
    }

    if (editingMenu) {
      updateMenu(editingMenu.id, {
        ...form,
        fixedRewardAmount: Number(form.fixedRewardAmount),
        percentageRate: Number(form.percentageRate),
        consultationFee: Number(form.consultationFee),
      });
      addToast('メニューを更新しました', 'success');
    } else {
      const newMenu: Menu = {
        id: `m_${Date.now()}`,
        ...form,
        fixedRewardAmount: Number(form.fixedRewardAmount),
        percentageRate: Number(form.percentageRate),
        consultationFee: Number(form.consultationFee),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      addMenu(newMenu);
      addToast('メニューを追加しました', 'success');
    }
    setShowModal(false);
  };

  const update = (key: string, value: string | boolean | number) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  return (
    <AdminLayout title="メニュー管理">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">メニュー管理</h1>
            <p className="page-subtitle">紹介対象メニューを管理します</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} />
            メニューを追加
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {menus.map((menu) => (
          <div key={menu.id} className="card">
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.0625rem', fontWeight: 500 }}>
                    {menu.menuName}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: menu.isActive ? 'var(--color-approved-bg)' : 'var(--color-bg)',
                      border: `1px solid ${menu.isActive ? 'var(--color-approved-border)' : 'var(--color-border)'}`,
                      color: menu.isActive ? 'var(--color-approved)' : 'var(--color-text-tertiary)',
                    }}
                  >
                    {menu.isActive ? '有効' : '無効'}
                  </span>
                  {menu.isReferralTarget && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--color-accent-bg)',
                        border: '1px solid var(--color-accent-light)',
                        color: 'var(--color-accent-dark)',
                      }}
                    >
                      紹介対象
                    </span>
                  )}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                    gap: '0.75rem',
                  }}
                >
                  {[
                    { label: 'スラッグ', value: menu.slug },
                    { label: '報酬タイプ', value: menu.rewardType === 'fixed' ? '固定額' : menu.rewardType === 'percentage' ? '割合' : '段階式' },
                    { label: '固定報酬額', value: menu.fixedRewardAmount ? `¥${menu.fixedRewardAmount.toLocaleString()}` : '—' },
                    { label: '報酬率', value: menu.percentageRate ? `${menu.percentageRate}%` : '—' },
                    { label: '相談料金', value: `¥${menu.consultationFee.toLocaleString()}` },
                    { label: '有料相談', value: menu.consultationFeeEnabled ? 'ON' : 'OFF' },
                    { label: '成約時充当', value: menu.consultationFeeCreditable ? 'ON' : 'OFF' },
                  ].map((item, i) => (
                    <div key={i}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', marginBottom: '0.2rem' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                <button
                  className={`btn btn-sm ${menu.isActive ? 'btn-secondary' : 'btn-accent'}`}
                  onClick={() => {
                    toggleActive(menu.id);
                    addToast(`${menu.isActive ? '無効' : '有効'}にしました`, 'success');
                  }}
                >
                  {menu.isActive ? '無効にする' : '有効にする'}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => openEdit(menu)}
                >
                  <Edit2 size={14} />
                  編集
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* メニュー編集モーダル */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingMenu ? 'メニューを編集' : 'メニューを追加'}
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
              キャンセル
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              {editingMenu ? '更新する' : '追加する'}
            </button>
          </>
        }
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">メニュー名 <span className="required">*</span></label>
            <input
              className="form-input"
              value={form.menuName}
              onChange={(e) => update('menuName', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">スラッグ <span className="required">*</span></label>
            <input
              className="form-input"
              placeholder="propose"
              value={form.slug}
              onChange={(e) => update('slug', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">LP URL</label>
            <input
              className="form-input"
              placeholder="/propose"
              value={form.lpUrl}
              onChange={(e) => update('lpUrl', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">報酬タイプ</label>
            <select
              className="form-select"
              value={form.rewardType}
              onChange={(e) => update('rewardType', e.target.value)}
            >
              <option value="fixed">固定額</option>
              <option value="percentage">割合</option>
              <option value="tiered">段階式</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">固定報酬額（円）</label>
            <input
              className="form-input"
              type="number"
              value={form.fixedRewardAmount}
              onChange={(e) => update('fixedRewardAmount', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">報酬率（%）</label>
            <input
              className="form-input"
              type="number"
              value={form.percentageRate}
              onChange={(e) => update('percentageRate', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">相談料金（円）</label>
            <input
              className="form-input"
              type="number"
              value={form.consultationFee}
              onChange={(e) => update('consultationFee', e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
          <label className="form-radio-option">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={form.isActive}
              onChange={(e) => update('isActive', e.target.checked)}
            />
            有効
          </label>
          <label className="form-radio-option">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={form.isReferralTarget}
              onChange={(e) => update('isReferralTarget', e.target.checked)}
            />
            紹介対象
          </label>
          <label className="form-radio-option">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={form.consultationFeeEnabled}
              onChange={(e) => update('consultationFeeEnabled', e.target.checked)}
            />
            有料相談
          </label>
          <label className="form-radio-option">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={form.consultationFeeCreditable}
              onChange={(e) => update('consultationFeeCreditable', e.target.checked)}
            />
            成約時充当
          </label>
        </div>
      </Modal>
    </AdminLayout>
  );
}
