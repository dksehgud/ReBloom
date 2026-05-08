import CounselorAuthLayout from '../../components/templates/CounselorAuthLayout/CounselorAuthLayout'

function CounselorLoginPage() {
  return (
    <CounselorAuthLayout
      title="상담사 로그인"
      description="상담사 계정으로 로그인해 리블룸 대시보드에 접속하세요."
      footer={
        <p className="counselor-auth-placeholder-caption">
          다음 커밋에서 실제 로그인 폼을 연결합니다.
        </p>
      }
    >
      <div className="counselor-auth-placeholder">
        <p className="counselor-auth-placeholder-title">로그인 화면 준비 완료</p>
        <p className="counselor-auth-placeholder-copy">
          이 경로에 상담사 전용 로그인 폼이 연결될 예정입니다.
        </p>
      </div>
    </CounselorAuthLayout>
  )
}

export default CounselorLoginPage
