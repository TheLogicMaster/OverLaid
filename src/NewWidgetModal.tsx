import {FC, useState} from 'react'
import {ConfirmModal, ConfirmModalProps, Dropdown, DropdownOption, staticClasses} from 'decky-frontend-lib'

const NewWidgetModal: FC<ConfirmModalProps & {
    onAdd?: (type: string) => void
}> = ({onAdd, ...props}) => {

    const typeOptions: DropdownOption[] = [
        {label: "Image", data: 0},
        {label: "Text", data: 1},
    ]

    const [type, setType] = useState(0)

    return (
        <ConfirmModal {...props}
                      strOKButtonText="Add"
                      onOK={() => onAdd?.((typeOptions[type].label as string).toLowerCase())}
        >
            <div className={staticClasses.Title} style={{flexDirection: "column", boxShadow: "unset"}}>
                Add New Widget
            </div>
            <Dropdown
                rgOptions={typeOptions}
                selectedOption={type}
                onChange={selection => {
                    setType(selection.data)
                }}
            />
        </ConfirmModal>
    )
}

export default NewWidgetModal
