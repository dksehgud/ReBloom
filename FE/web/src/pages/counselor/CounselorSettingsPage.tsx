import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronLeft, FiLogOut } from 'react-icons/fi'

type SettingsSection = 'profile' | 'account'

type SettingsField = {
  id: string
  label: string
  type?: string
  value: string
}

const profileFields: SettingsField[] = [
  { id: 'name', label: '이름', value: '김상담' },
  { id: 'email', label: '이메일', type: 'email', value: 'counselor@rebloom.com' },
  { id: 'phone', label: '전화번호', type: 'tel', value: '010-1234-5678' },
  { id: 'hospitalName', label: '병원/센터 이름', value: 'RE:BLOOM 심리상담센터' },
  { id: 'hospitalAddress', label: '주소', value: '서울특별시 강남구 테헤란로 123' },
  { id: 'hospitalAddressDetail', label: '상세주소', value: '2층 203호' },
]

const accountFields: SettingsField[] = [
  { id: 'currentPassword', label: '현재 비밀번호', type: 'password', value: '' },
  { id: 'newPassword', label: '새 비밀번호', type: 'password', value: '' },
  { id: 'newPasswordConfirm', label: '새 비밀번호 확인', type: 'password', value: '' },
]

function SettingsInput({ field }: { field: SettingsField }) {
  return (
    <label className="counselor-settings-field" htmlFor={`counselor-${field.id}`}>
      <span>{field.label}</span>
      <input
        id={`counselor-${field.id}`}
        type={field.type ?? 'text'}
        defaultValue={field.value}
        placeholder={field.type === 'password' ? '비밀번호를 입력하세요' : undefined}
      />
    </label>
  )
}

function CounselorSettingsPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')
  const isProfileSection = activeSection === 'profile'

  return (
    <main className="counselor-settings-page">
      <aside className="counselor-settings-sidebar">
        <header className="counselor-settings-sidebar__header">
          <button type="button" onClick={() => navigate('/counselor/dashboard')}>
            <FiChevronLeft aria-hidden="true" />
            <span>대시보드</span>
          </button>
        </header>

        <section className="counselor-settings-sidebar__body">
          <h2>설정</h2>
          <nav className="counselor-settings-sidebar__nav" aria-label="상담사 설정">
            <button
              type="button"
              className={isProfileSection ? 'is-active' : undefined}
              onClick={() => setActiveSection('profile')}
            >
              프로필 정보
            </button>
            <button
              type="button"
              className={!isProfileSection ? 'is-active' : undefined}
              onClick={() => setActiveSection('account')}
            >
              계정 설정
            </button>
          </nav>
        </section>

        <footer className="counselor-settings-sidebar__footer">
          <button type="button">
            <FiLogOut aria-hidden="true" />
            <span>로그아웃</span>
          </button>
        </footer>
      </aside>

      <section className="counselor-settings-main">
        <div className="counselor-settings-content">
          <h1>{isProfileSection ? '프로필 정보' : '계정 설정'}</h1>

          {isProfileSection ? (
            <form
              className="counselor-settings-card"
              onSubmit={(event) => event.preventDefault()}
            >
              {profileFields.map((field) => (
                <SettingsInput field={field} key={field.id} />
              ))}
              <div className="counselor-settings-actions">
                <button type="submit">저장하기</button>
              </div>
            </form>
          ) : (
            <form
              className="counselor-settings-card counselor-settings-card--compact"
              onSubmit={(event) => event.preventDefault()}
            >
              <h2>비밀번호 변경</h2>
              {accountFields.map((field) => (
                <SettingsInput field={field} key={field.id} />
              ))}
              <div className="counselor-settings-actions">
                <button type="submit">비밀번호 변경</button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}

export default CounselorSettingsPage
