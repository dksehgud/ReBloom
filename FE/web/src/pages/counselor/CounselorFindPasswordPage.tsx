import CounselorAuthLayout from '../../components/templates/CounselorAuthLayout/CounselorAuthLayout'

function CounselorFindPasswordPage() {
  return (
    <CounselorAuthLayout
      title="비밀번호 찾기"
      description="상담사 계정의 임시 비밀번호 발급 요청 화면을 연결할 수 있도록 진입 구조를 준비합니다."
      footer={
        <p className="counselor-auth-placeholder-caption">
          다음 커밋에서 실제 비밀번호 찾기 폼을 연결합니다.
        </p>
      }
    >
      <div className="counselor-auth-placeholder">
        <p className="counselor-auth-placeholder-title">
          비밀번호 찾기 화면 준비 완료
        </p>
        <p className="counselor-auth-placeholder-copy">
          비밀번호 찾기 API와 연결되는 상담사 전용 요청 폼이 이 위치에
          들어갑니다.
        </p>
      </div>
    </CounselorAuthLayout>
  )
}

export default CounselorFindPasswordPage
