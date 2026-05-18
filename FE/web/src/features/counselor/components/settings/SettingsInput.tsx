import type {ReactNode} from 'react'

import type {SettingsField} from '../../types/settings'

type SettingsInputProps = {
    field: SettingsField
    value?: string
    onChange?: (value: string) => void
    readOnly?: boolean
    disabled?: boolean
    action?: ReactNode
    error?: string
    help?: string
    maxLength?: number
}

function SettingsInput({
                           field,
                           value,
                           onChange,
                           readOnly,
                           disabled,
                           action,
                           error,
                           help,
                           maxLength,
                       }: SettingsInputProps) {
    return (
        <label
            className={`counselor-settings-field${action ? ' has-action' : ''}`}
            htmlFor={`counselor-${field.id}`}
        >
            <span>{field.label}</span>
            <div className="counselor-settings-input-wrap">
                <input
                    id={`counselor-${field.id}`}
                    type={field.type ?? 'text'}
                    value={value}
                    maxLength={maxLength}
                    defaultValue={value === undefined ? field.value : undefined}
                    onChange={onChange ? (event) => onChange(event.target.value) : undefined}
                    readOnly={readOnly}
                    disabled={disabled}
                    placeholder={field.type === 'password' ? '비밀번호를 입력하세요' : undefined}
                />
                {action}
            </div>
            {error ? <small className="counselor-settings-field__error">{error}</small> : null}
            {!error && help ? <small className="counselor-settings-field__help">{help}</small> : null}
        </label>
    )
}

export default SettingsInput
