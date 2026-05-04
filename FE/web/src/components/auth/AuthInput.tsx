import InputField, {
  type InputFieldProps,
} from '../molecules/InputField/InputField'

type AuthInputProps = InputFieldProps

function AuthInput({
  label,
  value,
  onChange,
  action,
  error,
  help,
  readOnly = false,
  status,
  ...props
}: AuthInputProps) {
  return (
    <InputField
      action={action}
      error={error}
      help={help}
      label={label}
      onChange={onChange}
      readOnly={readOnly}
      status={status}
      value={value}
      {...props}
    />
  )
}

export default AuthInput
