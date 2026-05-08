import CounselorAuthLayout from '../../components/templates/CounselorAuthLayout/CounselorAuthLayout'

function CounselorFindPasswordPage() {
  return (
    <CounselorAuthLayout
      title="비밀번호 찾기"
      description="가입한 이메일로 임시 비밀번호 발급을 요청할 수 있습니다."
      footer={
        <p className="counselor-auth-placeholder-caption">
          발급 API 연동 정책을 확인한 뒤 다음 단계에서 연결합니다.
        </p>
      }
    >
      <div className="counselor-auth-placeholder">
        <p className="counselor-auth-placeholder-title">
          비밀번호 찾기 화면 준비 완료
        </p>
        <p className="counselor-auth-placeholder-copy">
          상담사 계정 비밀번호 발급 흐름을 화면 중심으로 먼저 정리했습니다.
        </p>
      </div>
    </CounselorAuthLayout>
  )
}

export default CounselorFindPasswordPage
