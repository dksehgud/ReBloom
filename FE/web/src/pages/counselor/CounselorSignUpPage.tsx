import CounselorAuthLayout from '../../components/templates/CounselorAuthLayout/CounselorAuthLayout'

function CounselorSignUpPage() {
  return (
    <CounselorAuthLayout
      title="상담사 회원가입"
      description="이메일 인증과 병원 정보 입력을 포함한 상담사 전용 회원가입 흐름을 준비합니다."
      footer={
        <p className="counselor-auth-placeholder-caption">
          다음 커밋에서 단계별 회원가입 폼을 연결합니다.
        </p>
      }
    >
      <div className="counselor-auth-placeholder">
        <p className="counselor-auth-placeholder-title">회원가입 화면 준비 완료</p>
        <p className="counselor-auth-placeholder-copy">
          상담사 전용 정보 입력과 인증 절차가 이 레이아웃 위에 추가될 예정입니다.
        </p>
      </div>
    </CounselorAuthLayout>
  )
}

export default CounselorSignUpPage
