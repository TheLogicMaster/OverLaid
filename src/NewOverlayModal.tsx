import {FC, useState} from 'react'
import {ConfirmModal, ConfirmModalProps, staticClasses, TextField} from 'decky-frontend-lib'
import {Overlay} from "./overlaid"

const NewWidgetModal: FC<ConfirmModalProps & {
    onAdd?: (name: string) => void,
    overlays: Overlay[]
}> = ({overlays, onAdd, ...props}) => {

    const [overlayName, setOverlayName] = useState('')

    return (
        <ConfirmModal {...props}
                      bOKDisabled={overlayName.length === 0}
                      strOKButtonText="Create"
                      onOK={() => onAdd?.(overlayName)}
        >
            <div className={staticClasses.Title} style={{flexDirection: "column", boxShadow: "unset"}}>
                Create New Overlay
            </div>
            <form style={{flex: 1, padding: "0px"}}>
                <TextField
                    label="Name"
                    value={overlayName}
                    onChange={event => setOverlayName(event.target.value)}
                />
            </form>
        </ConfirmModal>
    )
}

export default NewWidgetModal
